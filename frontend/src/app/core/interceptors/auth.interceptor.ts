import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Auth Interceptor
 * 
 * Adds credentials (cookies) to all HTTP requests
 * This ensures session cookies are sent with every request
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    // Clone request and add withCredentials flag
    // This ensures cookies are sent with cross-origin requests
    const authReq = request.clone({
      withCredentials: true,
    });

    return next.handle(authReq);
  }
}

// Made with Bob
