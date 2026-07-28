import { POLLING_INTERVAL_MS } from '@/lib/constants';

type PollCallback = () => Promise<void>;

/**
 * PollingService manages periodic RPC polling with tab visibility awareness.
 * - Starts/stops polling at configurable intervals
 * - Pauses when browser tab loses focus
 * - Resumes when tab regains focus
 */
export class PollingService {
  private intervalId: NodeJS.Timeout | null = null;
  private callback: PollCallback | null = null;
  private intervalMs: number;
  private isRunning: boolean = false;
  private handleVisibilityChange: (() => void) | null = null;

  constructor(intervalMs: number = POLLING_INTERVAL_MS) {
    this.intervalMs = intervalMs;
  }

  /**
   * Start polling with the given callback function.
   * Automatically pauses/resumes based on tab visibility.
   */
  start(callback: PollCallback): void {
    if (this.isRunning) return;

    this.callback = callback;
    this.isRunning = true;
    this.startInterval();

    // Listen for tab visibility changes
    this.handleVisibilityChange = () => {
      if (document.hidden) {
        this.pauseInterval();
      } else {
        this.resumeInterval();
      }
    };
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Stop polling and clean up all listeners.
   */
  stop(): void {
    this.isRunning = false;
    this.pauseInterval();

    if (this.handleVisibilityChange) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.handleVisibilityChange = null;
    }

    this.callback = null;
  }

  /**
   * Check if the service is currently polling.
   */
  get active(): boolean {
    return this.isRunning;
  }

  private startInterval(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(async () => {
      if (this.callback) {
        try {
          await this.callback();
        } catch (error) {
          console.error('[PollingService] Poll callback error:', error);
        }
      }
    }, this.intervalMs);
  }

  private pauseInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private resumeInterval(): void {
    if (this.isRunning && !this.intervalId) {
      this.startInterval();
      // Immediately fetch on resume
      if (this.callback) {
        this.callback().catch(console.error);
      }
    }
  }
}

/** Singleton polling service instance */
let pollingInstance: PollingService | null = null;

export function getPollingService(): PollingService {
  if (!pollingInstance) {
    pollingInstance = new PollingService();
  }
  return pollingInstance;
}
