<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { getReceipts } from '$lib/features/receipts/api/receipts-api';
  import { formatDateOnly, formatDateTime } from '$lib/formatters/date';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    CreditCard, 
    ShieldAlert,
    RefreshCw,
    Plus,
    CheckCircle,
    Eye,
    AlertCircle
  } from 'lucide-svelte';

  let loading = $state(true);
  let error = $state<any>(null);
  let receiptsData = $state<any>(null);
  let searchInput = $state('');

  let abortController: AbortController | null = null;
  let searchDebounceTimer: any;

  const pageNum = $derived(parseInt($page.url.searchParams.get('page') || '1', 10));
  const pageSizeNum = $derived(parseInt($page.url.searchParams.get('pageSize') || '10', 10));

  async function fetchReceipts(urlSearchParams: URLSearchParams) {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading = true;
    error = null;

    const page = parseInt(urlSearchParams.get('page') || '1', 10);
    const pageSize = parseInt(urlSearchParams.get('pageSize') || '10', 10);
    const searchTerm = urlSearchParams.get('searchTerm') || undefined;

    searchInput = searchTerm || '';

    try {
      receiptsData = await getReceipts({ page, pageSize, searchTerm }, abortController.signal);
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

  function handleSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    searchInput = value;

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      const currentParams = new URLSearchParams($page.url.searchParams);
      if (value.trim()) {
        currentParams.set('searchTerm', value.trim());
      } else {
        currentParams.delete('searchTerm');
      }
      currentParams.set('page', '1');
      goto(`?${currentParams.toString()}`, { replaceState: true, keepFocus: true });
    }, 300);
  }

  function handlePageChange(newPage: number) {
    const currentParams = new URLSearchParams($page.url.searchParams);
    currentParams.set('page', String(newPage));
    goto(`?${currentParams.toString()}`, { keepFocus: true });
  }



  $effect(() => {
    fetchReceipts($page.url.searchParams);
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  });
</script>

<PageHeader title="Receipts & Collections" description="Manage payments received and balance allocations.">
  <Button onclick={() => goto('/receipts/new')} class="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
    <Plus class="h-4 w-4" />
    <span>New Receipt</span>
  </Button>
</PageHeader>

<div class="space-y-6">
  <!-- Search -->
  <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
    <div class="relative w-full sm:max-w-md">
      <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={searchInput}
        oninput={handleSearchInput}
        placeholder="Search by Document Ref, receipts or customer heads..."
        class="pl-9 h-10"
      />
    </div>
  </div>

  {#if error}
    <Alert.Root variant="destructive">
      <ShieldAlert class="h-5 w-5" />
      <Alert.Title>Failed to load receipts</Alert.Title>
      <Alert.Description class="mt-2 flex flex-col gap-3">
        <p>{error.detail || error.message || 'An error occurred while communicating with the server.'}</p>
        <Button onclick={() => fetchReceipts($page.url.searchParams)} variant="outline" size="sm" class="w-fit gap-2">
          <RefreshCw class="h-4 w-4" />
          <span>Retry Loading</span>
        </Button>
      </Alert.Description>
    </Alert.Root>

  {:else if loading}
    <div class="space-y-4">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-10 w-full" />
    </div>

  {:else if !receiptsData || receiptsData.items.length === 0}
    <Card class="border-dashed">
      <CardContent class="flex flex-col items-center justify-center p-12 text-center">
        <CreditCard class="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 class="text-lg font-semibold text-foreground">No receipts found</h3>
        <p class="text-sm text-muted-foreground mt-1 max-w-sm">
          {#if searchInput}
            No payment receipts match your search terms.
          {:else}
            You have no payment receipts logged in the system. Create a new receipt to record a payment.
          {/if}
        </p>
      </CardContent>
    </Card>

  {:else}
    <Card class="overflow-hidden border border-border bg-card shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-muted/40 border-b border-border font-medium text-muted-foreground">
              <th class="px-6 py-4">Receipt ID</th>
              <th class="px-6 py-4">Date</th>
              <th class="px-6 py-4">Customer Head</th>
              <th class="px-6 py-4">Service</th>
              <th class="px-6 py-4 text-right">Amount</th>
              <th class="px-6 py-4">Method</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each receiptsData.items as r (r.id)}
              <tr class="hover:bg-muted/20">
                <td class="px-6 py-4">
                  <span class="font-mono text-xs font-semibold text-foreground block">{r.documentNumber || r.receiptId}</span>
                  <span class="text-[11px] text-muted-foreground block font-mono mt-0.5">{formatDateOnly(r.createdAt)}</span>
                </td>
                <td class="px-6 py-4 text-xs text-muted-foreground font-mono">
                  {formatDateOnly(r.createdAt)}
                </td>
                <td class="px-6 py-4 text-foreground font-medium">
                  {r.headName || 'General Account'}
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30 capitalize">
                    {r.service === 'credit_settlement' ? 'Credit Settlement' : r.service.replace('_', ' ')}
                  </span>
                </td>
                <td class="px-6 py-4 text-right font-medium font-mono text-foreground">
                  <MoneyDisplay amount={r.amount} currency="BHD" />
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
                    {r.paymentMode}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <StatusBadge status={r.status} />
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-1.5">
                    <Button size="sm" variant="outline" class="h-8 gap-1" onclick={() => goto(`/receipts/${r.id}`)}>
                      <Eye class="h-3.5 w-3.5" />
                      <span>Details</span>
                    </Button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Pagination Footer -->
    <div class="flex items-center justify-between bg-muted/20 border border-border rounded-lg px-6 py-4 text-xs mt-6">
      <span class="text-muted-foreground">
        Page <strong>{pageNum}</strong> of <strong>{receiptsData.totalPages}</strong> ({receiptsData.totalCount} receipts)
      </span>
      <div class="flex items-center gap-1">
        <Button
          onclick={() => handlePageChange(pageNum - 1)}
          disabled={pageNum <= 1}
          variant="outline"
          size="sm"
          class="h-8 gap-1"
        >
          <ChevronLeft class="h-4 w-4" />
          <span>Previous</span>
        </Button>
        <Button
          onclick={() => handlePageChange(pageNum + 1)}
          disabled={pageNum >= receiptsData.totalPages}
          variant="outline"
          size="sm"
          class="h-8 gap-1"
        >
          <span>Next</span>
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}
</div>
