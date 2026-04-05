/**
 * User Authentication Store with Email Verification
 * Server-side sessions with HTTP-only cookies
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  emailVerified: boolean;
  verificationCode?: string;
  verificationExpiry?: string;
  createdAt: string;
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

class AuthStore {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private userIdCounter = 1;

  register(username: string, email: string, password: string): { success: boolean; user?: User; error?: string } {
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

    if (this.users.has(username.toLowerCase())) {
      return { success: false, error: 'Username already exists' };
    }

    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return { success: false, error: 'Email already registered' };
      }
    }

    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const user: User = {
      id: `user_${this.userIdCounter++}`,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: password,
      emailVerified: false,
      verificationCode,
      verificationExpiry,
      createdAt: new Date().toISOString(),
    };

    this.users.set(username.toLowerCase(), user);
    return { success: true, user };
  }

  verifyEmail(username: string, code: string): { success: boolean; error?: string } {
    const user = this.users.get(username.toLowerCase());
    
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

    return { success: true };
  }

  resendVerification(username: string): { success: boolean; code?: string; error?: string } {
    const user = this.users.get(username.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.emailVerified) {
      return { success: false, error: 'Email already verified' };
    }

    user.verificationCode = generateVerificationCode();
    user.verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return { success: true, code: user.verificationCode };
  }

  login(username: string, password: string): { success: boolean; session?: Session; error?: string } {
    const user = this.users.get(username.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    if (user.passwordHash !== password) {
      return { success: false, error: 'Invalid username or password' };
    }

    const token = this.generateToken();
    const session: Session = {
      userId: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      token,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(token, session);
    return { success: true, session };
  }

  validateToken(token: string): Session | null {
    return this.sessions.get(token) || null;
  }

  logout(token: string): boolean {
    return this.sessions.delete(token);
  }

  getUserById(userId: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.id === userId) return user;
    }
    return undefined;
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.get(username.toLowerCase());
  }

  userExists(username: string): boolean {
    return this.users.has(username.toLowerCase());
  }

  private generateToken(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const authStore = new AuthStore();
