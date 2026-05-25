import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { BroadcastService } from './core/services/broadcast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Authentication System';
  private broadcastSubscription?: Subscription;
  private authSubscription?: Subscription;
  private currentRoute = '';

  constructor(
    private authService: AuthService,
    private broadcastService: BroadcastService,
    private router: Router
  ) {
    // Track current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  ngOnInit(): void {
    // Listen for cross-tab logout events
    this.broadcastSubscription = this.broadcastService.messages$.subscribe((message) => {
      if (message.type === 'logout') {
        // Only redirect if not already on login page
        if (!this.currentRoute.includes('/login')) {
          console.log('Cross-tab logout detected, redirecting to login...');
          this.router.navigate(['/login']);
        }
      }
    });

    // Also listen to auth state changes for additional safety
    this.authSubscription = this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      // If user becomes unauthenticated and not on login page, redirect
      if (!isAuthenticated && !this.currentRoute.includes('/login') && this.currentRoute !== '/') {
        console.log('Authentication lost, redirecting to login...');
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy(): void {
    this.broadcastSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }
}

// Made with Bob
