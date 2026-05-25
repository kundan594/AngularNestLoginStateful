import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user.model';
import { AuthResponse } from '../../models/auth-response.model';
import { CsrfService } from './csrf.service';
import { BroadcastService } from './broadcast.service';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SessionResponse {
  user: User;
  authenticated: boolean;
}

interface StatusResponse {
  authenticated: boolean;
  user: User | null;
}

/**
 * Authentication Service
 * 
 * Manages user authentication, login/logout operations,
 * and authentication state throughout the application.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private csrfService: CsrfService,
    private broadcastService: BroadcastService,
  ) {}

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get authentication status
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Login user with email and password
   * Fetches CSRF token before login
   * 
   * @param credentials - User email and password
   * @returns Observable of authentication response
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    // First fetch CSRF token, then login
    return this.csrfService.fetchToken().pipe(
      switchMap(() =>
        this.http
          .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
          .pipe(
            tap((response) => {
              this.currentUserSubject.next(response.user);
              this.isAuthenticatedSubject.next(true);
              this.broadcastService.broadcast('login', {
                userId: response.user.id,
              });
            }),
            catchError((error) => {
              this.currentUserSubject.next(null);
              this.isAuthenticatedSubject.next(false);
              return throwError(() => error);
            }),
          ),
      ),
    );
  }

  /**
   * Logout current user
   * Clears CSRF token after logout
   * 
   * @returns Observable of logout response
   */
  logout(): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.isAuthenticatedSubject.next(false);
          this.csrfService.clearToken();
          this.broadcastService.broadcast('logout');
        }),
        catchError((error) => {
          // Even if logout fails, clear local state
          this.currentUserSubject.next(null);
          this.isAuthenticatedSubject.next(false);
          this.csrfService.clearToken();
          this.broadcastService.broadcast('logout');
          return throwError(() => error);
        }),
      );
  }

  /**
   * Check authentication status from backend
   * 
   * @returns Observable of status response
   */
  checkStatus(): Observable<StatusResponse> {
    return this.http.get<StatusResponse>(`${this.apiUrl}/auth/status`).pipe(
      tap((response) => {
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(response.authenticated);
      }),
      catchError((error) => {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Get current session information
   * Requires authentication
   * 
   * @returns Observable of session response
   */
  getSession(): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/auth/session`).pipe(
      tap((response) => {
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(response.authenticated);
      }),
      catchError((error) => {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Clear authentication state
   * Used when session expires or on 401 errors
   */
  clearAuthState(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.csrfService.clearToken();
  }

  /**
   * Apply authentication state changes received from another tab.
   */
  syncLogin(user: User): void {
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Apply logout state changes received from another tab.
   */
  syncLogout(): void {
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.csrfService.clearToken();
  }
}

// Made with Bob
