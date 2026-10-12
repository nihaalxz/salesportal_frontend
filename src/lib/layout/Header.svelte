<script lang="ts">
  import Breadcrumbs from './Breadcrumbs.svelte';
  import Sidebar from './Sidebar.svelte';
  import { Sun, Moon } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  import { authState } from '$lib/auth/session';
  import { onMount } from 'svelte';
  import { getAvatarUrl } from '$lib/api/client';
  import NotificationDropdown from './NotificationDropdown.svelte';

  let isDark = $state(false);

  onMount(() => {
    isDark = document.documentElement.classList.contains('dark');
  });

  function toggleTheme() {
    isDark = !isDark;
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // Derive user initials dynamically for avatar
  const userInitials = $derived(() => {
    const name = $authState.user?.name ?? '';
    return name
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'TX';
  });
</script>

<header 
  class="flex items-center justify-between px-6 border-b border-border bg-card sticky top-0 z-40 select-none"
  style="padding-top: env(safe-area-inset-top, 0px); height: calc(4rem + env(safe-area-inset-top, 0px));"
>
  <div class="flex items-center gap-4">
    <!-- Mobile/Tablet logo branding -->
    <div class="flex items-center gap-2 lg:hidden">
      <img 
        src="https://admin.texastravelsbh.com/assets/images/texas-logo.png" 
        alt="Texas travels" 
        class="h-7 w-auto object-contain shrink-0"
      />
      <span class="font-bold text-sm tracking-tight text-foreground">Texas travels</span>
    </div>

    <!-- Desktop Breadcrumbs -->
    <div class="hidden lg:block">
      <Breadcrumbs />
    </div>
  </div>

  <div class="flex items-center gap-4">
    <!-- Notifications Dropdown -->
    <NotificationDropdown />

    <!-- Theme toggle -->
    <Button variant="ghost" size="icon" class="text-muted-foreground" onclick={toggleTheme} aria-label="Toggle theme mode">
      {#if isDark}
        <Sun class="h-4.5 w-4.5" />
      {:else}
        <Moon class="h-4.5 w-4.5" />
      {/if}
    </Button>

    <div class="h-6 w-[1px] bg-border"></div>

    <!-- Active User Profile name -->
    <div class="flex items-center gap-2">
      <div class="hidden sm:flex flex-col text-right">
        <span class="text-xs font-semibold leading-none">{$authState.user?.name}</span>
        <span class="text-[9px] text-muted-foreground mt-0.5">{$authState.user?.role}</span>
      </div>
      {#if $authState.user?.avatar}
        <img 
          src={getAvatarUrl($authState.user.avatar)} 
          alt="Avatar" 
          class="h-8 w-8 rounded-full object-cover shrink-0 border border-primary/10" 
        />
      {:else}
        <div class="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/10">
          {userInitials()}
        </div>
      {/if}
    </div>
  </div>
</header>
