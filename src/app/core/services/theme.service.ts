import { Injectable, signal } from '@angular/core';

/** Dark / light theme switcher, remembered in localStorage. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<'dark' | 'light'>(this.load());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.apply(next);
    try { localStorage.setItem('tid-theme', next); } catch { /* ignore */ }
  }

  private load(): 'dark' | 'light' {
    try { return localStorage.getItem('tid-theme') === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
  }

  private apply(t: string): void {
    document.documentElement.setAttribute('data-theme', t);
  }
}
