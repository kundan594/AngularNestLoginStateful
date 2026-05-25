import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Error Interceptor
 * 
 * Handles HTTP errors globally, especially authentication errors
 * Automatically logs out user on 401 (Unauthorized) responses
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Unauthorized - clear auth state and redirect to login
          this.authService.clearAuthState();
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url },
          });
        } else if (error.status === 403) {
          // Forbidden - user is authenticated but not authorized
          console.error('Access forbidden:', error.message);
        } else if (error.status === 0) {
          // Network error or CORS issue
          console.error('Network error:', error.message);
        }

        // Re-throw the error for component-level handling
        return throwError(() => error);
      }),
    );
  }
}

// Made with Bob
