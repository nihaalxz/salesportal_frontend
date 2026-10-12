import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { getStoredToken, setSession } from '$lib/auth/session';
import { apiFetch } from '$lib/api/client';

export const ssr = false; // Client-side only SPA routing

export async function load({ url }: { url: URL }) {
  // Only guard in the browser
  if (!browser) return {};

  // Allow unauthenticated access to /login
  if (url.pathname.startsWith('/login')) return {};

  const token = getStoredToken();
  if (!token) {
    throw redirect(302, '/login');
  }

  // Token exists — verify it's still valid by calling /api/auth/me
  try {
    const me = await apiFetch<{ id: number; name: string; email: string; role: string; avatar: string | null }>('/api/auth/me', { token });
    setSession({ id: me.id, name: me.name, email: me.email, role: me.role, avatar: me.avatar }, token);
  } catch {
    // Token invalid or expired — clear it and redirect to login
    import('$lib/auth/session').then(({ clearSession }) => clearSession());
    throw redirect(302, '/login');
  }

  return {};
}
