import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, merge, Subscription } from 'rxjs';
import { debounceTime, throttleTime } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

/**
 * Keepalive Service
 * 
 * Detects user activity and automatically extends the session
 * to keep users logged in while they're actively using the application.
 */
@Injectable({
  providedIn: 'root',
})
export class KeepaliveService implements OnDestroy {
  private readonly apiUrl = environment.apiUrl;
  private activitySubscription?: Subscription;
  private isActive = false;

  // Configuration
  private readonly DEBOUNCE_TIME = 2000; // 2 seconds - wait for activity to stop
  private readonly THROTTLE_TIME = 60000; // 1 minute - minimum time between keepalive requests

  constructor(
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

  /**
   * Start monitoring user activity
   */
  start(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.setupActivityListeners();
  }

  /**
   * Stop monitoring user activity
   */
  stop(): void {
    this.isActive = false;
    this.activitySubscription?.unsubscribe();
  }

  /**
   * Setup event listeners for user activity
   */
  private setupActivityListeners(): void {
    // Activity events to monitor
    const mouseMove$ = fromEvent(document, 'mousemove');
    const mouseClick$ = fromEvent(document, 'click');
    const keyPress$ = fromEvent(document, 'keypress');
    const touchStart$ = fromEvent(document, 'touchstart');
    const scroll$ = fromEvent(document, 'scroll', { passive: true });
    const focus$ = fromEvent(window, 'focus');

    // Merge all activity events
    const activity$ = merge(
      mouseMove$,
      mouseClick$,
      keyPress$,
      touchStart$,
      scroll$,
      focus$
    );

    // Debounce to wait for activity to stop, then throttle to limit requests
    this.activitySubscription = activity$
      .pipe(
        debounceTime(this.DEBOUNCE_TIME),
        throttleTime(this.THROTTLE_TIME)
      )
      .subscribe(() => {
        this.handleActivity();
      });
  }

  /**
   * Handle detected user activity
   */
  private handleActivity(): void {
    // Only send keepalive if session exists and is not expired
    if (!this.sessionService.currentSession || this.sessionService.isSessionExpired()) {
      return;
    }

    // Send keepalive request to backend
    this.sendKeepalive().subscribe({
      next: (response) => {
        // Update local session with new expiry time
        if (response.expiresAt) {
          this.sessionService.updateActivity();
        }
      },
      error: (error) => {
        console.error('Keepalive request failed:', error);
        // Don't stop monitoring on error - might be temporary network issue
      }
    });
  }

  /**
   * Send keepalive request to backend
   */
  private sendKeepalive() {
    return this.http.post<{ message: string; expiresAt?: number }>(
      `${this.apiUrl}/auth/keepalive`,
      {}
    );
  }

  ngOnDestroy(): void {
    this.stop();
  }
}

// Made with Bob