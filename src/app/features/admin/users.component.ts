import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Role, User } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';

/** Member 4 – Admin-only user management (role changes are kept in memory for the demo). */
@Component({
  selector: 'app-users',
  templateUrl: './users.component.html'
})
export class UsersComponent {
  private data = inject(DataService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  private source = toSignal(this.data.users, { initialValue: [] });
  private roleOverrides = signal<Record<number, Role>>({});
  search = signal('');
  readonly roles: Role[] = ['admin', 'analyst', 'viewer'];

  users = computed<User[]>(() => {
    const q = this.search().trim().toLowerCase();
    return this.source()
      .map((u) => ({ ...u, role: this.roleOverrides()[u.id] ?? u.role }))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.username.includes(q) || u.role.includes(q));
  });

  roleDescription: Record<Role, string> = {
    admin: 'Full access, including user management.',
    analyst: 'Can update threats, block IPs and manage incidents.',
    viewer: 'Read-only access to dashboards and reports.'
  };

  changeRole(u: User, role: Role): void {
    if (u.id === this.auth.currentUser()?.id) {
      this.toast.show('You cannot change your own role.', 'error');
      return;
    }
    this.roleOverrides.update((o) => ({ ...o, [u.id]: role }));
    this.toast.show(`${u.name} is now ${role}.`, 'success');
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  }
}
