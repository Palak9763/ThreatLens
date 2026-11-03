import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Role, User } from '../models/models';

const SESSION_KEY = 'tid-session-v1';

/** Front-end only authentication against data/users.json (demo purposes). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  readonly currentUser = signal<User | null>(this.restore());
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  login(username: string, password: string): Observable<User | null> {
    return this.http.get<User[]>('data/users.json').pipe(
      map((users) => users.find((u) => u.username === username.trim() && u.password === password) ?? null),
      tap((user) => {
        if (user) {
          this.currentUser.set(user);
          try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* ignore */ }
        }
      })
    );
  }

  logout(): void {
    this.currentUser.set(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  }

  hasRole(...roles: Role[]): boolean {
    const u = this.currentUser();
    return !!u && roles.includes(u.role);
  }

  private restore(): User | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
