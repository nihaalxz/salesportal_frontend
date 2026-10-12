<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import {
    Scale,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Search,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    CreditCard,
    Banknote,
    Info,
    Plus,
    Loader2
  } from 'lucide-svelte';
  import {
    getDisputes,
    createDispute,
    getDisputeBookingOptions,
    type Dispute,
    type DisputeBookingOption,
    type DisputesQueryParams,
    type CreateDisputeRequest
  } from '$lib/features/disputes/api/disputes-api';

  // ─── List state ───────────────────────────────────────────────────────────
  let loading = $state(true);
  let error = $state<any>(null);
  let items = $state<Dispute[]>([]);
  let totalCount = $state(0);
  let totalPages = $state(1);
  let page = $state(1);
  const pageSize = 20;
  let statusFilter = $state('');
  let searchTerm = $state('');
  let searchInput = $state('');
  let selectedDispute = $state<Dispute | null>(null);
  let abortController: AbortController | null = null;

  // ─── Create modal state ───────────────────────────────────────────────────
  let showCreateModal = $state(false);
  let creating = $state(false);
  let createError = $state('');
  let formSubject = $state('');
  let formDescription = $state('');
  let formDisputableType = $state('FlightBooking');
  let formDisputableId = $state('');
  let formHeadId = $state<number | null>(null);
  let formIsRefund = $state(false);
  let formRefundAmount = $state('');
  let formName = $state('');
  let formIban = $state('');

  let bookingOptions = $state<DisputeBookingOption[]>([]);
  let loadingBookingOptions = $state(false);

  async function fetchBookingOptions(serviceType: string) {
    loadingBookingOptions = true;
    bookingOptions = [];
    formDisputableId = '';
    formHeadId = null;
    try {
      bookingOptions = await getDisputeBookingOptions(serviceType);
      if (bookingOptions.length > 0) {
        const first = bookingOptions[0];
        formDisputableId = String(first.id);
        formHeadId = first.headId;
        if (first.amount > 0) {
          formRefundAmount = String(first.amount);
        }
      }
    } catch (err) {
      console.error('Failed to fetch booking options', err);
    } finally {
      loadingBookingOptions = false;
    }
  }

  function handleServiceTypeChange(newType: string) {
    formDisputableType = newType;
    fetchBookingOptions(newType);
  }

  function handleBookingIdChange(idStr: string) {
    formDisputableId = idStr;
    const selected = bookingOptions.find(b => String(b.id) === idStr);
    if (selected) {
      formHeadId = selected.headId;
      if (selected.amount > 0) {
        formRefundAmount = String(selected.amount);
      }
    } else {
      formHeadId = null;
    }
  }

  function openCreateModal() {
    formSubject = '';
    formDescription = '';
    formDisputableType = 'FlightBooking';
    formDisputableId = '';
    formHeadId = null;
    formIsRefund = false;
    formRefundAmount = '';
    formName = '';
    formIban = '';
    createError = '';
    showCreateModal = true;
    fetchBookingOptions('FlightBooking');
  }

  async function handleCreate(e: SubmitEvent) {
    e.preventDefault();
    if (!formDisputableId) {
      createError = 'Please select a valid booking.';
      return;
    }
    creating = true;
    createError = '';
    try {
      const req: CreateDisputeRequest = {
        headId: formHeadId,
        disputableId: Number(formDisputableId),
        disputableType: formDisputableType,
        subject: formSubject.trim(),
        description: formDescription.trim(),
        isRefund: formIsRefund,
        refundAmount: formIsRefund && formRefundAmount ? Number(formRefundAmount) : null,
        name: formName.trim() || null,
        iban: formIban.trim() || null
      };
      await createDispute(req);
      showCreateModal = false;
      load(true);
    } catch (err: any) {
      createError = err?.detail || err?.message || 'Failed to create dispute.';
    } finally {
      creating = false;
    }
  }

  // ─── Load ──────────────────────────────────────────────────────────────────
  async function load(resetPage = false) {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    if (resetPage) page = 1;
    loading = true;
    error = null;
    try {
      const params: DisputesQueryParams = {
        page,
        pageSize,
        status: statusFilter || null,
        searchTerm: searchTerm || null
      };
      const result = await getDisputes(params, abortController.signal);
      items = result.items ?? [];
      totalCount = result.totalCount ?? 0;
      totalPages = result.totalPages ?? 1;
    } catch (err: any) {
      if (err.name !== 'AbortError') error = err;
    } finally {
      if (!abortController?.signal.aborted) loading = false;
    }
  }

  $effect(() => {
    load();
    return () => abortController?.abort();
  });

  function applyStatusFilter(val: string) {
    statusFilter = val;
    load(true);
  }

  function applySearch() {
    searchTerm = searchInput.trim();
    load(true);
  }

  function clearSearch() {
    searchInput = '';
    searchTerm = '';
    load(true);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function fmtDate(d: string | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const openCount   = $derived(items.filter(d => d.status === 'open').length);
  const resolvedCount = $derived(items.filter(d => d.status === 'resolved').length);
  const refundTotal = $derived(
    items.filter(d => d.refundProcessed && d.approvedRefundAmount).reduce((s, d) => s + (d.approvedRefundAmount ?? 0), 0)
  );

  const SERVICE_TYPES = [
    { value: 'FlightBooking', label: 'Flight Booking' },
    { value: 'HotelBooking', label: 'Hotel Booking' },
    { value: 'VisaApplication', label: 'Visa Application' },
    { value: 'VfsAppointment', label: 'VFS Appointment' },
    { value: 'HolidayPackage', label: 'Holiday Package' },
    { value: 'Transportation', label: 'Transportation' },
    { value: 'OtherService', label: 'Other Service' }
  ];
</script>

<PageHeader title="Disputes" description="Track and manage customer dispute and refund cases.">
  <div class="flex items-center gap-2">
    <Button onclick={openCreateModal} size="sm" class="gap-1.5">
      <Plus class="h-4 w-4" />
      <span>New Dispute</span>
    </Button>
    <Button onclick={() => load()} variant="outline" size="sm" class="gap-2">
      <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
      <span>Refresh</span>
    </Button>
  </div>
</PageHeader>

{#if error}
  <Alert.Root variant="destructive" class="mb-6">
    <ShieldAlert class="h-5 w-5" />
    <Alert.Title>Failed to Load Disputes</Alert.Title>
    <Alert.Description class="mt-1 text-sm">
      {error.detail || error.message || 'An unexpected error occurred.'}
    </Alert.Description>
  </Alert.Root>
{/if}

<!-- Stat Cards -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <Card class="border-l-4 border-l-amber-500">
    <CardContent class="pt-5">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
        <AlertTriangle class="h-4 w-4 text-amber-500" />
      </div>
      {#if loading}<Skeleton class="h-7 w-12 mt-2" />
      {:else}<div class="text-2xl font-bold mt-2 font-mono">{totalCount}</div>{/if}
      <p class="text-[10px] text-muted-foreground mt-1">Total dispute cases</p>
    </CardContent>
  </Card>

  <Card class="border-l-4 border-l-orange-400">
    <CardContent class="pt-5">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Open</span>
        <Clock class="h-4 w-4 text-orange-400" />
      </div>
      {#if loading}<Skeleton class="h-7 w-12 mt-2" />
      {:else}<div class="text-2xl font-bold mt-2 font-mono">{openCount}</div>{/if}
      <p class="text-[10px] text-muted-foreground mt-1">Awaiting review (this page)</p>
    </CardContent>
  </Card>

  <Card class="border-l-4 border-l-green-600">
    <CardContent class="pt-5">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resolved</span>
        <CheckCircle class="h-4 w-4 text-green-600" />
      </div>
      {#if loading}<Skeleton class="h-7 w-12 mt-2" />
      {:else}<div class="text-2xl font-bold mt-2 font-mono text-green-600 dark:text-green-400">{resolvedCount}</div>{/if}
      <p class="text-[10px] text-muted-foreground mt-1">Accepted resolutions</p>
    </CardContent>
  </Card>

  <Card class="border-l-4 border-l-primary">
    <CardContent class="pt-5">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Refunds Paid</span>
        <Banknote class="h-4 w-4 text-primary" />
      </div>
      {#if loading}<Skeleton class="h-7 w-20 mt-2" />
      {:else}<div class="text-2xl font-bold mt-2 font-mono"><MoneyDisplay amount={refundTotal} currency="BHD" /></div>{/if}
      <p class="text-[10px] text-muted-foreground mt-1">Approved refunds (this page)</p>
    </CardContent>
  </Card>
</div>

<!-- Filter + Table -->
<Card>
  <CardContent class="pt-5 space-y-4">
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 pb-4 border-b border-border">
      <div class="flex gap-1.5 flex-wrap">
        {#each [
          { value: '', label: 'All' },
          { value: 'open', label: 'Open' },
          { value: 'resolved', label: 'Resolved' },
          { value: 'rejected', label: 'Rejected' }
        ] as f}
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
              {statusFilter === f.value
                ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                : 'bg-background hover:bg-muted text-muted-foreground border-border'}"
            onclick={() => applyStatusFilter(f.value)}
          >{f.label}</button>
        {/each}
      </div>
      <div class="flex gap-2 ml-auto">
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Document Ref, subject or description…"
            class="h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-56"
            bind:value={searchInput}
            onkeydown={(e) => e.key === 'Enter' && applySearch()}
          />
        </div>
        <Button size="sm" variant="outline" class="h-8 px-3 text-xs" onclick={applySearch}>Search</Button>
        {#if searchTerm}
          <Button size="sm" variant="ghost" class="h-8 px-2 text-xs text-muted-foreground" onclick={clearSearch}>Clear</Button>
        {/if}
      </div>
    </div>

    {#if loading}
      <div class="space-y-3">{#each Array(5) as _}<Skeleton class="h-12 w-full rounded" />{/each}</div>
    {:else if items.length === 0}
      <div class="py-16 flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-lg bg-muted/10 text-center">
        <Scale class="h-10 w-10 text-muted-foreground/30" />
        <div>
          <p class="text-sm font-semibold text-muted-foreground">No dispute cases found</p>
          <p class="text-xs text-muted-foreground/70 mt-1">
            {searchTerm ? `No results for "${searchTerm}"` : 'No disputes match the selected filter.'}
          </p>
        </div>
        <Button variant="outline" size="sm" class="mt-1 gap-1.5" onclick={openCreateModal}>
          <Plus class="h-3.5 w-3.5" />
          Log first dispute
        </Button>
      </div>
    {:else}
      <div class="border border-border rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left border-collapse">
            <thead>
              <tr class="bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th class="px-4 py-3">Dispute No</th>
                <th class="px-4 py-3">Customer</th>
                <th class="px-4 py-3">Subject</th>
                <th class="px-4 py-3">Service Type</th>
                <th class="px-4 py-3">Refund Req.</th>
                <th class="px-4 py-3">Approved</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each items as d (d.id)}
                <tr class="hover:bg-muted/20 transition-colors group">
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs font-semibold text-foreground block">{d.documentNumber}</span>
                    <span class="text-[11px] text-muted-foreground block font-mono mt-0.5">{fmtDate(d.createdAt)}</span>
                  </td>
                  <td class="px-4 py-3">
                    {#if d.headName}
                      <span class="text-xs font-medium text-foreground">{d.headName}</span>
                    {:else}
                      <span class="text-xs text-muted-foreground/50">—</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 max-w-[180px]">
                    <span class="text-xs text-foreground line-clamp-2" title={d.subject}>{d.subject}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                      <CreditCard class="h-3 w-3 shrink-0" />
                      {d.disputableType}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-mono text-xs">
                    {#if d.isRefund && d.refundAmount}
                      <MoneyDisplay amount={d.refundAmount} currency="BHD" />
                    {:else if d.isRefund}
                      <span class="text-muted-foreground/60">Refund</span>
                    {:else}
                      <span class="text-muted-foreground/40">—</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 font-mono text-xs">
                    {#if d.refundProcessed && d.approvedRefundAmount}
                      <span class="text-green-600 dark:text-green-400 font-semibold">
                        <MoneyDisplay amount={d.approvedRefundAmount} currency="BHD" />
                      </span>
                    {:else}
                      <span class="text-muted-foreground/40">—</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    {#if d.status === 'open'}
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Clock class="h-3 w-3" />Open
                      </span>
                    {:else if d.status === 'resolved'}
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20 dark:text-green-400">
                        <CheckCircle class="h-3 w-3" />Resolved
                      </span>
                    {:else if d.status === 'rejected'}
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
                        <XCircle class="h-3 w-3" />Rejected
                      </span>
                    {:else}
                      <span class="text-xs text-muted-foreground">{d.status}</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(d.createdAt)}</td>
                  <td class="px-4 py-3">
                    <button
                      class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary hover:underline font-medium"
                      onclick={() => selectedDispute = d}
                    >View</button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      {#if totalPages > 1}
        <div class="flex items-center justify-between pt-2">
          <span class="text-xs text-muted-foreground">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div class="flex items-center gap-1">
            <Button size="sm" variant="outline" class="h-7 w-7 p-0" disabled={page <= 1} onclick={() => { page--; load(); }}>
              <ChevronLeft class="h-4 w-4" />
            </Button>
            <span class="text-xs px-2 font-medium">{page} / {totalPages}</span>
            <Button size="sm" variant="outline" class="h-7 w-7 p-0" disabled={page >= totalPages} onclick={() => { page++; load(); }}>
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>

<!-- ─── Create Dispute Modal ─────────────────────────────────────────────── -->
{#if showCreateModal}
  <div
    class="fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}
  >
    <div class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div class="flex items-center justify-between p-5 border-b border-border bg-muted/10">
        <div>
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <Scale class="h-4 w-4 text-primary" />
            Log New Dispute Case
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">Record a customer service dispute or refund request.</p>
        </div>
        <button class="text-muted-foreground hover:text-foreground p-1 rounded" onclick={() => showCreateModal = false} aria-label="Close">✕</button>
      </div>

      <form onsubmit={handleCreate}>
        <div class="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
          {#if createError}
            <div class="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2.5">{createError}</div>
          {/if}

          <!-- Subject -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground" for="d-subject">Subject *</label>
            <input
              id="d-subject"
              type="text"
              placeholder="Brief title of the dispute…"
              class="w-full h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
              bind:value={formSubject}
              required
            />
          </div>

          <!-- Service Type + Booking Dropdown -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground" for="d-type">Service Type *</label>
              <select
                id="d-type"
                class="w-full h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                value={formDisputableType}
                onchange={(e) => handleServiceTypeChange(e.currentTarget.value)}
                required
              >
                {#each SERVICE_TYPES as t}
                  <option value={t.value}>{t.label}</option>
                {/each}
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground" for="d-bid">Select Booking *</label>
              <select
                id="d-bid"
                class="w-full h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
                value={formDisputableId}
                onchange={(e) => handleBookingIdChange(e.currentTarget.value)}
                disabled={loadingBookingOptions || bookingOptions.length === 0}
                required
              >
                {#if loadingBookingOptions}
                  <option value="">Loading bookings…</option>
                {:else if bookingOptions.length === 0}
                  <option value="">No bookings found</option>
                {:else}
                  {#each bookingOptions as b (b.id)}
                    <option value={String(b.id)}>{b.label}</option>
                  {/each}
                {/if}
              </select>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground" for="d-desc">Description *</label>
            <textarea
              id="d-desc"
              rows="3"
              placeholder="Describe the issue in detail…"
              class="w-full px-3 py-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              bind:value={formDescription}
              required
            ></textarea>
          </div>

          <!-- Name & IBAN (Optional) -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground" for="d-name">Name</label>
              <input
                id="d-name"
                type="text"
                placeholder="Account / Contact name…"
                class="w-full h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                bind:value={formName}
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground" for="d-iban">IBAN</label>
              <input
                id="d-iban"
                type="text"
                placeholder="e.g. BH00 XXXX 0000 0000 00"
                class="w-full h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                bind:value={formIban}
              />
            </div>
          </div>

          <!-- Refund toggle -->
          <div class="flex items-center gap-3 p-3 bg-muted/20 rounded-md border border-border">
            <input
              id="d-refund"
              type="checkbox"
              class="h-4 w-4 rounded accent-primary"
              bind:checked={formIsRefund}
            />
            <label for="d-refund" class="text-xs font-medium text-foreground cursor-pointer select-none">
              This dispute includes a refund request
            </label>
          </div>

          {#if formIsRefund}
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground" for="d-amount">Refund Amount (BHD)</label>
              <input
                id="d-amount"
                type="number"
                min="0.001"
                step="0.001"
                placeholder="0.000"
                class="w-full h-9 px-3 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                bind:value={formRefundAmount}
              />
            </div>
          {/if}
        </div>

        <div class="px-5 py-4 bg-muted/10 border-t border-border flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onclick={() => showCreateModal = false}>Cancel</Button>
          <Button type="submit" size="sm" class="gap-1.5" disabled={creating || loadingBookingOptions || bookingOptions.length === 0}>
            {#if creating}
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>Saving…</span>
            {:else}
              <Plus class="h-4 w-4" />
              <span>Create Dispute</span>
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- ─── Detail Modal ──────────────────────────────────────────────────────── -->
{#if selectedDispute}
  {@const d = selectedDispute}
  <div
    class="fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    onclick={(e) => { if (e.target === e.currentTarget) selectedDispute = null; }}
  >
    <div class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div class="flex items-start justify-between p-5 border-b border-border bg-muted/10">
        <div>
          <h2 class="text-base font-semibold text-foreground flex items-center gap-2">
            <Scale class="h-4 w-4 text-primary" />
            Dispute {d.documentNumber}
          </h2>
          <p class="text-xs text-muted-foreground mt-0.5">{d.subject}</p>
        </div>
        <button class="text-muted-foreground hover:text-foreground p-1 rounded" onclick={() => selectedDispute = null} aria-label="Close">✕</button>
      </div>

      <div class="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
        <div class="flex items-center gap-2 flex-wrap">
          {#if d.status === 'open'}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20"><Clock class="h-3.5 w-3.5" />Open</span>
          {:else if d.status === 'resolved'}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20 dark:text-green-400"><CheckCircle class="h-3.5 w-3.5" />Resolved</span>
          {:else}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20"><XCircle class="h-3.5 w-3.5" />Rejected</span>
          {/if}
          {#if d.isRefund}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20"><Banknote class="h-3.5 w-3.5" />Refund Request</span>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
          <div><p class="text-muted-foreground font-medium">Customer</p><p class="text-foreground mt-0.5">{d.headName ?? '—'}</p></div>
          <div><p class="text-muted-foreground font-medium">Service Type</p><p class="text-foreground mt-0.5 font-mono">{d.disputableType}</p></div>
          <div><p class="text-muted-foreground font-medium">Booking ID</p><p class="text-foreground mt-0.5 font-mono">#{d.disputableId}</p></div>
          <div><p class="text-muted-foreground font-medium">Date Filed</p><p class="text-foreground mt-0.5">{fmtDate(d.createdAt)}</p></div>
          {#if d.name}
            <div><p class="text-muted-foreground font-medium">Name</p><p class="text-foreground mt-0.5 font-semibold">{d.name}</p></div>
          {/if}
          {#if d.iban}
            <div><p class="text-muted-foreground font-medium">IBAN</p><p class="text-foreground mt-0.5 font-mono font-semibold">{d.iban}</p></div>
          {/if}
          {#if d.isRefund}
            <div><p class="text-muted-foreground font-medium">Requested Refund</p>
              <p class="text-foreground mt-0.5 font-mono font-semibold">{d.refundAmount ? '' : '—'}{#if d.refundAmount}<MoneyDisplay amount={d.refundAmount} currency="BHD" />{/if}</p>
            </div>
            <div><p class="text-muted-foreground font-medium">Approved Refund</p>
              <p class="mt-0.5 font-mono font-semibold {d.refundProcessed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground/50'}">
                {#if d.refundProcessed && d.approvedRefundAmount}<MoneyDisplay amount={d.approvedRefundAmount} currency="BHD" />{:else}—{/if}
              </p>
            </div>
          {/if}
          {#if d.resolvedBy}
            <div><p class="text-muted-foreground font-medium">Resolved By</p><p class="text-foreground mt-0.5">{d.resolvedBy}</p></div>
            <div><p class="text-muted-foreground font-medium">Resolved At</p><p class="text-foreground mt-0.5">{fmtDate(d.resolvedAt)}</p></div>
          {/if}
        </div>

        <div>
          <p class="text-xs text-muted-foreground font-medium mb-1">Description</p>
          <p class="text-xs text-foreground bg-muted/20 rounded p-3 leading-relaxed border border-border">{d.description}</p>
        </div>

        {#if d.resolution || d.resolutionNote}
          <div>
            <p class="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1"><Info class="h-3.5 w-3.5" />Resolution</p>
            {#if d.resolution}<p class="text-xs text-foreground bg-muted/20 rounded p-3 leading-relaxed border border-border">{d.resolution}</p>{/if}
            {#if d.resolutionNote}<p class="text-xs text-muted-foreground mt-1 italic">{d.resolutionNote}</p>{/if}
          </div>
        {/if}
      </div>

      <div class="px-5 py-4 border-t border-border bg-muted/10 flex justify-end">
        <Button variant="outline" size="sm" onclick={() => selectedDispute = null}>Close</Button>
      </div>
    </div>
  </div>
{/if}
