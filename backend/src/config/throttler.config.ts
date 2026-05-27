// Throttler configuration
// Note: For production with multiple instances, consider implementing Redis storage
// using a custom storage provider

export const getThrottlerConfig = () => {
  return {
    throttlers: [
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 1000, // 1000 requests per 15 minutes
      },
    ],
  };
};

// Made with Bob
