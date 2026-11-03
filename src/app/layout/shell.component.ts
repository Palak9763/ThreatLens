import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { DataService } from '../core/services/data.service';
import { ThemeService } from '../core/services/theme.service';
import { ToastService } from '../core/services/toast.service';

/** Application shell: sidebar navigation, top bar and router outlet. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html'
})
export class ShellComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private data = inject(DataService);
  private router = inject(Router);
  private toast = inject(ToastService);

  menuOpen = signal(false);
  loaded = toSignal(this.data.loaded, { initialValue: false });
  loadError = toSignal(this.data.error, { initialValue: null });
  private threats = toSignal(this.data.threats, { initialValue: [] });

  criticalActive = computed(() => this.threats().filter((t) => t.severity === 'Critical' && t.status === 'Active').length);
  initials = computed(() =>
    (this.auth.currentUser()?.name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  );

  constructor() {
    this.data.load();
  }

  search(value: string): void {
    const q = value.trim();
    if (q) this.router.navigate(['/threats'], { queryParams: { q } });
  }

  logout(): void {
    this.data.setLive(false);
    this.auth.logout();
    this.toast.show('Signed out successfully.', 'success');
    this.router.navigate(['/login']);
  }

  reload(): void {
    window.location.reload();
  }
}
