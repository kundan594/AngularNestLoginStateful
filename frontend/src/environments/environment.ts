// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiUrl: 'http://localhost:4200/api', // Proxied to backend at localhost:3000
  sessionDuration: 30 * 60 * 1000, // 30 minutes in milliseconds
  warningBeforeExpiry: 5 * 60 * 1000, // 5 minutes in milliseconds
  sessionCheckInterval: 60 * 1000 // Check session every 60 seconds
};

// Made with Bob
