/**
 * CORS Configuration Interface
 *
 * Defines the structure for Cross-Origin Resource Sharing (CORS) configuration.
 * This interface ensures type safety when configuring CORS policies.
 */

export interface CorsConfig {
  origin:
    | string
    | string[]
    | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

/**
 * CORS Origin Validator
 *
 * Type definition for custom origin validation function.
 * Used in production to validate allowed origins dynamically.
 */
export type CorsOriginValidator = (
  origin: string,
  callback: (err: Error | null, allow?: boolean) => void,
) => void;

/**
 * CORS Error Messages
 *
 * Standardized error messages for CORS-related issues.
 */
export const CorsErrorMessages = {
  ORIGIN_NOT_ALLOWED: 'Origin not allowed by CORS policy',
  CREDENTIALS_REQUIRED: 'CORS credentials required but not provided',
  METHOD_NOT_ALLOWED: 'HTTP method not allowed by CORS policy',
  HEADER_NOT_ALLOWED: 'HTTP header not allowed by CORS policy',
} as const;

/**
 * Development CORS Configuration
 *
 * Permissive CORS settings for local development.
 * Allows localhost origins and exposes all headers for debugging.
 */
export const developmentCorsConfig: CorsConfig = {
  origin: 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 3600, // 1 hour
};

/**
 * Production CORS Configuration Factory
 *
 * Creates a strict CORS configuration for production use.
 * Validates origins against a whitelist and restricts exposed headers.
 *
 * @param allowedOrigins - Array of allowed origin URLs
 * @returns CorsConfig object for production
 */
export const createProductionCorsConfig = (
  allowedOrigins: string[],
): CorsConfig => {
  const originValidator: CorsOriginValidator = (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    // In production, you may want to restrict this
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(CorsErrorMessages.ORIGIN_NOT_ALLOWED));
    }
  };

  return {
    origin: originValidator,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    exposedHeaders: [],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204,
  };
};

/**
 * Get CORS Configuration based on environment
 *
 * @param nodeEnv - Current NODE_ENV value
 * @param allowedOrigins - Array of allowed origins for production
 * @returns Appropriate CORS configuration
 */
export const getCorsConfig = (
  nodeEnv: string,
  allowedOrigins?: string[],
): CorsConfig => {
  if (nodeEnv === 'production') {
    if (!allowedOrigins || allowedOrigins.length === 0) {
      throw new Error('Production CORS requires at least one allowed origin');
    }
    return createProductionCorsConfig(allowedOrigins);
  }

  return developmentCorsConfig;
};

// Made with Bob
