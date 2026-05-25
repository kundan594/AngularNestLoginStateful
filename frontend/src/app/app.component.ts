import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Observable, Subscription, filter } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { BroadcastService } from './core/services/broadcast.service';
import { SessionService } from './core/services/session.service';
import { KeepaliveService } from './core/services/keepalive.service';
import { IframeService } from './core/services/iframe.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Authentication System';
  showSessionWarning$: Observable<boolean>;
  
  private broadcastSubscription?: Subscription;
  private authSubscription?: Subscription;
  private currentRoute = '';

  constructor(
    private authService: AuthService,
    private broadcastService: BroadcastService,
    private sessionService: SessionService,
    private keepaliveService: KeepaliveService,
    private iframeService: IframeService,
    private router: Router
  ) {
    // Track current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });

    // Subscribe to session warning observable
    this.showSessionWarning$ = this.sessionService.sessionWarning$;
  }

  ngOnInit(): void {
    // Check if running in iframe and setup accordingly
    if (this.iframeService.isInIframe()) {
      console.log('[App] Running in iframe, setting up iframe features');
      this.iframeService.setupMessageListener();
    }

    // Start keepalive monitoring when user is authenticated
    this.authService.isAuthenticated$
      .pipe(distinctUntilChanged()) // Only emit when value actually changes
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          console.log('[App] User authenticated, starting services');
          this.keepaliveService.start();
          
          // Start iframe validation if in iframe
          if (this.iframeService.isInIframe()) {
            this.iframeService.startValidation();
          }
        } else {
          console.log('[App] User not authenticated, stopping services');
          this.keepaliveService.stop();
          
          // Stop iframe validation
          if (this.iframeService.isInIframe()) {
            this.iframeService.stopValidation();
          }
        }
      });

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
    this.keepaliveService.stop();
    this.iframeService.stopValidation();
  }
}

// Made with Bob
