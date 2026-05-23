export const environment = {
  production: true,
  apiUrl: '/api', // Production API URL (same origin)
  sessionDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
  warningBeforeExpiry: 5 * 60 * 1000, // 5 minutes in milliseconds
  sessionCheckInterval: 60 * 1000 // Check session every 60 seconds
};

// Made with Bob
