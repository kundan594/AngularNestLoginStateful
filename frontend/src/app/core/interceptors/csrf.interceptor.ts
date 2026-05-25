import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { CsrfService } from '../services/csrf.service';

/**
 * CSRF Interceptor
 * 
 * Automatically adds CSRF token to state-changing HTTP requests
 * (POST, PUT, DELETE, PATCH)
 * 
 * GET, HEAD, and OPTIONS requests are considered safe and don't
 * require CSRF protection
 */
@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  constructor(private csrfService: CsrfService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    // Skip CSRF token for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return next.handle(request);
    }

    // Get CSRF token
    const csrfToken = this.csrfService.getToken();

    // If token exists, add it to the request header
    if (csrfToken) {
      request = request.clone({
        setHeaders: {
          'X-CSRF-Token': csrfToken,
        },
      });
    }

    return next.handle(request);
  }
}

// Made with Bob
