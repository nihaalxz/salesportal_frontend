<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import CustomerBalanceBadge from '$lib/features/customer-accounts/components/CustomerBalanceBadge.svelte';
  import NationalitySelect from '$lib/components/NationalitySelect.svelte';
  import PhoneCodeSelect from '$lib/components/PhoneCodeSelect.svelte';
  import { getHeads, getAvailableCountryCodes, type CountryCodeOption } from '$lib/features/heads/api/heads-api';
  import { parseHeadsUrlParams, serializeHeadsUrlParams, DEFAULTS } from '$lib/features/heads/utils/url-state';
  import { openCreateHeadModal } from '$lib/services/shortcuts';
  import { countries } from '$lib/utils/countries';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Alert from '$lib/components/ui/alert';
  import { onMount } from 'svelte';
  import { 
    Search, 
    ArrowUpDown, 
    ArrowUp, 
    ArrowDown, 
    ChevronLeft, 
    ChevronRight, 
    User, 
    CreditCard, 
    Mail, 
    Phone,
    ShieldAlert,
    RefreshCw,
    Plus
  } from 'lucide-svelte';

  let loading = $state(true);
  let error = $state<any>(null);
  let headsData = $state<any>(null);
  let searchInput = $state('');

  let abortController: AbortController | null = null;
  let searchDebounceTimer: any;

  onMount(() => {
    const handleHeadCreated = () => {
      fetchHeadsData(searchParamsKey);
    };
    window.addEventListener('head-created', handleHeadCreated);
    return () => {
      window.removeEventListener('head-created', handleHeadCreated);
    };
  });



  let availableCountryCodes = $state<CountryCodeOption[]>([]);
  let loadingCountryCodes = $state(false);
  let countryCodesAbortController: AbortController | null = null;

  async function loadCountryCodes(type: string) {
    if (countryCodesAbortController) {
      countryCodesAbortController.abort();
    }
    countryCodesAbortController = new AbortController();
    loadingCountryCodes = true;
    try {
      availableCountryCodes = await getAvailableCountryCodes(type, countryCodesAbortController.signal);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load country codes', err);
      }
    } finally {
      if (!countryCodesAbortController.signal.aborted) {
        loadingCountryCodes = false;
      }
    }
  }

  function handleCountryCodeChange(e: Event) {
    const code = (e.target as HTMLSelectElement).value;
    const currentParams = parseHeadsUrlParams($page.url.searchParams);
    currentParams.countryCode = code || undefined;
    currentParams.page = 1;
    const newQuery = serializeHeadsUrlParams(currentParams);
    goto(`?${newQuery.toString()}`, { keepFocus: true });
  }

  let searchParamsKey = $derived($page.url.searchParams.toString());
  let requestId = 0;

  async function fetchHeadsData(paramsString: string) {
    const thisRequestId = ++requestId;
    loading = true;
    error = null;

    const urlParams = new URLSearchParams(paramsString);
    const queryParams = parseHeadsUrlParams(urlParams);
    searchInput = queryParams.searchTerm || '';

    try {
      const result = await getHeads(queryParams);
      if (thisRequestId === requestId) {
        headsData = result;
      }
    } catch (err: any) {
      if (thisRequestId === requestId) {
        error = err;
      }
    } finally {
      if (thisRequestId === requestId) {
        loading = false;
      }
    }
  }

  function handleSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    searchInput = value;
    
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      const currentParams = parseHeadsUrlParams($page.url.searchParams);
      currentParams.searchTerm = value.trim() || undefined;
      currentParams.page = 1;
      const newQuery = serializeHeadsUrlParams(currentParams);
      goto(`?${newQuery.toString()}`, { replaceState: true, keepFocus: true });
    }, 300);
  }

  function handleSort(column: string) {
    const currentParams = parseHeadsUrlParams($page.url.searchParams);
    if (currentParams.sortBy === column) {
      currentParams.sortOrder = currentParams.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      currentParams.sortBy = column;
      currentParams.sortOrder = 'asc';
    }
    currentParams.page = 1;
    const newQuery = serializeHeadsUrlParams(currentParams);
    goto(`?${newQuery.toString()}`, { replaceState: true, keepFocus: true });
  }

  function handlePageChange(newPage: number) {
    const currentParams = parseHeadsUrlParams($page.url.searchParams);
    currentParams.page = newPage;
    const newQuery = serializeHeadsUrlParams(currentParams);
    goto(`?${newQuery.toString()}`, { keepFocus: true });
  }

  function handlePageSizeChange(size: number) {
    const currentParams = parseHeadsUrlParams($page.url.searchParams);
    currentParams.pageSize = size;
    currentParams.page = 1;
    const newQuery = serializeHeadsUrlParams(currentParams);
    goto(`?${newQuery.toString()}`, { replaceState: true, keepFocus: true });
  }

  function handleRetry() {
    fetchHeadsData(searchParamsKey);
  }

  $effect(() => {
    const key = searchParamsKey;
    fetchHeadsData(key);
  });

  const parsedParams = $derived(parseHeadsUrlParams($page.url.searchParams));
  const pageNum = $derived(parsedParams.page ?? 1);
  const pageSizeNum = $derived(parsedParams.pageSize ?? 10);
  const activeTab = $derived(parsedParams.type || 'all');
  const selectedCountryCode = $derived(parsedParams.countryCode || '');

  $effect(() => {
    const tab = activeTab;
    loadCountryCodes(tab);
    return () => {
      if (countryCodesAbortController) {
        countryCodesAbortController.abort();
      }
    };
  });

  function handleTabChange(tab: string) {
    const currentParams = parseHeadsUrlParams($page.url.searchParams);
    currentParams.type = tab === 'all' ? undefined : tab;
    currentParams.countryCode = undefined;
    currentParams.page = 1;
    const newQuery = serializeHeadsUrlParams(currentParams);
    goto(`?${newQuery.toString()}`, { keepFocus: true });
  }
</script>

<PageHeader title="Heads" description="View and manage primary customer balance ledgers.">
  <Button onclick={openCreateHeadModal} class="gap-1.5 bg-green-600 text-white hover:bg-green-700">
    <Plus class="h-4 w-4" />
    <span>Create Head</span>
  </Button>
</PageHeader>

<div class="space-y-6">
  <!-- Navigation Tabs -->
  <div class="border-b border-border">
    <nav class="flex gap-6 -mb-[1px]">
      <button
        onclick={() => handleTabChange('all')}
        class="hidden pb-3 text-sm font-medium transition-colors border-b-2 focus:outline-none {activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
      >
        All Heads
      </button>
      <button
        onclick={() => handleTabChange('customer')}
        class="pb-3 text-sm font-medium transition-colors border-b-2 focus:outline-none {activeTab === 'customer' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
      >
        Customers
      </button>
      <button
        onclick={() => handleTabChange('agent')}
        class="pb-3 text-sm font-medium transition-colors border-b-2 focus:outline-none {activeTab === 'agent' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
      >
        Agents
      </button>
    </nav>
  </div>

  <!-- Filters Bar -->
  <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
    <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
      <div class="relative w-full sm:w-64 md:w-80">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchInput}
          oninput={handleSearchInput}
          placeholder="Search name, email, phone..."
          class="pl-9 h-10"
        />
      </div>

      <!-- Dynamic Country Code Filter Dropdown -->
      <div class="w-full sm:w-auto">
        <select
          value={selectedCountryCode}
          onchange={handleCountryCodeChange}
          disabled={loadingCountryCodes}
          class="w-full sm:w-auto bg-background border border-input rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer h-10 min-w-[170px]"
          aria-label="Filter by Country Code"
        >
          <option value="">All Countries ({availableCountryCodes.reduce((acc, c) => acc + c.count, 0)})</option>
          {#each availableCountryCodes as opt}
            <option value={opt.countryCode}>
              {opt.flag} {opt.countryName} ({opt.countryCode}) ({opt.count})
            </option>
          {/each}
        </select>
      </div>
    </div>

    <div class="flex items-center gap-2 self-end sm:self-auto">
      <span class="text-xs text-muted-foreground">Rows per page:</span>
      <select
        value={parsedParams.pageSize}
        onchange={(e) => handlePageSizeChange(parseInt((e.target as HTMLSelectElement).value, 10))}
        class="bg-background border border-input rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={200}>200</option>
        <option value={500}>500</option>
        <option value={1000}>1000 (All)</option>
      </select>
    </div>
  </div>

  {#if error}
    <Alert.Root variant="destructive">
      <ShieldAlert class="h-5 w-5" />
      <Alert.Title>Failed to load customer Heads</Alert.Title>
      <Alert.Description class="mt-2 flex flex-col gap-3">
        <p>{error.detail || error.message || 'An error occurred while communicating with the server.'}</p>
        <Button onclick={handleRetry} variant="outline" size="sm" class="w-fit gap-2">
          <RefreshCw class="h-4 w-4" />
          <span>Retry Loading</span>
        </Button>
      </Alert.Description>
    </Alert.Root>

  {:else if loading}
    <!-- Loading Skeletons -->
    <Card>
      <CardContent class="p-0">
        <div class="space-y-4 p-6">
          {#each Array(5) as _}
            <div class="flex items-center gap-4 py-2 border-b border-border last:border-0">
              <Skeleton class="h-5 w-1/4" />
              <Skeleton class="h-5 w-1/4" />
              <Skeleton class="h-5 w-1/6" />
              <Skeleton class="h-5 w-1/12 ml-auto" />
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>

  {:else if !headsData || !headsData.items || headsData.items.length === 0}
    <!-- Empty State -->
    <Card class="border-dashed">
      <CardContent class="flex flex-col items-center justify-center p-12 text-center">
        <User class="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 class="text-lg font-semibold text-foreground">No customer records found</h3>
        <p class="text-sm text-muted-foreground mt-1 max-w-sm">
          {#if parsedParams.searchTerm}
            No Heads match your search criteria "{parsedParams.searchTerm}". Try clearing search.
          {:else if parsedParams.countryCode}
            No {activeTab === 'agent' ? 'agents' : 'customer Heads'} found for country code {parsedParams.countryCode}.
          {:else}
            You don't have any customer Heads associated with your salesman profile.
          {/if}
        </p>
      </CardContent>
    </Card>

  {:else}
    <!-- Responsive Table -->
    <Card class="overflow-hidden border border-border">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-muted/40 border-b border-border font-medium text-muted-foreground select-none">
              <th 
                onclick={() => handleSort('lastName')}
                class="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors"
                aria-sort={parsedParams.sortBy === 'lastName' ? (parsedParams.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div class="flex items-center gap-1.5">
                  <span>Name</span>
                  {#if parsedParams.sortBy === 'lastName'}
                    {#if parsedParams.sortOrder === 'asc'}
                      <ArrowUp class="h-3.5 w-3.5" />
                    {:else}
                      <ArrowDown class="h-3.5 w-3.5" />
                    {/if}
                  {:else}
                    <ArrowUpDown class="h-3.5 w-3.5 text-muted-foreground/50" />
                  {/if}
                </div>
              </th>
              <th class="px-6 py-4">Contact</th>
              <th class="px-6 py-4">Type</th>
              <th 
                onclick={() => handleSort('wallet')}
                class="px-6 py-4 cursor-pointer hover:bg-muted/80 transition-colors text-right"
                aria-sort={parsedParams.sortBy === 'wallet' ? (parsedParams.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div class="flex items-center gap-1.5 justify-end">
                  <span>Balance</span>
                  {#if parsedParams.sortBy === 'wallet'}
                    {#if parsedParams.sortOrder === 'asc'}
                      <ArrowUp class="h-3.5 w-3.5" />
                    {:else}
                      <ArrowDown class="h-3.5 w-3.5" />
                    {/if}
                  {:else}
                    <ArrowUpDown class="h-3.5 w-3.5 text-muted-foreground/50" />
                  {/if}
                </div>
              </th>
              <th class="px-6 py-4">Status</th>

            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each headsData.items as head (head.id)}
              <tr 
              onclick={() => {
                  const tab = $page.url.searchParams.get('tab');
                  const dest = `/heads/${head.id}?type=${head.type}${tab ? `&tab=${tab}` : ''}`;
                  goto(dest);
                }}

                class="hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <td class="px-6 py-4 font-semibold text-foreground group-hover:text-green-600 transition-colors">
                  {head.firstName || ''} {head.lastName || ''}
                </td>
                <td class="px-6 py-4 text-muted-foreground text-xs space-y-1">
                  <div class="flex items-center gap-1.5">
                    <Mail class="h-3.5 w-3.5 shrink-0" />
                    <span>{head.email}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Phone class="h-3.5 w-3.5 shrink-0" />
                    <span>{head.mobileNo}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {head.type}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <CustomerBalanceBadge balance={head.wallet ?? 0} />
                </td>
                <td class="px-6 py-4">
                  <StatusBadge status={head.status} />
                </td>

              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/20 text-xs">
        <span class="text-muted-foreground">
          Showing <strong>{((pageNum - 1) * pageSizeNum) + 1}</strong> to 
          <strong>{Math.min(pageNum * pageSizeNum, headsData.totalCount)}</strong> of 
          <strong>{headsData.totalCount}</strong> records
        </span>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground whitespace-nowrap">Rows per page:</span>
            <select
              value={parsedParams.pageSize}
              onchange={(e) => handlePageSizeChange(parseInt((e.target as HTMLSelectElement).value, 10))}
              class="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000 (All)</option>
            </select>
          </div>

          <div class="flex items-center gap-1">
            <Button
              onclick={() => handlePageChange(pageNum - 1)}
              disabled={pageNum <= 1}
              variant="outline"
              size="icon"
              class="h-8 w-8"
            >
              <ChevronLeft class="h-4 w-4" />
            </Button>
            {#each Array(headsData.totalPages) as _, i}
              {#if i + 1 === pageNum || i + 1 === 1 || i + 1 === headsData.totalPages || Math.abs(i + 1 - pageNum) <= 1}
                <Button
                  onclick={() => handlePageChange(i + 1)}
                  variant={pageNum === i + 1 ? 'default' : 'outline'}
                  class="h-8 w-8 text-xs p-0"
                >
                  {i + 1}
                </Button>
              {:else if i === 1 || i + 2 === headsData.totalPages}
                <span class="px-1 text-muted-foreground">...</span>
              {/if}
            {/each}
            <Button
              onclick={() => handlePageChange(pageNum + 1)}
              disabled={pageNum >= headsData.totalPages}
              variant="outline"
              size="icon"
              class="h-8 w-8"
            >
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  {/if}
</div>


