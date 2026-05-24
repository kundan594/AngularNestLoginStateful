import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * Authenticated Guard
 * 
 * Protects routes by checking if user is authenticated
 * Uses Passport's isAuthenticated() method from session
 * 
 * Usage:
 * @UseGuards(AuthenticatedGuard)
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  /**
   * Determines if the request can proceed
   * 
   * @param context - Execution context containing request
   * @returns true if user is authenticated, false otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    return request.isAuthenticated();
  }
}

// Made with Bob
