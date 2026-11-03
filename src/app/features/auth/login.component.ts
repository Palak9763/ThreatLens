import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ThemeService } from '../../core/services/theme.service';

/** Member 4 – Login page with reactive-form validation and demo accounts. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  theme = inject(ThemeService);

  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  demoUsers = [
    { role: 'Admin', username: 'admin', password: 'admin123', note: 'Full access + user management' },
    { role: 'Analyst', username: 'analyst', password: 'analyst123', note: 'Manage threats & incidents' },
    { role: 'Viewer', username: 'viewer', password: 'viewer123', note: 'Read-only access' }
  ];

  fill(u: { username: string; password: string }): void {
    this.form.setValue({ username: u.username, password: u.password });
    this.error.set('');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: (user) => {
        this.loading.set(false);
        if (user) {
          this.toast.show(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set('Invalid username or password.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Unable to reach the user database. Please try again.');
      }
    });
  }
}
