import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { fromEvent, merge, Subject } from 'rxjs';
import { debounceTime, throttleTime, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root',
})
export class KeepaliveService implements OnDestroy {
  private readonly DEBOUNCE_TIME = 2000; // 2 seconds
  private readonly THROTTLE_TIME = 60000; // 1 minute
  private destroy$ = new Subject<void>();
  private isMonitoring = false;

  constructor(
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

  /**
   * Start monitoring user activity
   */
  start(): void {
    if (this.isMonitoring) {
      return;
    }

    console.log('[KeepaliveService] Starting activity monitoring');
    this.isMonitoring = true;
    this.setupActivityListeners();
  }

  /**
   * Stop monitoring user activity
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[KeepaliveService] Stopping activity monitoring');
    this.isMonitoring = false;
    this.destroy$.next();
  }

  /**
   * Setup event listeners for user activity
   */
  private setupActivityListeners(): void {
    // Monitor various user activity events
    const activity$ = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'click'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'scroll'),
      fromEvent(window, 'focus')
    );

    // Debounce to wait for activity to stop, then throttle to limit frequency
    activity$
      .pipe(
        debounceTime(this.DEBOUNCE_TIME),
        throttleTime(this.THROTTLE_TIME),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.handleActivity();
      });
  }

  /**
   * Handle detected user activity
   */
  private handleActivity(): void {
    console.log('[KeepaliveService] Activity detected, sending keepalive');
    this.sendKeepalive();
  }

  /**
   * Send keepalive request to backend
   */
  private sendKeepalive(): void {
    this.http
      .post<{ message: string; expiresAt: number }>(
        `${environment.apiUrl}/auth/keepalive`,
        {}
      )
      .subscribe({
        next: (response) => {
          console.log('[KeepaliveService] Session extended:', response);
          // Update session service with new expiry time
          this.sessionService.updateActivity();
        },
        error: (error) => {
          console.error('[KeepaliveService] Keepalive failed:', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.stop();
  }
}

// Made with Bob
