import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const TOKEN_KEY = 'txportal_token';

// ---------------------------------------------------------------------------
// Token persistence helpers — browser-only, gracefully no-ops in SSR
// ---------------------------------------------------------------------------

export function getStoredToken(): string | null {
  if (!browser) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(user: AuthUser, token: string): void {
  if (browser) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  authState.set({ user, isAuthenticated: true });
}

export function clearSession(): void {
  if (browser) {
    localStorage.removeItem(TOKEN_KEY);
  }
  authState.set({ user: null, isAuthenticated: false });
}

// ---------------------------------------------------------------------------
// Writable auth state — starts unauthenticated; hydrated by layout load fn
// ---------------------------------------------------------------------------
export const authState = writable<AuthSession>({ user: null, isAuthenticated: false });

export function can(permission: string, user: AuthUser | null): boolean {
  if (!user) return false;
  
  if (user.role === 'Admin') return true;
  
  if (user.role === 'Salesman' || user.role === 'Sales Executive') {
    const salesmanPermissions = ['read:dashboard', 'read:heads', 'read:leads', 'read:bookings', 'read:receipts'];
    return salesmanPermissions.includes(permission);
  }
  
  return user.role === permission;
}
