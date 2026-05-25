import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser$: Observable<User | null>;
  loggingOut = false;

  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Component initialization
  }

  /**
   * Handle user logout
   */
  logout(): void {
    this.loggingOut = true;

    this.authService.logout().subscribe({
      next: () => {
        this.sessionService.endSession();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even on error, redirect to login
        this.sessionService.endSession();
        this.router.navigate(['/login']);
      }
    });
  }
}

// Made with Bob