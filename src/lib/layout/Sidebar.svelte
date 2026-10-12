<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authState, clearSession, can } from '$lib/auth/session';
  import { navigationConfig, isRouteActive } from './navigation';
  import { ChevronDown, ChevronRight, LogOut } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils';
  import { getAvatarUrl } from '$lib/api/client';

  let bookingsOpen = $state(true);

  // Filter root configuration items by user permissions
  const filteredNavItems = $derived(() => {
    const session = $authState;
    if (!session.isAuthenticated || !session.user) return [];
    
    return navigationConfig.filter(item => {
      if (item.permission && !can(item.permission, session.user)) {
        return false;
      }
      return true;
    });
  });

  const activeNavItems = $derived(filteredNavItems());

  function toggleBookings() {
    bookingsOpen = !bookingsOpen;
  }

  function handleLogout() {
    clearSession();
    goto('/login');
  }

  // Derive user initials for avatar
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

<aside class="flex flex-col h-full bg-card border-r border-border w-64 shrink-0 transition-all duration-300">
  <!-- Brand / Logo Area -->
  <div class="flex items-center gap-2 px-6 h-16 border-b border-border">
    <img 
      src="https://admin.texastravelsbh.com/assets/images/texas-logo.png" 
      alt="Texas travels" 
      class="h-8 w-auto object-contain shrink-0"
    />
    <div class="flex flex-col">
      <span class="font-bold text-base tracking-tight text-foreground">Texas travels</span>
      <span class="text-[10px] uppercase tracking-wider font-semibold text-primary">Sales Portal</span>
    </div>
  </div>

  <!-- Navigation Scroll Container -->
  <nav class="flex-1 overflow-y-auto px-4 py-6 space-y-6">
    <div class="space-y-1">
      {#each activeNavItems as item}
        {#if item.children}
          <!-- Collapsible Menu for Bookings -->
          <div class="space-y-1">
            <button
              onclick={toggleBookings}
              class="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors hover:bg-muted text-muted-foreground"
            >
              <div class="flex items-center gap-3">
                <item.icon class={cn("h-4.5 w-4.5 shrink-0", item.colorClass)} />
                <span>{item.label}</span>
              </div>
              {#if bookingsOpen}
                <ChevronDown class="h-4 w-4" />
              {:else}
                <ChevronRight class="h-4 w-4" />
              {/if}
            </button>
            
            {#if bookingsOpen}
              <div class="pl-7 space-y-1">
                {#each item.children as child}
                  <a
                    href={child.route}
                    class={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                      isRouteActive($page.url.pathname, child.route)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <child.icon class={cn("h-3.5 w-3.5 shrink-0", child.colorClass)} />
                    <span>{child.label}</span>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {:else}
          <!-- Regular link -->
          <a
            href={item.route}
            class={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              isRouteActive($page.url.pathname, item.route, item.exactMatch)
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon class={cn("h-4.5 w-4.5 shrink-0", item.colorClass)} />
            <span>{item.label}</span>
          </a>
        {/if}
      {/each}
    </div>
  </nav>

  <!-- User / Session Footer -->
  <div class="p-4 border-t border-border bg-muted/30">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 overflow-hidden">
        {#if $authState.user?.avatar}
          <img 
            src={getAvatarUrl($authState.user.avatar)} 
            alt="Avatar" 
            class="h-9 w-9 rounded-full object-cover shrink-0 border border-primary/10" 
          />
        {:else}
          <div class="h-9 w-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {userInitials()}
          </div>
        {/if}
        <div class="flex flex-col overflow-hidden">
          <span class="text-xs font-semibold text-foreground truncate">{$authState.user?.name ?? 'Loading...'}</span>
          <span class="text-[10px] text-muted-foreground truncate">{$authState.user?.role ?? ''}</span>
        </div>
      </div>
      <Button
        onclick={handleLogout}
        variant="ghost"
        size="icon"
        class="h-8 w-8 text-muted-foreground hover:text-destructive"
        title="Sign out"
      >
        <LogOut class="h-4 w-4" />
      </Button>
    </div>
  </div>
</aside>
