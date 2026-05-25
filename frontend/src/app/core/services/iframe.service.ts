import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';

/**
 * Message types for iframe communication
 */
export interface IframeMessage {
  type: 'session-check' | 'session-valid' | 'session-invalid' | 'logout' | 'session-extended';
  payload?: any;
  timestamp: number;
}

/**
 * Iframe Service
 * 
 * Detects iframe context and manages PostMessage communication with parent window.
 * Provides periodic session validation when running in iframe.
 */
@Injectable({
  providedIn: 'root',
})
export class IframeService implements OnDestroy {
  private readonly VALIDATION_INTERVAL = 60000; // 1 minute
  private readonly MESSAGE_TIMEOUT = 5000; // 5 seconds
  
  // Allowed parent origins (should be configured via environment)
  private readonly ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    // Add production origins here
  ];

  private validationTimer: any;
  private messageListener: ((event: MessageEvent) => void) | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private sessionService: SessionService,
    private authService: AuthService
  ) {}

  /**
   * Check if application is running inside an iframe
   */
  isInIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      // If we can't access window.top due to cross-origin, we're likely in an iframe
      return true;
    }
  }

  /**
   * Setup message listener for parent window communication
   */
  setupMessageListener(): void {
    if (!this.isInIframe()) {
      console.log('[IframeService] Not in iframe, skipping message listener setup');
      return;
    }

    console.log('[IframeService] Setting up PostMessage listener');

    this.messageListener = (event: MessageEvent) => {
      this.handleParentMessage(event);
    };

    window.addEventListener('message', this.messageListener);
  }

  /**
   * Start periodic session validation
   */
  startValidation(): void {
    if (!this.isInIframe()) {
      console.log('[IframeService] Not in iframe, skipping validation');
      return;
    }

    // Prevent multiple timers
    if (this.validationTimer) {
      console.log('[IframeService] Validation already running');
      return;
    }

    console.log('[IframeService] Starting periodic session validation');

    // Validate immediately
    this.validateSession();

    // Then validate periodically
    this.validationTimer = setInterval(() => {
      this.validateSession();
    }, this.VALIDATION_INTERVAL);
  }

  /**
   * Stop periodic session validation
   */
  stopValidation(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
      this.validationTimer = null;
      console.log('[IframeService] Stopped session validation');
    }
  }

  /**
   * Send message to parent window
   */
  sendMessageToParent(message: IframeMessage): void {
    if (!this.isInIframe()) {
      return;
    }

    try {
      // Send to parent with wildcard origin (parent will validate)
      window.parent.postMessage(message, '*');
      console.log('[IframeService] Sent message to parent:', message.type);
    } catch (error) {
      console.error('[IframeService] Failed to send message to parent:', error);
    }
  }

  /**
   * Handle incoming messages from parent window
   */
  private handleParentMessage(event: MessageEvent): void {
    // Validate origin
    if (!this.validateOrigin(event.origin)) {
      console.warn('[IframeService] Rejected message from unauthorized origin:', event.origin);
      return;
    }

    const message = event.data as IframeMessage;
    console.log('[IframeService] Received message from parent:', message.type);

    // Handle different message types
    switch (message.type) {
      case 'session-check':
        this.handleSessionCheckRequest();
        break;

      case 'logout':
        this.handleLogoutRequest();
        break;

      default:
        console.log('[IframeService] Unknown message type:', message.type);
    }
  }

  /**
   * Validate message origin against allowed list
   */
  private validateOrigin(origin: string): boolean {
    // In development, allow localhost with any port
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return true;
    }

    return this.ALLOWED_ORIGINS.includes(origin);
  }

  /**
   * Handle session check request from parent
   */
  private handleSessionCheckRequest(): void {
    const isAuthenticated = this.authService.isAuthenticated;
    
    const response: IframeMessage = {
      type: isAuthenticated ? 'session-valid' : 'session-invalid',
      payload: {
        authenticated: isAuthenticated,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.sendMessageToParent(response);
  }

  /**
   * Handle logout request from parent
   */
  private handleLogoutRequest(): void {
    console.log('[IframeService] Logout requested by parent');
    this.authService.logout().subscribe({
      next: () => {
        console.log('[IframeService] Logout successful');
      },
      error: (error) => {
        console.error('[IframeService] Logout failed:', error);
      },
    });
  }

  /**
   * Validate current session with backend
   */
  private validateSession(): void {
    console.log('[IframeService] Validating session');

    this.authService.checkStatus().subscribe({
      next: (response) => {
        if (response.authenticated) {
          console.log('[IframeService] Session valid');
          
          // Notify parent
          const message: IframeMessage = {
            type: 'session-valid',
            payload: {
              user: response.user,
            },
            timestamp: Date.now(),
          };
          this.sendMessageToParent(message);
        } else {
          this.handleInvalidSession();
        }
      },
      error: (error) => {
        console.error('[IframeService] Session validation failed:', error);
        this.handleInvalidSession();
      },
    });
  }

  /**
   * Handle invalid session
   */
  private handleInvalidSession(): void {
    console.log('[IframeService] Session invalid, logging out');

    // Notify parent
    const message: IframeMessage = {
      type: 'session-invalid',
      timestamp: Date.now(),
    };
    this.sendMessageToParent(message);

    // Logout locally
    this.authService.logout().subscribe({
      next: () => {
        console.log('[IframeService] Logged out due to invalid session');
      },
      error: (error) => {
        console.error('[IframeService] Logout failed:', error);
      },
    });
  }

  /**
   * Notify parent of session extension
   */
  notifySessionExtended(): void {
    if (!this.isInIframe()) {
      return;
    }

    const message: IframeMessage = {
      type: 'session-extended',
      timestamp: Date.now(),
    };
    this.sendMessageToParent(message);
  }

  ngOnDestroy(): void {
    this.stopValidation();
    
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }
}

// Made with Bob
