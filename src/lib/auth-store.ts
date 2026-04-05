/**
 * User Authentication Store with Email Verification
 * Uses Vercel KV for persistent storage across deployments
 */

import { kv } from '@vercel/kv';

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

const USERS_KEY = 'users';
const SESSIONS_KEY = 'sessions';

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

class AuthStore {
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
      const existingUser = await this.getUserByUsername(lowerUsername);
      if (existingUser) {
        return { success: false, error: 'Username already exists' };
      }

      // Check if email exists
      const users = await kv.hgetall<Record<string, User>>(USERS_KEY) || {};
      for (const user of Object.values(users)) {
        if (user.email === lowerEmail) {
          return { success: false, error: 'Email already registered' };
        }
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const verificationCode = generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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
        stats: {
          scansPerformed: 0,
          scriptsSubmitted: 0,
          totalUpvotes: 0,
          joinedAt: new Date().toISOString(),
        },
      };

      await kv.hset(USERS_KEY, { [userId]: user });
      return { success: true, user };
    } catch (error) {
      console.error('[AuthStore] Register error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async verifyEmail(username: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const lowerUsername = username.toLowerCase();
      const user = await this.getUserByUsername(lowerUsername);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      if (user.verificationCode !== code) {
        return { success: false, error: 'Invalid verification code' };
      }

      if (user.verificationExpiry && new Date() > new Date(user.verificationExpiry)) {
        return { success: false, error: 'Verification code expired' };
      }

      user.emailVerified = true;
      user.verificationCode = undefined;
      user.verificationExpiry = undefined;

      await kv.hset(USERS_KEY, { [user.id]: user });
      return { success: true };
    } catch (error) {
      console.error('[AuthStore] Verify email error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  async resendVerification(username: string): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      const lowerUsername = username.toLowerCase();
      const user = await this.getUserByUsername(lowerUsername);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email already verified' };
      }

      user.verificationCode = generateVerificationCode();
      user.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await kv.hset(USERS_KEY, { [user.id]: user });
      return { success: true, code: user.verificationCode };
    } catch (error) {
      console.error('[AuthStore] Resend verification error:', error);
      return { success: false, error: 'Failed to resend code' };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; session?: Session; error?: string; needsVerification?: boolean }> {
    try {
      const lowerUsername = username.toLowerCase();
      const user = await this.getUserByUsername(lowerUsername);
      
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      if (user.passwordHash !== password) {
        return { success: false, error: 'Invalid username or password' };
      }

      if (!user.emailVerified) {
        return { success: false, error: 'Please verify your email before logging in', needsVerification: true };
      }

      const token = generateToken();
      const session: Session = {
        userId: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        token,
        createdAt: new Date().toISOString(),
      };

      await kv.hset(SESSIONS_KEY, { [token]: session });
      return { success: true, session };
    } catch (error) {
      console.error('[AuthStore] Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async validateToken(token: string): Promise<Session | null> {
    try {
      const session = await kv.hget<Session>(SESSIONS_KEY, token);
      return session || null;
    } catch (error) {
      console.error('[AuthStore] Validate token error:', error);
      return null;
    }
  }

  async logout(token: string): Promise<boolean> {
    try {
      await kv.hdel(SESSIONS_KEY, token);
      return true;
    } catch (error) {
      console.error('[AuthStore] Logout error:', error);
      return false;
    }
  }

  async getUserById(userId: string): Promise<User | undefined> {
    try {
      const user = await kv.hget<User>(USERS_KEY, userId);
      return user || undefined;
    } catch (error) {
      console.error('[AuthStore] Get user error:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const users = await kv.hgetall<Record<string, User>>(USERS_KEY) || {};
      for (const user of Object.values(users)) {
        if (user.username === username.toLowerCase()) {
          return user;
        }
      }
      return undefined;
    } catch (error) {
      console.error('[AuthStore] Get user by username error:', error);
      return undefined;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const updatedUser = { ...user, ...updates };
      await kv.hset(USERS_KEY, { [userId]: updatedUser });
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
        await kv.hset(USERS_KEY, { [userId]: user });
      }
    } catch (error) {
      console.error('[AuthStore] Increment stat error:', error);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const users = await kv.hgetall<Record<string, User>>(USERS_KEY) || {};
      return Object.values(users);
    } catch (error) {
      console.error('[AuthStore] Get all users error:', error);
      return [];
    }
  }
}

export const authStore = new AuthStore();
