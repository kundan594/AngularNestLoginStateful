/**
 * Session Configuration Interface
 * 
 * Defines the structure for session management configuration.
 * This interface ensures type safety when accessing session settings
 * throughout the application.
 */

export interface SessionConfig {
  secret: string;
  name: string;
  resave: boolean;
  saveUninitialized: boolean;
  rolling: boolean;
  cookie: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    domain?: string;
    path: string;
  };
}

/**
 * Session Data Interface
 * 
 * Defines the structure of data stored in the session.
 * This is what gets serialized and stored in Redis.
 */
export interface SessionData {
  userId: string;
  username: string;
  roles: string[];
  createdAt: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  csrfSecret: string;
  metadata?: {
    loginMethod?: 'password' | 'oauth';
    deviceId?: string;
    location?: string;
  };
}

/**
 * Express Session Extension
 * 
 * Extends the Express Session type to include our custom SessionData.
 * This provides type safety when accessing session data in controllers.
 */
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    roles?: string[];
    createdAt?: number;
    lastActivity?: number;
    ipAddress?: string;
    userAgent?: string;
    csrfSecret?: string;
    metadata?: {
      loginMethod?: 'password' | 'oauth';
      deviceId?: string;
      location?: string;
    };
  }
}

// Made with Bob
