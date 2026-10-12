import { describe, it, expect, vi } from 'vitest';

// Mock SvelteKit environment to simulate production environment
vi.mock('$app/environment', () => ({
  dev: false
}));

import { authState } from './session';
import { get } from 'svelte/store';

describe('Auth Boundary', () => {
  it('should initialize with null user and fail-closed state in production', () => {
    const state = get(authState);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
