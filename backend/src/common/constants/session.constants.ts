/**
 * Session Constants
 * 
 * Centralized constants for session management throughout the application.
 * These constants ensure consistency and make it easier to update values globally.
 */

/**
 * Session Cookie Configuration
 */
export const SESSION_COOKIE_NAME = 'sessionId';
export const SESSION_MAX_AGE = 30 * 60 * 1000; // 30 minutes in milliseconds
export const SESSION_TTL = 1800; // 30 minutes in seconds (for Redis)

/**
 * Session Storage Keys
 */
export const SESSION_KEY_PREFIX = 'sess:'; // Redis key prefix for sessions
export const USER_SESSIONS_KEY_PREFIX = 'user:'; // Redis key prefix for user session tracking

/**
 * Session Activity Thresholds
 */
export const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // Warn user 5 minutes before expiry
export const SESSION_KEEPALIVE_INTERVAL = 5 * 60 * 1000; // Send keepalive every 5 minutes
export const SESSION_ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check for activity every minute

/**
 * Session Security Settings
 */
export const MAX_SESSIONS_PER_USER = 5; // Maximum concurrent sessions per user
export const SESSION_ROTATION_INTERVAL = 15 * 60 * 1000; // Rotate session ID every 15 minutes

/**
 * Session Metadata Keys
 * 
 * Keys used to store metadata in the session object.
 */
export const SESSION_METADATA_KEYS = {
  USER_ID: 'userId',
  USERNAME: 'username',
  ROLES: 'roles',
  CREATED_AT: 'createdAt',
  LAST_ACTIVITY: 'lastActivity',
  IP_ADDRESS: 'ipAddress',
  USER_AGENT: 'userAgent',
  CSRF_SECRET: 'csrfSecret',
  METADATA: 'metadata',
} as const;

/**
 * Session Events
 * 
 * Event names for session lifecycle management.
 * Can be used with EventEmitter for session monitoring.
 */
export const SESSION_EVENTS = {
  CREATED: 'session.created',
  VALIDATED: 'session.validated',
  EXTENDED: 'session.extended',
  EXPIRED: 'session.expired',
  DESTROYED: 'session.destroyed',
  ERROR: 'session.error',
} as const;

/**
 * Session Error Messages
 * 
 * Standardized error messages for session-related issues.
 */
export const SESSION_ERROR_MESSAGES = {
  NOT_FOUND: 'Session not found or expired',
  INVALID: 'Invalid session',
  EXPIRED: 'Session has expired',
  UNAUTHORIZED: 'Unauthorized - No valid session',
  MAX_SESSIONS_EXCEEDED: 'Maximum number of concurrent sessions exceeded',
  CSRF_INVALID: 'Invalid CSRF token',
} as const;

/**
 * Redis Connection Settings
 */
export const REDIS_RETRY_DELAY_MIN = 50; // Minimum retry delay in ms
export const REDIS_RETRY_DELAY_MAX = 2000; // Maximum retry delay in ms
export const REDIS_MAX_RETRIES = 3; // Maximum number of retry attempts

/**
 * Session Cleanup Settings
 */
export const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // Run cleanup every hour
export const SESSION_CLEANUP_BATCH_SIZE = 100; // Process sessions in batches

// Made with Bob
