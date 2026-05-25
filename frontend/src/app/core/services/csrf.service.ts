import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface CsrfResponse {
  csrfToken: string;
}

/**
 * CSRF Service
 * 
 * Manages CSRF token retrieval and storage for protecting
 * state-changing HTTP requests (POST, PUT, DELETE, PATCH)
 */
@Injectable({
  providedIn: 'root',
})
export class CsrfService {
  private readonly apiUrl = environment.apiUrl;
  private csrfToken$ = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Fetch CSRF token from the backend
   * The token is stored in the session on the backend
   * 
   * @returns Observable of CSRF token
   */
  fetchToken(): Observable<CsrfResponse> {
    return this.http.get<CsrfResponse>(`${this.apiUrl}/auth/csrf`).pipe(
      tap((response) => {
        this.csrfToken$.next(response.csrfToken);
      }),
    );
  }

  /**
   * Get the current CSRF token
   * 
   * @returns Current CSRF token or null
   */
  getToken(): string | null {
    return this.csrfToken$.value;
  }

  /**
   * Get CSRF token as an observable
   * Useful for components that need to react to token changes
   * 
   * @returns Observable of CSRF token
   */
  getToken$(): Observable<string | null> {
    return this.csrfToken$.asObservable();
  }

  /**
   * Clear the stored CSRF token
   * Should be called on logout
   */
  clearToken(): void {
    this.csrfToken$.next(null);
  }

  /**
   * Check if a CSRF token is currently stored
   * 
   * @returns True if token exists
   */
  hasToken(): boolean {
    return this.csrfToken$.value !== null;
  }
}

// Made with Bob
