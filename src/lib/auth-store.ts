/**
 * User Authentication Store with Email Verification
 * Uses Supabase for persistent storage across deployments
 */

import { createServerClient } from './supabase-client';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  verificationCode?: string;
  verificationExpiry?: string;
  createdAt: string;
  bio?: string;
  stats?: {
    scansPerformed: number;
    scriptsSubmitted: number;
    totalUpvotes: number;
    joinedAt: string;
  };
}

export interface Session {
  userId: string;
  username: string;
  email: string;
  emailVerified: boolean;
  token: string;
  createdAt: string;
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

class AuthStore {
  private supabase = createServerClient();

  async register(username: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (!username || username.length < 3 || username.length > 20) {
        return { success: false, error: 'Username must be 3-20 characters' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return { success: false, error: 'Valid email required' };
      }

      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const lowerUsername = username.toLowerCase();
      const lowerEmail = email.toLowerCase();

      // Check if username exists
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('username', lowerUsername)
        .single();

      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Check if email exists
      const { data: existingEmail } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', lowerEmail)
        .single();

      if (existingEmail) {
        return { success: false, error: 'Email already registered' };
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const verificationCode = generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const defaultStats = { 
        scansPerformed: 0, 
        scriptsSubmitted: 0, 
        totalUpvotes: 0, 
        joinedAt: new Date().toISOString() 
      };

      const { error } = await this.supabase
        .from('users')
        .insert({
          id: userId,
          username: lowerUsername,
          email: lowerEmail,
          password_hash: password,
          email_verified: false,
          verification_code: verificationCode,
          verification_expiry: verificationExpiry,
          bio: '',
          stats: defaultStats,
        });

      if (error) throw error;

      const user: User = {
        id: userId,
        username: lowerUsername,
        email: lowerEmail,
        passwordHash: password,
        emailVerified: false,
        verificationCode,
        verificationExpiry,
        createdAt: new Date().toISOString(),
        bio: '',
        stats: defaultStats,
      };

      return { success: true, user };
    } catch (error) {
      console.error('[AuthStore] Register error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async verifyEmail(username: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const lowerUsername = username.toLowerCase();
      
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', lowerUsername)
        .single();

      if (error || !user) {
        return { success: false, error: 'User not found' };
      }

      if (user.email_verified) {
        return { success: false, error: 'Email already verified' };
      }

      if (user.verification_code !== code) {
        return { success: false, error: 'Invalid verification code' };
      }

      if (new Date() > new Date(user.verification_expiry)) {
        return { success: false, error: 'Verification code expired' };
      }

      const { error: updateError } = await this.supabase
        .from('users')
        .update({
          email_verified: true,
          verification_code: null,
          verification_expiry: null,
        })
        .eq('username', lowerUsername);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('[AuthStore] Verify email error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  async resendVerification(username: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      const lowerUsername = username.toLowerCase();
      
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', lowerUsername)
        .single();

      if (error || !user) {
        return { success: false, error: 'User not found' };
      }

      if (user.email_verified) {
        return { success: false, error: 'Email already verified' };
      }

      const newCode = generateVerificationCode();
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await this.supabase
        .from('users')
        .update({
          verification_code: newCode,
          verification_expiry: newExpiry,
        })
        .eq('username', lowerUsername);

      if (updateError) throw updateError;

      return { success: true, code: newCode };
    } catch (error) {
      console.error('[AuthStore] Resend verification error:', error);
      return { success: false, error: 'Failed to resend code' };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; session?: Session; error?: string; needsVerification?: boolean }> {
    try {
      const lowerUsername = username.toLowerCase();
      
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', lowerUsername)
        .single();

      if (error || !user) {
        return { success: false, error: 'Invalid username or password' };
      }

      if (user.password_hash !== password) {
        return { success: false, error: 'Invalid username or password' };
      }

      if (!user.email_verified) {
        return { success: false, error: 'Please verify your email before logging in', needsVerification: true };
      }

      const token = generateToken();

      const { error: insertError } = await this.supabase
        .from('sessions')
        .insert({
          token,
          user_id: user.id,
          username: user.username,
          email: user.email,
          email_verified: user.email_verified,
        });

      if (insertError) throw insertError;

      const session: Session = {
        userId: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.email_verified,
        token,
        createdAt: new Date().toISOString(),
      };

      return { success: true, session };
    } catch (error) {
      console.error('[AuthStore] Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async validateToken(token: string): Promise<Session | null> {
    try {
      const { data: session, error } = await this.supabase
        .from('sessions')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !session) {
        return null;
      }

      return {
        userId: session.user_id,
        username: session.username,
        email: session.email,
        emailVerified: session.email_verified,
        token: session.token,
        createdAt: session.created_at,
      };
    } catch (error) {
      console.error('[AuthStore] Validate token error:', error);
      return null;
    }
  }

  async logout(token: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('sessions')
        .delete()
        .eq('token', token);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('[AuthStore] Logout error:', error);
      return false;
    }
  }

  async getUserById(userId: string): Promise<User | undefined> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) return undefined;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.password_hash,
        emailVerified: user.email_verified,
        verificationCode: user.verification_code,
        verificationExpiry: user.verification_expiry,
        createdAt: user.created_at,
        bio: user.bio,
        stats: user.stats,
      };
    } catch (error) {
      console.error('[AuthStore] Get user error:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const lowerUsername = username.toLowerCase();
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', lowerUsername)
        .single();

      if (error || !user) return undefined;

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.password_hash,
        emailVerified: user.email_verified,
        verificationCode: user.verification_code,
        verificationExpiry: user.verification_expiry,
        createdAt: user.created_at,
        bio: user.bio,
        stats: user.stats,
      };
    } catch (error) {
      console.error('[AuthStore] Get user error:', error);
      return undefined;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.stats !== undefined) updateData.stats = updates.stats;

      const { error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('[AuthStore] Update user error:', error);
      return { success: false, error: 'Update failed' };
    }
  }

  async incrementUserStat(userId: string, stat: 'scansPerformed' | 'scriptsSubmitted' | 'totalUpvotes'): Promise<void> {
    try {
      const user = await this.getUserById(userId);
      if (user && user.stats) {
        user.stats[stat]++;
        await this.updateUser(userId, { stats: user.stats });
      }
    } catch (error) {
      console.error('[AuthStore] Increment stat error:', error);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('*');

      if (error || !users) return [];

      return users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: user.password_hash,
        emailVerified: user.email_verified,
        verificationCode: user.verification_code,
        verificationExpiry: user.verification_expiry,
        createdAt: user.created_at,
        bio: user.bio,
        stats: user.stats,
      }));
    } catch (error) {
      console.error('[AuthStore] Get all users error:', error);
      return [];
    }
  }
}

export const authStore = new AuthStore();
