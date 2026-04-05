/**
 * User Authentication Store with Email Verification
 * Uses Vercel Postgres for persistent storage across deployments
 */

import { sql } from '@vercel/postgres';

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
  private initialized = false;

  private async init() {
    if (this.initialized) return;
    
    try {
      // Create users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          verification_code TEXT,
          verification_expiry TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          bio TEXT DEFAULT '',
          stats JSONB DEFAULT '{"scansPerformed": 0, "scriptsSubmitted": 0, "totalUpvotes": 0}'::jsonb
        );
      `;

      // Create sessions table
      await sql`
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          username TEXT NOT NULL,
          email TEXT NOT NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create votes table for community submissions
      await sql`
        CREATE TABLE IF NOT EXISTS user_votes (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          submission_id TEXT NOT NULL,
          vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id, submission_id)
        );
      `;

      // Create community submissions table
      await sql`
        CREATE TABLE IF NOT EXISTS community_submissions (
          id TEXT PRIMARY KEY,
          scan_id TEXT NOT NULL,
          submitted_by TEXT NOT NULL,
          user_id TEXT,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
          report JSONB NOT NULL,
          upvotes INTEGER DEFAULT 0,
          downvotes INTEGER DEFAULT 0,
          details JSONB
        );
      `;

      this.initialized = true;
      console.log('[AuthStore] Database initialized');
    } catch (error) {
      console.error('[AuthStore] Failed to initialize:', error);
      throw error;
    }
  }

  async register(username: string, email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    await this.init();

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
      const existingUser = await sql`SELECT id FROM users WHERE username = ${lowerUsername}`;
      if (existingUser.rowCount > 0) {
        return { success: false, error: 'Username already exists' };
      }

      // Check if email exists
      const existingEmail = await sql`SELECT id FROM users WHERE email = ${lowerEmail}`;
      if (existingEmail.rowCount > 0) {
        return { success: false, error: 'Email already registered' };
      }

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const verificationCode = generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const defaultStats = { scansPerformed: 0, scriptsSubmitted: 0, totalUpvotes: 0, joinedAt: new Date().toISOString() };

      await sql`
        INSERT INTO users (id, username, email, password_hash, email_verified, verification_code, verification_expiry, bio, stats)
        VALUES (${userId}, ${lowerUsername}, ${lowerEmail}, ${password}, FALSE, ${verificationCode}, ${verificationExpiry}, '', ${JSON.stringify(defaultStats)})
      `;

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
    await this.init();

    try {
      const lowerUsername = username.toLowerCase();
      
      const result = await sql`
        SELECT * FROM users WHERE username = ${lowerUsername}
      `;

      if (result.rowCount === 0) {
        return { success: false, error: 'User not found' };
      }

      const user = result.rows[0];

      if (user.email_verified) {
        return { success: false, error: 'Email already verified' };
      }

      if (user.verification_code !== code) {
        return { success: false, error: 'Invalid verification code' };
      }

      if (new Date() > new Date(user.verification_expiry)) {
        return { success: false, error: 'Verification code expired' };
      }

      await sql`
        UPDATE users 
        SET email_verified = TRUE, verification_code = NULL, verification_expiry = NULL
        WHERE username = ${lowerUsername}
      `;

      return { success: true };
    } catch (error) {
      console.error('[AuthStore] Verify email error:', error);
      return { success: false, error: 'Verification failed' };
    }
  }

  async resendVerification(username: string): Promise<{ success: boolean; code?: string; error?: string }> {
    await this.init();

    try {
      const lowerUsername = username.toLowerCase();
      
      const result = await sql`
        SELECT * FROM users WHERE username = ${lowerUsername}
      `;

      if (result.rowCount === 0) {
        return { success: false, error: 'User not found' };
      }

      const user = result.rows[0];

      if (user.email_verified) {
        return { success: false, error: 'Email already verified' };
      }

      const newCode = generateVerificationCode();
      const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      await sql`
        UPDATE users 
        SET verification_code = ${newCode}, verification_expiry = ${newExpiry}
        WHERE username = ${lowerUsername}
      `;

      return { success: true, code: newCode };
    } catch (error) {
      console.error('[AuthStore] Resend verification error:', error);
      return { success: false, error: 'Failed to resend code' };
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; session?: Session; error?: string; needsVerification?: boolean }> {
    await this.init();

    try {
      const lowerUsername = username.toLowerCase();
      
      const result = await sql`
        SELECT * FROM users WHERE username = ${lowerUsername}
      `;

      if (result.rowCount === 0) {
        return { success: false, error: 'Invalid username or password' };
      }

      const user = result.rows[0];

      if (user.password_hash !== password) {
        return { success: false, error: 'Invalid username or password' };
      }

      if (!user.email_verified) {
        return { success: false, error: 'Please verify your email before logging in', needsVerification: true };
      }

      const token = generateToken();

      await sql`
        INSERT INTO sessions (token, user_id, username, email, email_verified)
        VALUES (${token}, ${user.id}, ${user.username}, ${user.email}, ${user.email_verified})
      `;

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
    await this.init();

    try {
      const result = await sql`
        SELECT * FROM sessions WHERE token = ${token}
      `;

      if (result.rowCount === 0) {
        return null;
      }

      const session = result.rows[0];

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
    await this.init();

    try {
      await sql`DELETE FROM sessions WHERE token = ${token}`;
      return true;
    } catch (error) {
      console.error('[AuthStore] Logout error:', error);
      return false;
    }
  }

  async getUserById(userId: string): Promise<User | undefined> {
    await this.init();

    try {
      const result = await sql`SELECT * FROM users WHERE id = ${userId}`;
      
      if (result.rowCount === 0) return undefined;

      const user = result.rows[0];
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
    await this.init();

    try {
      const lowerUsername = username.toLowerCase();
      const result = await sql`SELECT * FROM users WHERE username = ${lowerUsername}`;
      
      if (result.rowCount === 0) return undefined;

      const user = result.rows[0];
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
    await this.init();

    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (updates.bio !== undefined) {
        await sql`UPDATE users SET bio = ${updates.bio} WHERE id = ${userId}`;
      }

      if (updates.stats !== undefined) {
        await sql`UPDATE users SET stats = ${JSON.stringify(updates.stats)} WHERE id = ${userId}`;
      }

      return { success: true };
    } catch (error) {
      console.error('[AuthStore] Update user error:', error);
      return { success: false, error: 'Update failed' };
    }
  }

  async incrementUserStat(userId: string, stat: 'scansPerformed' | 'scriptsSubmitted' | 'totalUpvotes'): Promise<void> {
    await this.init();

    try {
      const user = await this.getUserById(userId);
      if (user && user.stats) {
        user.stats[stat]++;
        await sql`UPDATE users SET stats = ${JSON.stringify(user.stats)} WHERE id = ${userId}`;
      }
    } catch (error) {
      console.error('[AuthStore] Increment stat error:', error);
    }
  }

  async getAllUsers(): Promise<User[]> {
    await this.init();

    try {
      const result = await sql`SELECT * FROM users`;
      return result.rows.map(user => ({
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
