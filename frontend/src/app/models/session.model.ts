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
 * Broadcast message types for cross-tab synchronization
 */
export type SessionBroadcastType = 'login' | 'logout' | 'extend' | 'warning';

/**
 * Session status for cross-tab synchronization
 */
export interface SessionStatus {
  type: SessionBroadcastType;
  timestamp: number;
  userId?: string;
  expiresAt?: number;
  sourceTabId?: string;
}

// Made with Bob
