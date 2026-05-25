import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Session, SessionStatus } from '../../models/session.model';
import { BroadcastService } from './broadcast.service';
import { AuthService } from './auth.service';

/**
 * Session Service
 * 
 * Manages session state, expiration tracking, and session warnings.
 * Provides reactive session information throughout the application.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionService implements OnDestroy {
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private sessionWarningSubject = new BehaviorSubject<boolean>(false);
  private sessionExpiryTimer: any;
  private warningTimer: any;
  private readonly broadcastSubscription: Subscription;

  public session$ = this.sessionSubject.asObservable();
  public sessionWarning$ = this.sessionWarningSubject.asObservable();

  // Session configuration (in milliseconds)
  // TODO: Change back to production values after popup verification
  private readonly SESSION_DURATION = 2 * 60 * 1000; // 2 minutes (TESTING)
  private readonly WARNING_THRESHOLD = 90 * 1000; // 90 seconds before expiry (TESTING)

  constructor(
    private broadcastService: BroadcastService,
    private authService: AuthService,
  ) {
    this.broadcastSubscription = this.broadcastService.messages$.subscribe((message) => {
      this.handleBroadcastMessage(message);
    });
  }

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

    console.log('[SessionService] Starting session:', {
      userId,
      sessionDuration: this.SESSION_DURATION / 1000 + ' seconds',
      warningThreshold: this.WARNING_THRESHOLD / 1000 + ' seconds',
      expiresAt: expiresAt.toLocaleTimeString(),
      warningAt: new Date(expiresAt.getTime() - this.WARNING_THRESHOLD).toLocaleTimeString()
    });

    this.applySessionState(userId, now, expiresAt);
    this.broadcastService.broadcast('login', {
      userId,
      expiresAt: expiresAt.getTime(),
    });
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

    this.applySessionState(currentSession.userId, currentSession.createdAt, expiresAt, now);
    this.broadcastService.broadcast('extend', {
      userId: currentSession.userId,
      expiresAt: expiresAt.getTime(),
    });
  }

  /**
   * Extend session (keepalive)
   * Sends keepalive request to backend and updates local session
   */
  extendSession(): void {
    // This will be implemented with the keepalive service
    // For now, just update activity which extends the session
    this.updateActivity();
  }

  /**
   * End the current session
   */
  endSession(): void {
    this.clearLocalSession();
    this.broadcastService.broadcast('logout');
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
   * Apply a session start received from another tab.
   */
  syncSessionStart(userId: string, expiresAt?: number): void {
    const now = new Date();
    const resolvedExpiresAt = expiresAt ? new Date(expiresAt) : new Date(now.getTime() + this.SESSION_DURATION);

    this.applySessionState(userId, now, resolvedExpiresAt);
  }

  /**
   * Apply a session extension received from another tab.
   */
  syncSessionExtension(expiresAt?: number): void {
    const currentSession = this.sessionSubject.value;
    if (!currentSession) {
      return;
    }

    const now = new Date();
    const resolvedExpiresAt = expiresAt ? new Date(expiresAt) : new Date(now.getTime() + this.SESSION_DURATION);

    this.applySessionState(
      currentSession.userId,
      currentSession.createdAt,
      resolvedExpiresAt,
      now,
    );
  }

  /**
   * Apply a logout received from another tab.
   */
  syncSessionEnd(): void {
    this.clearLocalSession();
  }

  ngOnDestroy(): void {
    this.broadcastSubscription.unsubscribe();
    this.clearExpiryTimer();
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
      console.log('[SessionService] Setting warning timer:', {
        warningDelay: warningDelay / 1000 + ' seconds',
        willShowAt: new Date(now + warningDelay).toLocaleTimeString()
      });
      this.warningTimer = setTimeout(() => {
        console.log('[SessionService] ⚠️ SHOWING WARNING DIALOG');
        this.sessionWarningSubject.next(true);
        this.broadcastService.broadcast('warning', {
          userId: this.sessionSubject.value?.userId,
          expiresAt: expiresAt.getTime(),
        });
      }, warningDelay);
    } else {
      console.log('[SessionService] Warning time already passed, showing immediately');
      this.sessionWarningSubject.next(true);
      this.broadcastService.broadcast('warning', {
        userId: this.sessionSubject.value?.userId,
        expiresAt: expiresAt.getTime(),
      });
    }

    // Set expiry timer
    const expiryDelay = expiresAt.getTime() - now;
    console.log('[SessionService] Setting expiry timer:', {
      expiryDelay: expiryDelay / 1000 + ' seconds',
      willExpireAt: new Date(now + expiryDelay).toLocaleTimeString()
    });
    this.sessionExpiryTimer = setTimeout(() => {
      console.log('[SessionService] 🚪 SESSION EXPIRED - Auto logout');
      this.endSession();
      // Trigger logout through auth service
      this.authService.logout().subscribe({
        next: () => {
          console.log('[SessionService] Logout successful');
        },
        error: (err) => {
          console.error('[SessionService] Logout error:', err);
          // Clear local state even if logout fails
          this.clearLocalSession();
        }
      });
    }, expiryDelay);
  }

  /**
   * Clear expiry timer
   */
  private clearExpiryTimer(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }

    if (this.sessionExpiryTimer) {
      clearTimeout(this.sessionExpiryTimer);
      this.sessionExpiryTimer = null;
    }
  }

  /**
   * Clear only local session state without rebroadcasting.
   */
  private clearLocalSession(): void {
    this.sessionSubject.next(null);
    this.sessionWarningSubject.next(false);
    this.clearExpiryTimer();
  }

  /**
   * Handle synchronization messages coming from other tabs.
   */
  private handleBroadcastMessage(message: SessionStatus): void {
    switch (message.type) {
      case 'login':
        if (message.userId) {
          this.syncSessionStart(message.userId, message.expiresAt);
          this.authService.checkStatus().subscribe({
            next: (response) => {
              if (response.authenticated && response.user) {
                this.authService.syncLogin(response.user);
              }
            },
            error: () => {
              this.authService.syncLogout();
              this.clearLocalSession();
            },
          });
        }
        break;
      case 'logout':
        this.authService.syncLogout();
        this.syncSessionEnd();
        break;
      case 'extend':
        this.syncSessionExtension(message.expiresAt);
        break;
      case 'warning':
        this.sessionWarningSubject.next(true);
        break;
    }
  }

  /**
   * Apply local session state consistently.
   */
  private applySessionState(
    userId: string,
    createdAt: Date,
    expiresAt: Date,
    lastActivity: Date = new Date(),
  ): void {
    const session: Session = {
      userId,
      createdAt,
      expiresAt,
      lastActivity,
    };

    this.sessionSubject.next(session);
    this.sessionWarningSubject.next(false);
    this.startExpiryTimer(expiresAt);
  }
}

// Made with Bob
