/**
 * Session model representing session state and metadata
 */
export interface Session {
  isAuthenticated: boolean;
  expiresAt: Date;
  lastActivity: Date;
  csrfToken?: string;
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
