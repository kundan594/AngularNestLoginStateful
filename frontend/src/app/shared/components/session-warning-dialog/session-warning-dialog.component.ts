import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';

/**
 * Session Warning Dialog Component
 * 
 * Displays a warning dialog when the session is about to expire.
 * Shows a countdown timer and provides options to extend or logout.
 */
@Component({
  selector: 'app-session-warning-dialog',
  templateUrl: './session-warning-dialog.component.html',
  styleUrls: ['./session-warning-dialog.component.scss']
})
export class SessionWarningDialogComponent implements OnInit, OnDestroy {
  remainingSeconds = 0;
  private countdownSubscription?: Subscription;

  constructor(
    private sessionService: SessionService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /**
   * Start the countdown timer
   */
  private startCountdown(): void {
    // Update immediately
    this.updateRemainingTime();

    // Update every second
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.updateRemainingTime();

      // Auto-logout when time expires
      if (this.remainingSeconds <= 0) {
        this.onLogout();
      }
    });
  }

  /**
   * Stop the countdown timer
   */
  private stopCountdown(): void {
    this.countdownSubscription?.unsubscribe();
  }

  /**
   * Update remaining time from session service
   */
  private updateRemainingTime(): void {
    const remainingMs = this.sessionService.getRemainingTime();
    this.remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  }

  /**
   * Format seconds to MM:SS
   */
  get formattedTime(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Handle extend session button click
   */
  onExtendSession(): void {
    this.sessionService.extendSession();
    this.sessionService.dismissWarning();
  }

  /**
   * Handle logout button click
   */
  onLogout(): void {
    this.sessionService.dismissWarning();
    this.sessionService.endSession();
    this.authService.logout().subscribe({
      error: (error) => {
        console.error('[SessionWarningDialog] Logout failed:', error);
      },
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onExtendSession();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.onLogout();
    }
  }
}

// Made with Bob