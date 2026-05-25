import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { CsrfService } from '../csrf.service';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrfService: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Only validate state-changing methods
    // GET, HEAD, OPTIONS are safe methods that don't modify state
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Get CSRF token from header
    const csrfToken = request.headers['x-csrf-token'] as string;
    
    // Get CSRF secret from session
    const csrfSecret = request.session?.csrfSecret;

    // Validate token and secret exist
    if (!csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (!csrfSecret) {
      throw new ForbiddenException('CSRF secret not found in session');
    }

    // Verify the token
    const isValid = this.csrfService.verifyToken(csrfSecret, csrfToken);

    if (!isValid) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}

// Made with Bob
