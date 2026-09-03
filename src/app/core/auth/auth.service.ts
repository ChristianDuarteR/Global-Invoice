import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, UserRole } from '../models/invoice.model';

const STORAGE_KEY = 'gi.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly session = signal<AuthResponse | null>(this.readSession());

  readonly token = computed(() => this.session()?.token ?? null);
  readonly role = computed(() => this.session()?.role ?? null);
  readonly username = computed(() => this.session()?.username ?? null);
  readonly isAuthenticated = computed(() => !!this.token());
  readonly isOperador = computed(() => this.role() === 'OPERADOR');
  readonly isAuditor = computed(() => this.role() === 'AUDITOR');

  login(body: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${environment.javaApi}/api/auth/login`, body)
      .pipe(
        tap((res) => {
          const session = { ...res, role: normalizeRole(res.role) };
          this.persist(session);
          this.session.set(session);
        }),
      );
  }

  logout(redirect = true): void {
    this.session.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
    if (redirect) {
      void this.router.navigateByUrl('/login');
    }
  }

  can(role: UserRole): boolean {
    return this.role() === role;
  }

  private persist(res: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
    }
  }

  private readSession(): AuthResponse | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as AuthResponse;
      if (!parsed?.token || !parsed.role) {
        return null;
      }
      return { ...parsed, role: normalizeRole(parsed.role) };
    } catch {
      return null;
    }
  }
}

function normalizeRole(role: string): UserRole {
  const clean = role.replace(/^ROLE_/, '') as UserRole;
  return clean;
}
