import { Injectable, signal } from '@angular/core';
import { AppToast } from '../models/models';

/** Small global notification service (shown by ToastContainerComponent). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<AppToast[]>([]);
  private counter = 0;

  show(message: string, kind: AppToast['kind'] = 'info', durationMs = 3500): void {
    const toast: AppToast = { id: ++this.counter, message, kind };
    this.toasts.update((list) => [...list.slice(-3), toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
