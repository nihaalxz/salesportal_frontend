<script lang="ts">
  import { page } from '$app/stores';
  import { authState, can } from '$lib/auth/session';
  import { navigationConfig, isRouteActive } from './navigation';
  import * as Sheet from '$lib/components/ui/sheet';
  import { cn } from '$lib/utils';

  let { open = $bindable(false) } = $props();

  // Find the bookings navigation item and its children
  const bookingItems = $derived(() => {
    const session = $authState;
    if (!session.isAuthenticated || !session.user) return [];

    const bookingsNode = navigationConfig.find(item => item.route === '/bookings');
    if (!bookingsNode || !bookingsNode.children) return [];

    return bookingsNode.children.filter(child => {
      if (child.permission && !can(child.permission, session.user)) {
        return false;
      }
      return true;
    });
  });

  const activeBookingItems = $derived(bookingItems());

  function closeDrawer() {
    open = false;
  }
</script>

<Sheet.Root bind:open={open}>
  <Sheet.Content side="bottom" class="rounded-t-3xl border-t border-border bg-card px-6 pb-6 pt-2 max-h-[85vh] overflow-y-auto">
    <!-- Pull/Drag Handle Indicator -->
    <div class="mx-auto my-2 h-1.5 w-12 rounded-full bg-muted-foreground/30"></div>

    <Sheet.Header class="text-left pb-4 border-b border-border">
      <Sheet.Title class="text-lg font-bold text-foreground">Bookings & Services</Sheet.Title>
      <p class="text-xs text-muted-foreground">Select a service to create or view bookings</p>
    </Sheet.Header>

    <div class="py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
      {#each activeBookingItems as item}
        <a
          href={item.route}
          onclick={closeDrawer}
          class={cn(
            "flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 gap-2 touch-manipulation active:scale-95",
            isRouteActive($page.url.pathname, item.route)
              ? "bg-primary/10 border-primary/20 text-primary font-semibold"
              : "bg-muted/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <div class={cn("p-3 rounded-full bg-background border shadow-sm shrink-0", isRouteActive($page.url.pathname, item.route) ? "border-primary/20 text-primary" : "border-border text-foreground")}>
            <item.icon class={cn("h-6 w-6 shrink-0", item.colorClass)} />
          </div>
          <span class="text-xs font-medium tracking-tight truncate max-w-full">{item.label}</span>
        </a>
      {/each}
    </div>
  </Sheet.Content>
</Sheet.Root>
