<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { formatDateOnly, formatDateTime } from '$lib/formatters/date';
  import { 
    getQuotations, 
    downloadSavedQuotationPdf, 
    type QuotationSummary 
  } from '$lib/features/quotations/api/quotation-api';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { 
    Plus, 
    RefreshCw, 
    ChevronLeft, 
    ChevronRight, 
    FileSpreadsheet, 
    AlertCircle,
    Eye,
    Search,
    X,
    Download,
    Clock,
    CheckCircle2,
    XCircle,
    Lock
  } from 'lucide-svelte';

  // Reactively bind query parameters from URL state
  let currentPage = $derived(Number(page.url.searchParams.get('page') || '1'));
  let searchTerm = $derived(page.url.searchParams.get('searchTerm') || page.url.searchParams.get('search') || '');
  let statusFilter = $derived(page.url.searchParams.get('status') || '');

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
  let data = $state<{ items: QuotationSummary[]; totalCount: number; totalPages: number } | null>(null);

  let abortController: AbortController | null = null;

  async function loadData() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading = true;
    error = null;

    try {
      const response = await getQuotations({
        page: currentPage,
        pageSize: 10,
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined
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

  onMount(() => {
    loadData();
  });

  // Reload when query params change
  $effect(() => {
    loadData();
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  });

  function updateFilters(newParams: Record<string, string | null>) {
    const params = new URLSearchParams(page.url.searchParams);
    for (const [key, value] of Object.entries(newParams)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (!newParams.page) {
      params.set('page', '1');
    }
    goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
  }

  async function handleDownloadPdf(item: QuotationSummary, e: MouseEvent) {
    e.stopPropagation();
    try {
      const blob = await downloadSavedQuotationPdf(item.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.documentNumber || 'QUOTATION'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    }
  }

  async function handlePreviewPdf(item: QuotationSummary, e: MouseEvent) {
    e.stopPropagation();
    try {
      const blob = await downloadSavedQuotationPdf(item.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to preview PDF.');
    }
  }

  function isApproved(status?: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'approved' || s === 'success';
  }
</script>

<PageHeader 
  title="Quotations" 
  description="Manage and track all official price estimate quotations across all customers and agents."
>
  <div class="flex items-center gap-2">
    <Button 
      onclick={() => loadData()} 
      variant="outline" 
      size="sm" 
      class="gap-1.5 text-xs shadow-xs" 
      disabled={loading}
    >
      <RefreshCw class={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      <span>Refresh</span>
    </Button>
    <Button 
      onclick={() => goto('/quotations/new')} 
      variant="default" 
      size="sm" 
      class="gap-1.5 text-xs shadow-md bg-teal-600 hover:bg-teal-700 text-white"
    >
      <Plus class="h-3.5 w-3.5" />
      <span>New Quotation</span>
    </Button>
  </div>
</PageHeader>

<div class="w-full space-y-4">
  {#if error}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-5 w-5" />
      <Alert.Title>Failed to load quotations</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{error.message || 'Unknown network error'}</Alert.Description>
    </Alert.Root>
  {/if}

  <!-- Filters & Search Toolbar -->
  <Card class="bg-card shadow-2xs">
    <CardContent class="p-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
      
      <!-- Search Input -->
      <div class="relative w-full md:w-96">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search all quotations by quote #, client, contact..." 
          value={searchInput}
          oninput={handleSearchInput}
          class="w-full bg-background border border-border rounded-md pl-9 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-600"
        />
        {#if searchInput}
          <button 
            type="button" 
            onclick={clearSearch}
            class="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        {/if}
      </div>

      <div class="text-xs text-muted-foreground font-medium">
        {#if data}
          Total: <strong class="text-foreground">{data.totalCount}</strong> quotation(s)
        {/if}
      </div>
    </CardContent>
  </Card>

  <!-- Quotations Table -->
  <Card class="bg-card shadow-2xs overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-xs text-left">
        <thead class="bg-muted/50 text-muted-foreground font-semibold border-b border-border text-[11px] uppercase tracking-wider">
          <tr>
            <th class="py-3 px-4">Quotation #</th>
            <th class="py-3 px-4">Date</th>
            <th class="py-3 px-4">Client / Recipient</th>
            <th class="py-3 px-4">Status</th>
            <th class="py-3 px-4 text-center">Items</th>
            <th class="py-3 px-4 text-right">Estimate Total</th>
            <th class="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#if loading}
            {#each Array(5) as _}
              <tr class="animate-pulse">
                <td class="py-3.5 px-4"><Skeleton class="h-4 w-24" /></td>
                <td class="py-3.5 px-4"><Skeleton class="h-4 w-20" /></td>
                <td class="py-3.5 px-4"><Skeleton class="h-4 w-32" /></td>
                <td class="py-3.5 px-4"><Skeleton class="h-4 w-16" /></td>
                <td class="py-3.5 px-4"><Skeleton class="h-4 w-10 mx-auto" /></td>
                <td class="py-3.5 px-4"><Skeleton class="h-4 w-20 ml-auto" /></td>
                <td class="py-3.5 px-4"><Skeleton class="h-6 w-20 ml-auto" /></td>
              </tr>
            {/each}
          {:else if !data || data.items.length === 0}
            <tr>
              <td colspan="7" class="text-center py-12 text-muted-foreground">
                <FileSpreadsheet class="h-10 w-10 mx-auto stroke-1 text-muted-foreground/50 mb-2" />
                <p class="text-sm font-medium">No quotations found</p>
                <p class="text-xs text-muted-foreground/70 mt-1">Create your first quotation by clicking "New Quotation".</p>
              </td>
            </tr>
          {:else}
            {#each data.items as item (item.id)}
              <tr 
                onclick={() => goto(`/quotations/${item.id}`)}
                class="hover:bg-muted/40 transition-colors cursor-pointer group"
              >
                <!-- Quotation Document Number -->
                <td class="py-3.5 px-4 font-mono font-bold text-teal-700 dark:text-teal-400">
                  {item.documentNumber}
                </td>

                <!-- Date -->
                <td class="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                  {formatDateOnly(item.createdAt)}
                </td>

                <!-- Recipient Info -->
                <td class="py-3.5 px-4">
                  <div class="font-semibold text-foreground">{item.customerName}</div>
                  {#if item.customerContact || item.customerEmail}
                    <div class="text-[11px] text-muted-foreground">
                      {item.customerContact || item.customerEmail}
                    </div>
                  {/if}
                </td>

                <!-- Status Badge -->
                <td class="py-3.5 px-4">
                  {#if isApproved(item.status)}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 class="h-3 w-3" />
                      Approved
                    </span>
                  {:else if (item.status || '').toLowerCase() === 'rejected'}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
                      <XCircle class="h-3 w-3" />
                      Rejected
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      <Clock class="h-3 w-3" />
                      Pending
                    </span>
                  {/if}
                </td>

                <!-- Items Count -->
                <td class="py-3.5 px-4 text-center">
                  <span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono bg-muted text-muted-foreground">
                    {item.itemsCount}
                  </span>
                </td>

                <!-- Total Amount -->
                <td class="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                  <MoneyDisplay amount={item.totalAmount} />
                </td>

                <!-- Actions -->
                <td class="py-3.5 px-4 text-right">
                  <div class="flex items-center justify-end gap-1" role="presentation" onclick={(e) => e.stopPropagation()}>
                    <Button 
                      onclick={() => goto(`/quotations/${item.id}`)} 
                      variant="ghost" 
                      size="sm" 
                      class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="View Details"
                    >
                      <Eye class="h-3.5 w-3.5" />
                    </Button>
                    
                    {#if isApproved(item.status)}
                      <Button 
                        onclick={(e) => handlePreviewPdf(item, e)} 
                        variant="ghost" 
                        size="sm" 
                        class="h-7 w-7 p-0 text-teal-700 hover:text-teal-800 dark:text-teal-400"
                        title="Preview PDF"
                      >
                        <FileSpreadsheet class="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        onclick={(e) => handleDownloadPdf(item, e)} 
                        variant="ghost" 
                        size="sm" 
                        class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Download PDF"
                      >
                        <Download class="h-3.5 w-3.5" />
                      </Button>
                    {:else}
                      <span class="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 italic px-1.5 py-0.5">
                        <Lock class="h-3 w-3" />
                        PDF Locked
                      </span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    {#if data && data.totalPages > 1}
      <div class="p-3 border-t border-border flex items-center justify-between bg-muted/20 text-xs">
        <span class="text-muted-foreground">
          Showing page <strong>{data.items.length ? currentPage : 0}</strong> of <strong>{data.totalPages}</strong> ({data.totalCount} total)
        </span>
        <div class="flex items-center gap-1.5">
          <Button 
            onclick={() => updateFilters({ page: String(currentPage - 1) })}
            disabled={currentPage <= 1}
            variant="outline" 
            size="sm" 
            class="h-7 px-2 text-xs"
          >
            <ChevronLeft class="h-3.5 w-3.5 mr-1" />
            <span>Previous</span>
          </Button>
          <Button 
            onclick={() => updateFilters({ page: String(currentPage + 1) })}
            disabled={currentPage >= data.totalPages}
            variant="outline" 
            size="sm" 
            class="h-7 px-2 text-xs"
          >
            <span>Next</span>
            <ChevronRight class="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    {/if}
  </Card>
</div>
