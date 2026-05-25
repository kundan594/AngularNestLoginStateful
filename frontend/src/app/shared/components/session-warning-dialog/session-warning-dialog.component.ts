import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SessionService } from '../../../core/services/session.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-session-warning-dialog',
  templateUrl: './session-warning-dialog.component.html',
  styleUrls: ['./session-warning-dialog.component.scss'],
})
export class SessionWarningDialogComponent implements OnInit, OnDestroy {
  remainingTime = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private sessionService: SessionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Start countdown timer that updates every second
   */
  private startCountdown(): void {
    // Update immediately
    this.updateRemainingTime();

    // Then update every second
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateRemainingTime();

        // Auto-logout when time expires
        if (this.remainingTime <= 0) {
          console.log('[SessionWarningDialog] Time expired, auto-logout');
          this.onLogout();
        }
      });
  }

  /**
   * Update remaining time from session service
   */
  private updateRemainingTime(): void {
    this.remainingTime = this.sessionService.getRemainingTime();
  }

  /**
   * Get formatted time string (MM:SS)
   */
  get formattedTime(): string {
    const totalSeconds = Math.max(0, Math.floor(this.remainingTime / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Handle extend session button click
   */
  onExtendSession(): void {
    console.log('[SessionWarningDialog] Extending session');
    this.sessionService.extendSession();
    this.sessionService.dismissWarning();
  }

  /**
   * Handle logout button click
   */
  onLogout(): void {
    console.log('[SessionWarningDialog] Manual logout');
    this.sessionService.dismissWarning();
    this.authService.logout();
  }

  /**
   * Handle keyboard shortcuts
   * Enter - Extend session
   * Escape - Logout
   */
  @HostListener('document:keydown', ['$event'])
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
