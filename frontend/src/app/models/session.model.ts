/**
 * Session model representing session state and metadata
 */
export interface Session {
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivity: Date;
}

/**
 * Session status for cross-tab synchronization
 */
export interface SessionStatus {
  type: 'login' | 'logout' | 'refresh' | 'warning';
  timestamp: number;
  expiresAt?: number;
}

// Made with Bob
