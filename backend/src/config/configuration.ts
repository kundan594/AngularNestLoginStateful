/**
 * Main Configuration Factory
 * 
 * This function loads and validates all environment variables
 * and returns a structured configuration object.
 * 
 * Configuration is organized by domain:
 * - app: General application settings
 * - session: Session management configuration
 * - redis: Redis connection settings
 * - cors: CORS policy configuration
 * - security: Security-related settings
 */
export default () => ({
  // Application Configuration
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV !== 'production',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'change-me-in-production',
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Extend session on each request
    cookie: {
      httpOnly: true, // Prevent XSS attacks
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict' as const, // CSRF protection
      maxAge: 2 * 60 * 1000, // 2 minutes (TESTING - change back to 30 minutes for production)
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
    },
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'sess:',
    ttl: 1800, // 30 minutes in seconds
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  },

  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: process.env.NODE_ENV === 'development' ? ['Set-Cookie'] : [],
    maxAge: 86400, // 24 hours
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    csrfEnabled: process.env.CSRF_ENABLED !== 'false',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Database Configuration (placeholder for future implementation)
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'auth_db',
  },
});

// Made with Bob
