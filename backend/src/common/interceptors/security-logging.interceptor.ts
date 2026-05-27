import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class SecurityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('SecurityLogger');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const userId = request.user?.id || 'Anonymous';

    // Log security-relevant requests
    if (this.isSecurityRelevant(url)) {
      this.logger.log({
        event: 'SECURITY_REQUEST',
        method,
        url,
        ip,
        userAgent,
        userId,
        timestamp: new Date().toISOString(),
      });
    }

    return next.handle().pipe(
      tap(() => {
        // Log successful security operations
        if (this.isSecurityRelevant(url)) {
          this.logger.log({
            event: 'SECURITY_REQUEST_SUCCESS',
            method,
            url,
            userId,
            timestamp: new Date().toISOString(),
          });
        }
      }),
      catchError((error) => {
        // Log security failures
        this.logger.error({
          event: 'SECURITY_REQUEST_FAILED',
          method,
          url,
          userId,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }),
    );
  }

  private isSecurityRelevant(url: string): boolean {
    const securityEndpoints = [
      '/auth/login',
      '/auth/logout',
      '/auth/csrf',
      '/users',
    ];
    return securityEndpoints.some((endpoint) => url.includes(endpoint));
  }
}

// Made with Bob
