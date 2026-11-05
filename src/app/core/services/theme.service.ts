import { Injectable, signal } from '@angular/core';

/** Fixed light (white) theme service. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<'light'>('light');

  constructor() {
    this.apply();
  }

  toggle(): void {
    // Locked to light / white theme
  }

  private apply(): void {
    document.documentElement.setAttribute('data-theme', 'light');
    try { localStorage.setItem('tid-theme', 'light'); } catch { /* ignore */ }
  }
}
