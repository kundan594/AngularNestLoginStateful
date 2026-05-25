import { Injectable } from '@nestjs/common';
import Tokens from 'csrf';

@Injectable()
export class CsrfService {
  private tokens: Tokens;

  constructor() {
    this.tokens = new Tokens();
  }

  /**
   * Generate a new CSRF secret
   * This should be stored in the session
   */
  generateSecret(): string {
    return this.tokens.secretSync();
  }

  /**
   * Generate a CSRF token from a secret
   * @param secret - The CSRF secret stored in session
   */
  generateToken(secret: string): string {
    return this.tokens.create(secret);
  }

  /**
   * Verify a CSRF token against a secret
   * @param secret - The CSRF secret stored in session
   * @param token - The CSRF token from the request
   */
  verifyToken(secret: string, token: string): boolean {
    return this.tokens.verify(secret, token);
  }
}

// Made with Bob
