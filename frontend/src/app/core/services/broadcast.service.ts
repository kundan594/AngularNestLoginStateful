import { Injectable, OnDestroy } from '@angular/core';
/// <reference lib="dom" />
import { Observable, Subject } from 'rxjs';
import { SessionBroadcastType, SessionStatus } from '../../models/session.model';

/**
 * Broadcast Service
 *
 * Synchronizes authentication/session events across browser tabs using
 * the Broadcast Channel API with a localStorage event fallback.
 */
@Injectable({
  providedIn: 'root',
})
export class BroadcastService implements OnDestroy {
  private readonly channelName = 'auth-session-sync';
  private readonly storageKey = 'auth-session-sync-event';
  private readonly tabId = this.generateTabId();
  private readonly messageSubject = new Subject<SessionStatus>();

  private broadcastChannel: BroadcastChannel | null = null;
  private readonly storageListener = (event: StorageEvent): void => {
    if (event.key !== this.storageKey || !event.newValue) {
      return;
    }

    this.emitParsedMessage(event.newValue);
  };

  constructor() {
    this.initialize();
  }

  /**
   * Stream of cross-tab synchronization messages.
   */
  get messages$(): Observable<SessionStatus> {
    return this.messageSubject.asObservable();
  }

  /**
   * Current tab identifier used to ignore self-originated messages.
   */
  get currentTabId(): string {
    return this.tabId;
  }

  /**
   * Broadcast a session/authentication event to other tabs.
   */
  broadcast(type: SessionBroadcastType, payload: Partial<SessionStatus> = {}): void {
    const message: SessionStatus = {
      type,
      timestamp: Date.now(),
      sourceTabId: this.tabId,
      ...payload,
    };

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(message));
    localStorage.removeItem(this.storageKey);
  }

  ngOnDestroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    globalThis.removeEventListener('storage', this.storageListener as EventListener);
    this.messageSubject.complete();
  }

  /**
   * Initialize primary and fallback synchronization mechanisms.
   */
  private initialize(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (typeof BroadcastChannel !== 'undefined') {
      this.broadcastChannel = new BroadcastChannel(this.channelName);
      this.broadcastChannel.onmessage = (event: MessageEvent<SessionStatus>) => {
        this.emitMessage(event.data);
      };
      return;
    }

    globalThis.addEventListener('storage', this.storageListener as EventListener);
  }

  /**
   * Parse storage fallback messages safely.
   */
  private emitParsedMessage(rawMessage: string): void {
    try {
      const message = JSON.parse(rawMessage) as SessionStatus;
      this.emitMessage(message);
    } catch {
      // Ignore malformed cross-tab messages.
    }
  }

  /**
   * Forward valid messages that originated from a different tab.
   */
  private emitMessage(message: SessionStatus | null | undefined): void {
    if (!message || message.sourceTabId === this.tabId) {
      return;
    }

    this.messageSubject.next(message);
  }

  /**
   * Generate a lightweight unique tab identifier.
   */
  private generateTabId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

// Made with Bob