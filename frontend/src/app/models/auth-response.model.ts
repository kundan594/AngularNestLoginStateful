import { User } from './user.model';

/**
 * Authentication response from login endpoint
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  csrfToken?: string;
}

/**
 * Session validation response
 */
export interface SessionValidationResponse {
  valid: boolean;
  user?: User;
  expiresAt?: Date;
}

/**
 * Generic API error response
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

// Made with Bob
