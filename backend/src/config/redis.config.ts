/**
 * Redis Configuration Interface
 * 
 * Defines the structure for Redis connection and session store configuration.
 * This interface ensures type safety when configuring Redis throughout the application.
 */

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  ttl: number;
  retryStrategy: (times: number) => number;
  maxRetriesPerRequest: number;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
}

/**
 * Redis Store Options
 * 
 * Configuration options specifically for the connect-redis session store.
 * These options control how sessions are stored and managed in Redis.
 */
export interface RedisStoreOptions {
  prefix: string; // Key prefix for session storage (e.g., 'sess:')
  ttl: number; // Time to live in seconds
  disableTouch?: boolean; // Disable session touch (update TTL on access)
  disableTTL?: boolean; // Disable automatic TTL management
  serializer?: {
    parse: (data: string) => any;
    stringify: (data: any) => string;
  };
}

/**
 * Redis Connection Status
 * 
 * Enum representing possible Redis connection states.
 * Useful for health checks and monitoring.
 */
export enum RedisConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  READY = 'ready',
  ERROR = 'error',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
}

/**
 * Redis Health Check Response
 * 
 * Structure for Redis health check responses.
 */
export interface RedisHealthCheck {
  status: RedisConnectionStatus;
  uptime?: number;
  connectedClients?: number;
  usedMemory?: string;
  lastError?: string;
}

// Made with Bob
