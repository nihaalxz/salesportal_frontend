<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { authState, clearSession, can } from '$lib/auth/session';
  import { navigationConfig, isRouteActive } from './navigation';
  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';
  import { LogOut } from 'lucide-svelte';
  import { cn } from '$lib/utils';

  let { open = $bindable(false) } = $props();

  // Find secondary navigation items (everything except dashboard, heads, leads, bookings)
  const secondaryItems = $derived(() => {
    const session = $authState;
    if (!session.isAuthenticated || !session.user) return [];

    const excludeRoutes = ['/dashboard', '/heads', '/leads', '/receipts', '/bookings'];
    return navigationConfig.filter(item => {
      if (excludeRoutes.includes(item.route)) return false;
      if (item.permission && !can(item.permission, session.user)) return false;
      return true;
    });
  });

  const activeSecondaryItems = $derived(secondaryItems());

  function closeDrawer() {
    open = false;
  }

  function handleLogout() {
    closeDrawer();
    clearSession();
    goto('/login');
  }

  // Derive user initials
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

<Sheet.Root bind:open={open}>
  <Sheet.Content side="bottom" class="rounded-t-3xl border-t border-border bg-card px-6 pb-6 pt-2 max-h-[85vh] overflow-y-auto">
    <!-- Pull/Drag Handle Indicator -->
    <div class="mx-auto my-2 h-1.5 w-12 rounded-full bg-muted-foreground/30"></div>

    <Sheet.Header class="text-left pb-4 border-b border-border">
      <Sheet.Title class="text-lg font-bold text-foreground">More Menu</Sheet.Title>
      <p class="text-xs text-muted-foreground">Manage accounts, settings, and other services</p>
    </Sheet.Header>

    <!-- User / Profile Section inside Drawer -->
    <div class="flex items-center gap-3 p-4 my-4 rounded-2xl bg-muted/30 border border-border/50">
      <div class="h-12 w-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-base shrink-0">
        {userInitials()}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-foreground truncate">{$authState.user?.name ?? 'Loading...'}</div>
        <div class="text-xs text-muted-foreground truncate">{$authState.user?.role ?? ''}</div>
        <div class="text-[10px] text-muted-foreground/75 truncate">{$authState.user?.email ?? ''}</div>
      </div>
    </div>

    <!-- Secondary Links list -->
    <div class="space-y-1 py-2">
      {#each activeSecondaryItems as item}
        <a
          href={item.route}
          onclick={closeDrawer}
          class={cn(
            "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 touch-manipulation active:scale-[0.99]",
            isRouteActive($page.url.pathname, item.route)
              ? "bg-primary/10 text-primary font-semibold border border-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
          )}
        >
          <div class={cn("p-2 rounded-xl bg-background border shadow-xs shrink-0", isRouteActive($page.url.pathname, item.route) ? "text-primary border-primary/10" : "text-muted-foreground border-border")}>
            <item.icon class={cn("h-5 w-5 shrink-0", item.colorClass)} />
          </div>
          <span class="flex-1">{item.label}</span>
        </a>
      {/each}
    </div>

    <!-- Logout Action -->
    <div class="mt-4 pt-4 border-t border-border">
      <Button
        onclick={handleLogout}
        variant="destructive"
        class="w-full flex items-center justify-center gap-2 py-6 rounded-2xl font-medium touch-manipulation active:scale-[0.98]"
      >
        <LogOut class="h-5 w-5" />
        <span>Sign Out</span>
      </Button>
    </div>
  </Sheet.Content>
</Sheet.Root>
