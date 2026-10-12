<script lang="ts">
  import { goto } from '$app/navigation';
  import { setSession } from '$lib/auth/session';
  import { apiFetch } from '$lib/api/client';
  import { Eye, EyeOff, Lock, Loader2 } from 'lucide-svelte';

  let email = $state('');
  let password = $state('');
  let showPassword = $state(false);
  let loading = $state(false);
  let errorMessage = $state<string | null>(null);
  let rememberMe = $state(false);

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    errorMessage = null;

    try {
      const res = await apiFetch<{
        token: string;
        expiresAt: string;
        user: { id: number; name: string; email: string; role: string; avatar: string | null };
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password })
      });

      setSession(
        { id: res.user.id, name: res.user.name, email: res.user.email, role: res.user.role, avatar: res.user.avatar },
        res.token
      );

      goto('/');
    } catch (err: any) {
      errorMessage = err?.detail || err?.message || 'Invalid email or password.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Welcome Back — Sign In</title>
  <meta name="description" content="Sign in to your account to continue." />
</svelte:head>

<div class="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#f8fafc] overflow-y-auto px-4 py-8 pt-safe pb-safe">
  <!-- Card Container -->
  <div class="w-full max-w-[440px] bg-white border border-[#f1f5f9] rounded-[24px] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
    
    <!-- Lock Icon Header -->
    <div class="flex justify-center">
      <div class="w-14 h-14 bg-[#e0f2fe] rounded-full flex items-center justify-center">
        <Lock class="w-6 h-6 text-[#0284c7]" />
      </div>
    </div>

    <!-- Title and Subtitle -->
    <h2 class="text-[26px] font-bold text-[#1e293b] text-center mt-5 leading-tight">
      Welcome Back
    </h2>
    <p class="text-xs text-[#64748b] text-center mt-1.5 font-medium">
      Sign in to your account to continue
    </p>

    <!-- Error message display -->
    {#if errorMessage}
      <div class="mt-5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold leading-relaxed flex items-start gap-2">
        <span class="mt-0.5 shrink-0 text-sm">⚠️</span>
        <span>{errorMessage}</span>
      </div>
    {/if}

    <!-- Login Form -->
    <form onsubmit={handleLogin} class="mt-6 space-y-5">
      <!-- Email Input -->
      <div class="space-y-1.5">
        <label for="email" class="block text-[13px] font-semibold text-[#475569]">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          autocomplete="email"
          placeholder="name@example.com"
          class="w-full border border-[#cbd5e1] rounded-xl px-4 py-3 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 bg-white transition-all font-medium"
        />
      </div>

      <!-- Password Input -->
      <div class="space-y-1.5">
        <label for="password" class="block text-[13px] font-semibold text-[#475569]">
          Password
        </label>
        <div class="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            bind:value={password}
            required
            autocomplete="current-password"
            placeholder="Enter your password"
            class="w-full border border-[#cbd5e1] rounded-xl px-4 py-3 pr-12 text-sm text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 bg-white transition-all font-medium"
          />
          <button
            type="button"
            onclick={() => showPassword = !showPassword}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
            aria-label="Toggle password visibility"
          >
            {#if showPassword}
              <EyeOff class="h-4.5 w-4.5" />
            {:else}
              <Eye class="h-4.5 w-4.5" />
            {/if}
          </button>
        </div>
      </div>

      <!-- Remember Me -->
      <div class="flex items-center gap-2">
        <input
          id="rememberMe"
          type="checkbox"
          bind:checked={rememberMe}
          class="w-4 h-4 rounded border-[#cbd5e1] text-[#0f5b66] focus:ring-[#0f5b66] cursor-pointer"
        />
        <label for="rememberMe" class="text-xs font-semibold text-[#64748b] cursor-pointer select-none">
          Remember Me
        </label>
      </div>

      <!-- Submit button -->
      <button
        type="submit"
        disabled={loading}
        class="w-full flex items-center justify-center gap-2 bg-[#0f5b66] hover:bg-[#0d5059] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-3xl text-sm transition-all duration-200 shadow-md shadow-[#0f5b66]/10"
      >
        {#if loading}
          <Loader2 class="h-4 w-4 animate-spin" />
          <span>Signing in...</span>
        {:else}
          <span>Sign In</span>
        {/if}
      </button>
    </form>
  </div>

  <!-- Copyright Footer -->
  <p class="text-[11px] font-semibold text-[#94a3b8] mt-6 tracking-wide">
    © 2026 TexasTravels. All rights reserved.
  </p>
</div>

