/**
 * Simple User Authentication Store
 * In-memory storage for users and sessions
 */

export interface User {
  id: string;
  username: string;
  passwordHash: string; // In production, use proper hashing
  createdAt: string;
}

export interface Session {
  userId: string;
  username: string;
  token: string;
  createdAt: string;
}

class AuthStore {
  private users: Map<string, User> = new Map(); // username -> User
  private sessions: Map<string, Session> = new Map(); // token -> Session
  private userIdCounter = 1;

  /**
   * Register a new user
   */
  register(username: string, password: string): { success: boolean; user?: User; error?: string } {
    // Validate username
    if (!username || username.length < 3 || username.length > 20) {
      return { success: false, error: 'Username must be 3-20 characters' };
    }

    // Validate password
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    // Check if username exists
    if (this.users.has(username.toLowerCase())) {
      return { success: false, error: 'Username already exists' };
    }

    const user: User = {
      id: `user_${this.userIdCounter++}`,
      username: username.toLowerCase(),
      passwordHash: password, // In production: bcrypt.hash(password, 10)
      createdAt: new Date().toISOString(),
    };

    this.users.set(username.toLowerCase(), user);
    return { success: true, user };
  }

  /**
   * Login user and create session
   */
  login(username: string, password: string): { success: boolean; session?: Session; error?: string } {
    const user = this.users.get(username.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    // In production: bcrypt.compare(password, user.passwordHash)
    if (user.passwordHash !== password) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Create session token
    const token = this.generateToken();
    const session: Session = {
      userId: user.id,
      username: user.username,
      token,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(token, session);
    return { success: true, session };
  }

  /**
   * Validate session token
   */
  validateToken(token: string): Session | null {
    return this.sessions.get(token) || null;
  }

  /**
   * Logout user
   */
  logout(token: string): boolean {
    return this.sessions.delete(token);
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.id === userId) return user;
    }
    return undefined;
  }

  /**
   * Get user by username
   */
  getUserByUsername(username: string): User | undefined {
    return this.users.get(username.toLowerCase());
  }

  private generateToken(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const authStore = new AuthStore();
