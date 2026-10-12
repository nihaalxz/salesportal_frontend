<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import CustomerBalanceBadge from '$lib/features/customer-accounts/components/CustomerBalanceBadge.svelte';
  import NationalitySelect from '$lib/components/NationalitySelect.svelte';
  import { getHeads, createHead } from '$lib/features/heads/api/heads-api';
  import { parseHeadsUrlParams, serializeHeadsUrlParams, DEFAULTS } from '$lib/features/heads/utils/url-state';
  import { countries } from '$lib/utils/countries';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Alert from '$lib/components/ui/alert';
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

  // Dialog / Modal States
  let showCreateDialog = $state(false);

  let dialogFirstName = $state('');
  let dialogLastName = $state('');
  let dialogType = $state('customer');
  let dialogCountryCode = $state('+973');
  let dialogPhoneNo = $state('');
  let dialogEmail = $state('');
  let dialogNationality = $state('Bahraini');
  let dialogAddress = $state('');

  let dialogSubmitting = $state(false);
  let dialogError = $state<string | null>(null);

  function openCreateDialog() {
    dialogFirstName = '';
    dialogLastName = '';
    dialogType = 'customer';
    dialogCountryCode = '+973';
    dialogPhoneNo = '';
    dialogEmail = '';
    dialogNationality = 'Bahraini';
    dialogAddress = '';
    dialogError = null;
    showCreateDialog = true;
  }



  async function handleCreateHead(e: SubmitEvent) {
    e.preventDefault();
    dialogSubmitting = true;
    dialogError = null;
    try {
      await createHead({
        firstName: dialogFirstName,
        lastName: dialogLastName,
        type: dialogType,
        mobileNo: `${dialogCountryCode}${dialogPhoneNo}`,
        email: dialogEmail,
        nationality: dialogNationality,
        address: dialogAddress
      });
      showCreateDialog = false;
      fetchHeadsData($page.url.searchParams);
    } catch (err: any) {
      if (err.errors && typeof err.errors === 'object') {
        const messages = Object.values(err.errors).flat().join(' ');
        dialogError = messages || err.detail || err.message || 'Failed to create customer head.';
      } else {
        dialogError = err.detail || err.message || 'Failed to create customer head.';
      }
    } finally {
      dialogSubmitting = false;
    }
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

  function handleTabChange(tab: string) {
    const currentParams = parseHeadsUrlParams($page.url.searchParams);
    currentParams.type = tab === 'all' ? undefined : tab;
    currentParams.page = 1;
    const newQuery = serializeHeadsUrlParams(currentParams);
    goto(`?${newQuery.toString()}`, { keepFocus: true });
  }
</script>

<PageHeader title="Heads" description="View and manage primary customer balance ledgers.">
  <Button onclick={openCreateDialog} class="gap-1.5 bg-green-600 text-white hover:bg-green-700">
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
    <div class="relative w-full sm:max-w-xs">
      <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={searchInput}
        oninput={handleSearchInput}
        placeholder="Search name, email, phone..."
        class="pl-9 h-10"
      />
    </div>

    <div class="flex items-center gap-2 self-end sm:self-auto">
      <span class="text-xs text-muted-foreground">Rows per page:</span>
      <select
        value={parsedParams.pageSize}
        onchange={(e) => handlePageSizeChange(parseInt((e.target as HTMLSelectElement).value, 10))}
        class="bg-background border border-input rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
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
      <div class="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 text-xs">
        <span class="text-muted-foreground">
          Showing <strong>{((pageNum - 1) * pageSizeNum) + 1}</strong> to 
          <strong>{Math.min(pageNum * pageSizeNum, headsData.totalCount)}</strong> of 
          <strong>{headsData.totalCount}</strong> records
        </span>

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
    </Card>
  {/if}
</div>

<!-- CREATE DIALOG MODAL -->
{#if showCreateDialog}
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 class="font-semibold text-base text-foreground">Create Customer Head</h3>
        <button onclick={() => showCreateDialog = false} class="text-muted-foreground hover:text-foreground text-sm font-semibold">✕</button>
      </div>
      <form onsubmit={handleCreateHead} class="p-6 space-y-4">
        {#if dialogError}
          <div class="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
            {dialogError}
          </div>
        {/if}
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">First Name *</label>
            <Input bind:value={dialogFirstName} placeholder="First Name" required />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Last Name *</label>
            <Input bind:value={dialogLastName} placeholder="Last Name" required />
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Email *</label>
          <Input type="email" bind:value={dialogEmail} placeholder="email@example.com" required />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Code *</label>
            <select bind:value={dialogCountryCode} class="w-full text-xs bg-background border border-border rounded px-3 py-2 h-10 text-foreground focus:outline-none font-semibold">
              {#each countries as country}
                <option value={country.dialCode}>{country.flag} {country.dialCode}</option>
              {/each}
            </select>
          </div>
          <div class="col-span-2 space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Mobile No *</label>
            <Input bind:value={dialogPhoneNo} placeholder="Mobile Phone" required />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="nationalitySelect" class="text-xs font-semibold text-muted-foreground">Nationality *</label>
          <NationalitySelect id="nationalitySelect" bind:value={dialogNationality} />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Address *</label>
          <Input bind:value={dialogAddress} placeholder="Address details" required />
        </div>
        <div class="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" type="button" onclick={() => showCreateDialog = false}>Cancel</Button>
          <Button type="submit" class="bg-green-600 hover:bg-green-700 text-white" disabled={dialogSubmitting}>
            {#if dialogSubmitting}
              Saving...
            {:else}
              Save Customer
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}


