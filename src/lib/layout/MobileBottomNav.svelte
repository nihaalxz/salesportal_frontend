<script lang="ts">
  import { page } from '$app/stores';
  import { authState } from '$lib/auth/session';
  import { LayoutDashboard, Users, Sparkles, Plane, MoreHorizontal, Receipt } from 'lucide-svelte';
  import BookingsDrawer from './BookingsDrawer.svelte';
  import MoreDrawer from './MoreDrawer.svelte';
  import { cn } from '$lib/utils';

  let bookingsOpen = $state(false);
  let moreOpen = $state(false);

  // Active status checks based on pathnames
  const isDashboardActive = $derived($page.url.pathname.startsWith('/dashboard'));
  const isHeadsActive = $derived($page.url.pathname.startsWith('/heads'));
  const isLeadsActive = $derived($page.url.pathname.startsWith('/leads'));
  const isReceiptsActive = $derived($page.url.pathname.startsWith('/receipts'));
  const isBookingsActive = $derived($page.url.pathname.startsWith('/bookings'));
  const isMoreActive = $derived(
    $page.url.pathname.startsWith('/disputes') ||
    $page.url.pathname.startsWith('/profile')
  );

  function openBookings() {
    bookingsOpen = true;
  }

  function openMore() {
    moreOpen = true;
  }
</script>

{#if $authState.isAuthenticated && $authState.user}
  <div 
    class="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/90 backdrop-blur-md lg:hidden shadow-lg select-none"
    style="padding-bottom: env(safe-area-inset-bottom);"
  >
    <nav class="flex items-center justify-around h-16 w-full px-2" aria-label="Mobile Navigation">
      <!-- 1. Dashboard -->
      <a
        href="/dashboard"
        class={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 text-center touch-manipulation",
          isDashboardActive
            ? "text-indigo-500 dark:text-indigo-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Dashboard"
      >
        <LayoutDashboard class="h-5.5 w-5.5 shrink-0" />
        <span class="text-[10px] font-medium tracking-tight">Dashboard</span>
      </a>

      <!-- 2. Heads -->
      <a
        href="/heads?type=customer"
        class={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 text-center touch-manipulation",
          isHeadsActive
            ? "text-emerald-500 dark:text-emerald-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Heads"
      >
        <Users class="h-5.5 w-5.5 shrink-0" />
        <span class="text-[10px] font-medium tracking-tight">Heads</span>
      </a>

      <!-- 3. Leads -->
      <a
        href="/leads"
        class={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 text-center touch-manipulation",
          isLeadsActive
            ? "text-violet-500 dark:text-violet-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Leads"
      >
        <Sparkles class="h-5.5 w-5.5 shrink-0" />
        <span class="text-[10px] font-medium tracking-tight">Leads</span>
      </a>

      <!-- 4. Receipts -->
      <a
        href="/receipts"
        class={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 text-center touch-manipulation",
          isReceiptsActive
            ? "text-amber-500 dark:text-amber-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Receipts"
      >
        <Receipt class="h-5.5 w-5.5 shrink-0" />
        <span class="text-[10px] font-medium tracking-tight">Receipts</span>
      </a>

      <!-- 5. Bookings -->
      <button
        onclick={openBookings}
        type="button"
        class={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 text-center touch-manipulation bg-transparent border-0 cursor-pointer",
          isBookingsActive
            ? "text-sky-500 dark:text-sky-400 font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Open Bookings Drawer"
      >
        <Plane class="h-5.5 w-5.5 shrink-0" />
        <span class="text-[10px] font-medium tracking-tight">Bookings</span>
      </button>

      <!-- 6. More -->
      <button
        onclick={openMore}
        type="button"
        class={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 text-center touch-manipulation bg-transparent border-0 cursor-pointer",
          isMoreActive
            ? "text-foreground font-semibold"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Open More Settings Drawer"
      >
        <MoreHorizontal class="h-5.5 w-5.5 shrink-0" />
        <span class="text-[10px] font-medium tracking-tight">More</span>
      </button>
    </nav>
  </div>

  <!-- Booking Drawer Modal Triggered by Button above -->
  <BookingsDrawer bind:open={bookingsOpen} />

  <!-- More Drawer Modal Triggered by Button above -->
  <MoreDrawer bind:open={moreOpen} />
{/if}
