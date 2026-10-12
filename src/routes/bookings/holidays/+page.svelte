<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatDateOnly, formatDateTime } from '$lib/formatters/date';
  import { getHolidayPackages, type HolidayPackageSummary } from '$lib/features/holidays/api/holidays-api';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { 
    Plus, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight, 
    FileText, 
    AlertCircle,
    Eye,
    Search,
    X
  } from 'lucide-svelte';

  // Reactively bind query parameters from URL state
  let currentPage = $derived(Number(page.url.searchParams.get('page') || '1'));
  let paymentStatus = $derived(page.url.searchParams.get('paymentStatus') || '');
  let processingStatus = $derived(page.url.searchParams.get('processingStatus') || '');
  let searchTerm = $derived(page.url.searchParams.get('searchTerm') || page.url.searchParams.get('search') || '');

  let searchInput = $state(page.url.searchParams.get('searchTerm') || page.url.searchParams.get('search') || '');
  let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  $effect(() => {
    searchInput = searchTerm;
  });

  function handleSearchInput(e: Event & { currentTarget: HTMLInputElement }) {
    searchInput = e.currentTarget.value;
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      updateFilters({ searchTerm: searchInput.trim() || null, search: searchInput.trim() || null });
    }, 300);
  }

  function clearSearch() {
    searchInput = '';
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    updateFilters({ searchTerm: null, search: null });
  }

  let loading = $state(true);
  let error = $state<any>(null);
  let data = $state<{ items: HolidayPackageSummary[]; totalCount: number; totalPages: number } | null>(null);

  let abortController: AbortController | null = null;

  async function loadData() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading = true;
    error = null;

    try {
      const response = await getHolidayPackages({
        page: currentPage,
        pageSize: 10,
        paymentStatus: paymentStatus || undefined,
        processingStatus: processingStatus || undefined,
        searchTerm: searchTerm || undefined
      }, abortController.signal);

      if (!abortController.signal.aborted) {
        data = {
          items: response.items || [],
          totalCount: response.totalCount || 0,
          totalPages: response.totalPages || 1
        };
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        error = err;
      }
    } finally {
      if (!abortController.signal.aborted) {
        loading = false;
      }
    }
  }

  // Reload when query params change
  $effect(() => {
    loadData();
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  });

  function updateFilters(newParams: Record<string, string | number | null>) {
    const url = new URL(page.url);
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, String(val));
      }
    });
    // Reset page to 1 on filter changes
    if (!newParams.page) {
      url.searchParams.set('page', '1');
    }
    goto(url.toString(), { keepFocus: true, noScroll: true });
  }

  function handleRowClick(id: number | undefined) {
    if (id === undefined) return;
    goto(`/bookings/holidays/${id}`);
  }
</script>

<PageHeader title="Holiday Packages" description="Manage custom vacation, leisure and travel itineraries.">
  <div class="flex items-center gap-2">
    <Button onclick={() => goto('/bookings/holidays/new')} variant="default" size="sm" class="gap-1.5" id="btn-create-holiday">
      <Plus class="h-4 w-4" />
      <span>Create Booking</span>
    </Button>
    <Button onclick={loadData} variant="outline" size="sm" class="gap-1.5" disabled={loading}>
      <RefreshCw class="h-3.5 w-3.5 {loading ? 'animate-spin' : ''}" />
      <span>Reload</span>
    </Button>
  </div>
</PageHeader>

<!-- Filter Controls Panel -->
<Card class="mb-6 bg-card">
  <CardContent class="pt-6">
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div class="flex flex-wrap items-center gap-3 w-full">
        <!-- Search Bar -->
        <div class="flex flex-col gap-1 w-full sm:w-72">
          <label for="searchInput" class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Search</label>
          <div class="relative w-full">
            <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              id="searchInput"
              type="text"
              placeholder="Search ref, customer, passenger, country..."
              class="w-full text-xs bg-background border border-border rounded pl-8 pr-8 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={searchInput}
              oninput={handleSearchInput}
            />
            {#if searchInput}
              <button
                type="button"
                onclick={clearSearch}
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-bold"
                aria-label="Clear search"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            {/if}
          </div>
        </div>

        <!-- Payment Status Filter -->
        <div class="flex flex-col gap-1 w-full sm:w-44">
          <label for="paymentStatusSelect" class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Payment Status</label>
          <select
            id="paymentStatusSelect"
            class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            value={paymentStatus}
            onchange={(e) => updateFilters({ paymentStatus: e.currentTarget.value })}
          >
            <option value="">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </select>
        </div>

        <!-- Processing Status Filter -->
        <div class="flex flex-col gap-1 w-full sm:w-44">
          <label for="processingStatusSelect" class="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Booking Status</label>
          <select
            id="processingStatusSelect"
            class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
            value={processingStatus}
            onchange={(e) => updateFilters({ processingStatus: e.currentTarget.value })}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

{#if error}
  <div class="space-y-6">
    <Alert.Root variant="destructive">
      <AlertCircle class="h-5 w-5" />
      <Alert.Title>Failed to load holiday package bookings</Alert.Title>
      <Alert.Description class="mt-2 text-sm">
        {error.detail || error.message || 'An unexpected connection failure occurred.'}
      </Alert.Description>
    </Alert.Root>
    <Button onclick={loadData} variant="default" class="w-fit">
      <span>Retry Fetch</span>
    </Button>
  </div>

{:else if loading}
  <div class="space-y-4">
    <Skeleton class="h-10 w-full" />
    <Skeleton class="h-12 w-full" />
    <Skeleton class="h-12 w-full" />
    <Skeleton class="h-12 w-full" />
  </div>

{:else if data}
  {#if data.items.length === 0}
    <div class="border border-dashed border-border rounded-lg p-12 text-center flex flex-col items-center justify-center gap-3">
      <FileText class="h-10 w-10 text-muted-foreground/30" />
      <div>
        <p class="text-sm font-semibold text-muted-foreground">No holiday packages recorded</p>
        <p class="text-xs text-muted-foreground/70 mt-1">Create a holiday package booking to get started.</p>
      </div>
      <Button onclick={() => goto('/bookings/holidays/new')} variant="outline" size="sm" class="mt-2">
        Create First Booking
      </Button>
    </div>
  {:else}
    <div class="border border-border rounded-lg overflow-hidden bg-card">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left border-collapse" id="holiday-bookings-table">
          <thead>
            <tr class="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th scope="col" class="px-6 py-4">Booking Ref</th>
              <th scope="col" class="px-6 py-4">Customer</th>
              <th scope="col" class="px-6 py-4">Passenger</th>
              <th scope="col" class="px-6 py-4">Country</th>
              <th scope="col" class="px-6 py-4">Duration</th>
              <th scope="col" class="px-6 py-4">Amount</th>
              <th scope="col" class="px-6 py-4">Payment</th>
              <th scope="col" class="px-6 py-4">Status</th>
              <th scope="col" class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each data.items as booking (booking.id)}
              <tr 
                onclick={() => handleRowClick(booking.id)}
                class="hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <!-- Booking Ref, Entry Date & Processing Info -->
                <td class="px-6 py-4">
                  <span class="font-mono text-xs font-semibold text-foreground block">{booking.documentNumber}</span>
                  <span class="text-[11px] text-muted-foreground block font-mono mt-0.5">{formatDateOnly(booking.createdAt)}</span>
                  {#if booking.assignedOperatorName}
                    <div class="mt-1 text-[10px] font-mono">
                      <span class="font-semibold text-primary/90 block">Processing: {booking.assignedOperatorName}</span>
                    </div>
                  {/if}
                </td>
                
                <!-- Customer Head -->
                <td class="px-6 py-4 text-foreground font-medium">
                  {booking.headName || '-'}
                </td>
                
                <!-- Passenger Name -->
                <td class="px-6 py-4 text-foreground font-medium">
                  {booking.passengerName || '-'}
                </td>
                
                <!-- Country -->
                <td class="px-6 py-4 text-foreground max-w-[200px]">
                  {#if booking.country?.includes(',')}
                    <div class="flex flex-wrap gap-1">
                      {#each booking.country.split(',').map(s => s.trim()).filter(Boolean) as c}
                        <span class="inline-block px-1.5 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border">
                          {c}
                        </span>
                      {/each}
                    </div>
                  {:else}
                    <span>{booking.country || '-'}</span>
                  {/if}
                </td>

                <!-- Duration -->
                <td class="px-6 py-4 text-foreground">
                  {booking.days} {booking.days === 1 ? 'day' : 'days'}
                </td>
                
                <!-- Amount -->
                <td class="px-6 py-4 font-mono">
                  <MoneyDisplay amount={booking.payableAmount} />
                </td>
                
                <!-- Payment Status -->
                <td class="px-6 py-4">
                  <StatusBadge status={booking.paymentStatus} />
                </td>
                
                <!-- Processing Status -->
                <td class="px-6 py-4">
                  <StatusBadge status={booking.processingStatus} />
                </td>

                <!-- Actions -->
                <td class="px-6 py-4 text-right" onclick={(e) => e.stopPropagation()}>
                  <Button 
                    onclick={() => handleRowClick(booking.id)} 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="View Details"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="px-6 py-4 border-t border-border flex items-center justify-between gap-4 bg-muted/10 text-xs">
        <span class="text-muted-foreground">
          Showing <strong>{data.items.length}</strong> of <strong>{data.totalCount}</strong> holiday packages
        </span>
        
        <div class="flex items-center gap-2">
          <Button 
            onclick={() => updateFilters({ page: currentPage - 1 })}
            disabled={currentPage <= 1}
            variant="outline" 
            size="icon" 
            class="h-8 w-8"
            aria-label="Previous Page"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          
          <span class="font-medium text-foreground px-2">
            Page {currentPage} of {data.totalPages}
          </span>
          
          <Button 
            onclick={() => updateFilters({ page: currentPage + 1 })}
            disabled={currentPage >= data.totalPages}
            variant="outline" 
            size="icon" 
            class="h-8 w-8"
            aria-label="Next Page"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  {/if}
{/if}
