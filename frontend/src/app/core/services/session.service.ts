import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Session } from '../../models/session.model';

/**
 * Session Service
 * 
 * Manages session state, expiration tracking, and session warnings.
 * Provides reactive session information throughout the application.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private sessionWarningSubject = new BehaviorSubject<boolean>(false);
  private sessionExpiryTimer: any;

  public session$ = this.sessionSubject.asObservable();
  public sessionWarning$ = this.sessionWarningSubject.asObservable();

  // Session configuration (in milliseconds)
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

  constructor() {}

  /**
   * Get current session value
   */
  get currentSession(): Session | null {
    return this.sessionSubject.value;
  }

  /**
   * Check if session warning should be shown
   */
  get showWarning(): boolean {
    return this.sessionWarningSubject.value;
  }

  /**
   * Start a new session
   * 
   * @param userId - User ID for the session
   */
  startSession(userId: string): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION);

    const session: Session = {
      userId,
      createdAt: now,
      expiresAt,
      lastActivity: now,
    };

    this.sessionSubject.next(session);
    this.startExpiryTimer(expiresAt);
  }

  /**
   * Update session activity timestamp
   * Extends session expiration
   */
  updateActivity(): void {
    const currentSession = this.sessionSubject.value;
    if (!currentSession) {
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.SESSION_DURATION);

    const updatedSession: Session = {
      ...currentSession,
      lastActivity: now,
      expiresAt,
    };

    this.sessionSubject.next(updatedSession);
    this.sessionWarningSubject.next(false);
    this.startExpiryTimer(expiresAt);
  }

  /**
   * End the current session
   */
  endSession(): void {
    this.sessionSubject.next(null);
    this.sessionWarningSubject.next(false);
    this.clearExpiryTimer();
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(): boolean {
    const session = this.sessionSubject.value;
    if (!session) {
      return true;
    }

    return new Date() >= session.expiresAt;
  }

  /**
   * Get remaining session time in milliseconds
   */
  getRemainingTime(): number {
    const session = this.sessionSubject.value;
    if (!session) {
      return 0;
    }

    const remaining = session.expiresAt.getTime() - new Date().getTime();
    return Math.max(0, remaining);
  }

  /**
   * Dismiss session warning
   */
  dismissWarning(): void {
    this.sessionWarningSubject.next(false);
  }

  /**
   * Start timer to track session expiry and show warning
   */
  private startExpiryTimer(expiresAt: Date): void {
    this.clearExpiryTimer();

    const warningTime = expiresAt.getTime() - this.WARNING_THRESHOLD;
    const now = new Date().getTime();

    // Set warning timer
    if (warningTime > now) {
      const warningDelay = warningTime - now;
      setTimeout(() => {
        this.sessionWarningSubject.next(true);
      }, warningDelay);
    }

    // Set expiry timer
    const expiryDelay = expiresAt.getTime() - now;
    this.sessionExpiryTimer = setTimeout(() => {
      this.endSession();
    }, expiryDelay);
  }

  /**
   * Clear expiry timer
   */
  private clearExpiryTimer(): void {
    if (this.sessionExpiryTimer) {
      clearTimeout(this.sessionExpiryTimer);
      this.sessionExpiryTimer = null;
    }
  }
}

// Made with Bob
