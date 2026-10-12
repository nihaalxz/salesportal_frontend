<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Bell, CheckCircle2, XCircle, Info, RefreshCw, Check, Trash2 } from 'lucide-svelte';
  import { 
    getNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAllNotifications,
    type NotificationResponse, 
    type NotificationData 
  } from '$lib/features/notifications/api/notifications-api';

  let isOpen = $state(false);
  let notifications = $state<NotificationResponse[]>([]);
  let loading = $state(false);
  let unreadCount = $derived(Array.isArray(notifications) ? notifications.filter(n => !n.readAt).length : 0);
  let timerId: any = null;
  let dropdownRef = $state<HTMLDivElement | null>(null);

  function parsePayload(notif: NotificationResponse): NotificationData | null {
    if (!notif || !notif.data) return null;
    try {
      return JSON.parse(notif.data) as NotificationData;
    } catch (e) {
      console.error('Failed to parse notification payload', e);
      return null;
    }
  }

  async function loadNotifications() {
    try {
      const res = await getNotifications();
      if (Array.isArray(res)) {
        notifications = res;
      } else {
        console.warn('Expected array from getNotifications but got:', res);
        notifications = [];
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
      notifications = [];
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
      notifications = notifications.map(n => ({ ...n, readAt: new Date().toISOString() }));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }

  async function handleDeleteNotification(e: MouseEvent, id: string) {
    e.stopPropagation();
    try {
      notifications = notifications.filter(n => n.id !== id);
      await deleteNotification(id);
    } catch (err) {
      console.error('Failed to delete notification', err);
      loadNotifications();
    }
  }

  async function handleClearAll() {
    if (notifications.length === 0) return;
    try {
      notifications = [];
      await clearAllNotifications();
    } catch (err) {
      console.error('Failed to clear notifications', err);
      loadNotifications();
    }
  }

  async function handleNotificationClick(notif: NotificationResponse) {
    const payload = parsePayload(notif);
    
    // Close dropdown
    isOpen = false;

    // Mark as read in background/state
    if (!notif.readAt) {
      try {
        await markAsRead(notif.id);
        notifications = notifications.map(n => n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n);
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      }
    }

    if (payload) {
      const link = getNotificationLink(payload.serviceType, payload.serviceId);
      if (link !== '#') {
        goto(link);
      }
    }
  }

  function getNotificationLink(serviceType: string, serviceId: string | number): string {
    if (!serviceType) return '#';
    const type = serviceType.toLowerCase();
    switch (type) {
      case 'flight_booking':
      case 'flights':
        return `/bookings/flights/${serviceId}`;
      case 'hotel_booking':
      case 'hotels':
        return `/bookings/hotels/${serviceId}`;
      case 'holiday_package':
      case 'holidays':
        return `/bookings/holidays/${serviceId}`;
      case 'vfs_appointment':
      case 'vfs':
        return `/bookings/vfs/${serviceId}`;
      case 'transportation':
      case 'transport':
        return `/bookings/transport/${serviceId}`;
      case 'other_service':
      case 'other-services':
      case 'other':
        return `/bookings/other-services/${serviceId}`;
      case 'visa_application':
      case 'visa':
      case 'visas':
        return `/bookings/visas/${serviceId}`;
      case 'receipt':
        return `/receipts/${serviceId}`;
      default:
        return '#';
    }
  }

  function timeAgo(dateString: string): string {
    if (!dateString) return 'unknown';
    const now = new Date();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'unknown';
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  }

  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  onMount(() => {
    loadNotifications();
    timerId = setInterval(loadNotifications, 30000); // Poll every 30 seconds
    window.addEventListener('click', handleClickOutside);
  });

  onDestroy(() => {
    if (timerId) clearInterval(timerId);
    window.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="relative inline-block" bind:this={dropdownRef}>
  <!-- Notification Bell Button -->
  <button 
    onclick={(e) => { e.stopPropagation(); isOpen = !isOpen; }} 
    class="relative p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-center"
    aria-label="Notifications"
  >
    <Bell class="h-4.5 w-4.5" />
    {#if unreadCount > 0}
      <span class="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-card shadow-sm animate-pulse">
        {unreadCount}
      </span>
    {/if}
  </button>

  <!-- Dropdown Menu Panel -->
  {#if isOpen}
    <div class="fixed top-16 inset-x-3 sm:inset-x-auto sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col max-h-[calc(100vh-5rem)] sm:max-h-[480px]">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3.5 border-b border-border bg-muted/10">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-1.5">
          <span>Notifications</span>
          {#if unreadCount > 0}
            <span class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold">
              {unreadCount} new
            </span>
          {/if}
        </h3>
        <div class="flex items-center gap-2.5">
          {#if unreadCount > 0}
            <button 
              type="button"
              onclick={handleMarkAllAsRead} 
              class="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
              title="Mark all as read"
            >
              <Check class="h-3 w-3" />
              <span>Mark all read</span>
            </button>
          {/if}
          {#if notifications.length > 0}
            <button 
              type="button"
              onclick={handleClearAll} 
              class="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all notifications"
            >
              <Trash2 class="h-3 w-3" />
              <span>Clear all</span>
            </button>
          {/if}
        </div>
      </div>

      <!-- Notifications List -->
      <div class="overflow-y-auto flex-1 divide-y divide-border/50">
        {#if notifications.length === 0}
          <div class="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Bell class="h-8 w-8 text-muted-foreground/30" />
            <p class="text-xs">No notifications yet</p>
          </div>
        {:else}
          {#each notifications as notif (notif.id)}
            {@const payload = parsePayload(notif)}
            {#if payload}
              {@const isApproved = payload.status.toLowerCase() === 'success'}
              <div 
                role="button"
                tabindex="0"
                onclick={() => handleNotificationClick(notif)}
                onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNotificationClick(notif); } }}
                class="w-full text-left p-4 hover:bg-muted/20 transition-all flex gap-3 relative cursor-pointer group {!notif.readAt ? 'bg-primary/5' : ''}"
              >
                <!-- Status Icon -->
                <div class="shrink-0 mt-0.5">
                  {#if isApproved}
                    <div class="h-8 w-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center dark:bg-green-500/20 dark:text-green-400">
                      <CheckCircle2 class="h-4.5 w-4.5" />
                    </div>
                  {:else}
                    <div class="h-8 w-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center dark:bg-red-500/20 dark:text-red-400">
                      <XCircle class="h-4.5 w-4.5" />
                    </div>
                  {/if}
                </div>

                <!-- Text & Info -->
                <div class="flex-1 min-w-0 space-y-1">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {payload.title}
                    </span>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <span class="text-[10px] text-muted-foreground whitespace-nowrap">
                        {timeAgo(notif.createdAt)}
                      </span>
                      <button
                        type="button"
                        onclick={(e) => handleDeleteNotification(e, notif.id)}
                        class="p-1 -mr-1 rounded-md text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all opacity-70 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 class="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p class="text-xs text-muted-foreground leading-relaxed pr-2">
                    {payload.message}
                  </p>
                  {#if payload.details}
                    <div class="text-[10px] text-muted-foreground bg-muted/40 px-2 py-1 rounded font-medium truncate mt-1">
                      {payload.details}
                    </div>
                  {/if}
                </div>

                <!-- Unread Dot Indicator -->
                {#if !notif.readAt}
                  <span class="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-card shadow-sm"></span>
                {/if}
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
