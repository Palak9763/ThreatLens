import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

const users = [
  { id: 1, name: 'Admin User', username: 'admin', password: 'admin123', role: 'admin', email: 'a@x', department: 'IT' },
  { id: 3, name: 'View Er', username: 'viewer', password: 'viewer123', role: 'viewer', email: 'v@x', department: 'IT' }
];

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('logs in with valid credentials', () => {
    auth.login('admin', 'admin123').subscribe();
    http.expectOne('data/users.json').flush(users);
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.hasRole('admin')).toBe(true);
  });

  it('rejects wrong password', () => {
    let result: unknown = 'unset';
    auth.login('admin', 'wrong').subscribe((u) => (result = u));
    http.expectOne('data/users.json').flush(users);
    expect(result).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('viewer does not have admin role; logout clears session', () => {
    auth.login('viewer', 'viewer123').subscribe();
    http.expectOne('data/users.json').flush(users);
    expect(auth.hasRole('admin')).toBe(false);
    auth.logout();
    expect(auth.currentUser()).toBeNull();
  });
});
