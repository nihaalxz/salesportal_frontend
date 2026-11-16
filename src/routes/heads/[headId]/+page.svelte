<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import CustomerAccountDashboard from '$lib/features/customer-accounts/components/CustomerAccountDashboard.svelte';
  import { getHeadById, getHeadLedger, getOutstandingBookings } from '$lib/features/heads/api/heads-api';
  import { formatDateOnly, formatDateTime } from '$lib/formatters/date';
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    User, 
    CreditCard, 
    Mail, 
    Phone, 
    MapPin, 
    Globe, 
    Calendar,
    ChevronLeft, 
    ChevronRight,
    ArrowUpRight,
    ArrowDownRight,
    ShieldAlert,
    RefreshCw,
    AlertCircle,
    ExternalLink,
    Search,
    Filter,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    FileText,
    CalendarDays,
    RotateCcw
  } from 'lucide-svelte';

  let loading = $state(true);
  let ledgerLoading = $state(false);
  let outstandingLoading = $state(false);
  let error = $state<any>(null);
  let head = $state<any>(null);
  let ledgerData = $state<any>(null);
  let outstandingBookings = $state<any[]>([]);

  // Search, Filter & Sorting State for Outstanding Bookings
  let searchFilter = $state('');
  let serviceFilter = $state('all');
  let statusFilter = $state('all');
  let sortField = $state<'date' | 'reference' | 'selling' | 'outstanding'>('date');
  let sortDirection = $state<'asc' | 'desc'>('desc');

  // Datewise & General Filters for Transaction Ledger
  let ledgerStartDate = $state('');
  let ledgerEndDate = $state('');
  let ledgerDatePreset = $state<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'custom'>('all');
  let ledgerServiceFilter = $state('all');
  let ledgerSearch = $state('');
  let ledgerSort = $state<'asc' | 'desc'>('asc');

  let filteredOutstandingBookings = $derived.by(() => {
    let items = [...outstandingBookings];

    // 1. Search Filter (Reference Code, Description, Service Type)
    if (searchFilter.trim()) {
      const tokens = searchFilter.toLowerCase().trim().split(/\s+/).filter(Boolean);
      items = items.filter(b => 
        tokens.every(tok =>
          (b.referenceCode || '').toLowerCase().includes(tok) ||
          (b.description || '').toLowerCase().includes(tok) ||
          (b.serviceType || '').toLowerCase().includes(tok)
        )
      );
    }

    // 2. Service Module Filter
    if (serviceFilter !== 'all') {
      items = items.filter(b => (b.serviceType || '').toLowerCase() === serviceFilter.toLowerCase());
    }

    // 3. Payment Status Filter
    if (statusFilter !== 'all') {
      items = items.filter(b => {
        const s = (b.paymentStatus || '').toLowerCase();
        if (statusFilter === 'pending') return s === 'pending' || s === 'open';
        if (statusFilter === 'partially_paid') return s === 'partially_paid' || s === 'partiallypaid' || s === 'partial';
        return s === statusFilter;
      });
    }

    // 4. Sorting
    items.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'date') {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sortField === 'reference') {
        valA = a.referenceCode || '';
        valB = b.referenceCode || '';
      } else if (sortField === 'selling') {
        valA = a.totalAmount || a.payableAmount || 0;
        valB = b.totalAmount || b.payableAmount || 0;
      } else if (sortField === 'outstanding') {
        valA = a.payableAmount || 0;
        valB = b.payableAmount || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  });

  let totalSellingAmount = $derived(filteredOutstandingBookings.reduce((sum, b) => sum + (b.totalAmount || b.payableAmount || 0), 0));
  let totalOutstandingBalance = $derived(filteredOutstandingBookings.reduce((sum, b) => sum + (b.payableAmount || 0), 0));

  let isLedgerFiltered = $derived(
    ledgerDatePreset !== 'all' || 
    ledgerStartDate !== '' || 
    ledgerEndDate !== '' || 
    ledgerServiceFilter !== 'all' || 
    ledgerSearch.trim() !== '' ||
    ledgerSort !== 'asc'
  );

  let ledgerTotalDebit = $derived(ledgerData?.items ? ledgerData.items.reduce((sum: number, entry: any) => sum + (entry.debit || 0), 0) : 0);
  let ledgerTotalCredit = $derived(ledgerData?.items ? ledgerData.items.reduce((sum: number, entry: any) => sum + (entry.credit || 0), 0) : 0);
  let ledgerNetMovement = $derived(ledgerTotalCredit - ledgerTotalDebit);

  function toggleSort(field: 'date' | 'reference' | 'selling' | 'outstanding') {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
  }

  function resetFilters() {
    searchFilter = '';
    serviceFilter = 'all';
    statusFilter = 'all';
    sortField = 'date';
    sortDirection = 'desc';
  }

  function formatYmd(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function setDatePreset(preset: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month') {
    ledgerDatePreset = preset;
    const now = new Date();
    if (preset === 'all') {
      ledgerStartDate = '';
      ledgerEndDate = '';
    } else if (preset === 'today') {
      const ymd = formatYmd(now);
      ledgerStartDate = ymd;
      ledgerEndDate = ymd;
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const ymd = formatYmd(y);
      ledgerStartDate = ymd;
      ledgerEndDate = ymd;
    } else if (preset === 'this_week') {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      ledgerStartDate = formatYmd(start);
      ledgerEndDate = formatYmd(now);
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      ledgerStartDate = formatYmd(start);
      ledgerEndDate = formatYmd(now);
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      ledgerStartDate = formatYmd(start);
      ledgerEndDate = formatYmd(end);
    }
    handleLedgerFilterApply();
  }

  function handleCustomDateChange() {
    ledgerDatePreset = 'custom';
    handleLedgerFilterApply();
  }

  function handleLedgerFilterApply() {
    const currentParams = new URLSearchParams($page.url.searchParams);
    currentParams.set('ledgerPage', '1');
    goto(`?${currentParams.toString()}`, { replaceState: true, keepFocus: true });
    loadLedger();
  }

  function clearLedgerFilters() {
    ledgerStartDate = '';
    ledgerEndDate = '';
    ledgerDatePreset = 'all';
    ledgerServiceFilter = 'all';
    ledgerSearch = '';
    ledgerSort = 'asc';
    handleLedgerFilterApply();
  }

  let headId = $derived(parseInt($page.params.headId ?? '0', 10));
  let activeTab = $derived($page.url.searchParams.get('tab') || 'details');
  let urlType = $derived($page.url.searchParams.get('type') || undefined);
  // Normalize headType from URL immediately (before head loads) so the dashboard
  // gets the correct type on first render without waiting for the async head fetch.
  let normalizedHeadType = $derived.by(() => {
    const t = (urlType || head?.type || 'Customer').toLowerCase().trim();
    if (t === 'agent') return 'Agent';
    return 'Customer';
  });
  let headType = $derived(head?.type || urlType);

  let abortController: AbortController | null = null;

  const SERVICE_TYPE_MAP: Record<string, { label: string; color: string }> = {
    'Flight': { label: 'Flight Ticket', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border border-blue-300/60 dark:border-blue-700/40' },
    'flight_booking': { label: 'Flight Ticket', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border border-blue-300/60 dark:border-blue-700/40' },
    'Hotel': { label: 'Hotel Booking', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200 border border-orange-300/60 dark:border-orange-700/40' },
    'hotel_booking': { label: 'Hotel Booking', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-900 dark:text-orange-200 border border-orange-300/60 dark:border-orange-700/40' },
    'Visa': { label: 'Visa Application', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border border-purple-300/60 dark:border-purple-700/40' },
    'visa_application': { label: 'Visa Application', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 border border-purple-300/60 dark:border-purple-700/40' },
    'Vfs': { label: 'VFS Service', color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-200 border border-pink-300/60 dark:border-pink-700/40' },
    'vfs_appointment': { label: 'VFS Service', color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-900 dark:text-pink-200 border border-pink-300/60 dark:border-pink-700/40' },
    'Holiday': { label: 'Holiday Package', color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 border border-teal-300/60 dark:border-teal-700/40' },
    'holiday_package': { label: 'Holiday Package', color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200 border border-teal-300/60 dark:border-teal-700/40' },
    'Transport': { label: 'Transportation', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-300/60 dark:border-indigo-700/40' },
    'transportation': { label: 'Transportation', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 border border-indigo-300/60 dark:border-indigo-700/40' },
    'Deposit': { label: 'Deposit', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/40' },
    'deposit': { label: 'Deposit', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/40' },
    'wallet_deposit': { label: 'Deposit', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/40' },
    'Receipt': { label: 'Receipt', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/40' },
    'receipt': { label: 'Receipt', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/40' },
    'sales_return': { label: 'Sales Return', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 border border-rose-300/60 dark:border-rose-700/40' },
    'sales_refund': { label: 'Sales Return', color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-900 dark:text-rose-200 border border-rose-300/60 dark:border-rose-700/40' },
    'journal_reversal': { label: 'Journal Reversal', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/40' },
    'journal_entry': { label: 'Journal Entry', color: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700/40' },
    'Other': { label: 'Other Service', color: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-300/60 dark:border-gray-700/40' },
    'other_service': { label: 'Other Service', color: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-300/60 dark:border-gray-700/40' }
  };

  function getServiceTypeDisplay(type: string, description?: string) {
    const rawType = (type || '').trim();
    const descLower = (description || '').toLowerCase();
    
    if ((rawType.toLowerCase() === 'journal_entry' || rawType.toLowerCase() === 'journalentry') && (descLower.includes('refund') || descLower.includes('return'))) {
      return SERVICE_TYPE_MAP['sales_return'];
    }

    if (SERVICE_TYPE_MAP[rawType]) {
      return SERVICE_TYPE_MAP[rawType];
    }
    const lowerType = rawType.toLowerCase();
    if (SERVICE_TYPE_MAP[lowerType]) {
      return SERVICE_TYPE_MAP[lowerType];
    }
    const formatted = rawType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { label: formatted || 'Unknown Service', color: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-300/60 dark:border-slate-700/40' };
  }

  function getPaymentStatusBadge(status: string) {
    const s = (status || '').toLowerCase();
    if (s === 'pending' || s === 'open') {
      return { label: 'Pending', color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/40' };
    }
    if (s === 'partially_paid' || s === 'partiallypaid' || s === 'partial') {
      return { label: 'Partially Paid', color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-300/60 dark:border-blue-700/40' };
    }
    if (s === 'paid' || s === 'success' || s === 'settled') {
      return { label: 'Settled', color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-700/40' };
    }
    return { label: status || 'Pending', color: 'bg-red-100 dark:bg-red-950/40 text-red-900 dark:text-red-200 border border-red-300/60 dark:border-red-700/40' };
  }

  function formatLedgerDescription(desc: string | undefined | null) {
    if (!desc) return '—';
    return desc.replace(/\s*\((?:Credit\s+Facility|CreditFacility)\)/gi, '').trim();
  }

  function getBookingDetailUrl(row: any): string | null {
    if (!row) return null;

    let targetId: string | null = null;

    // 1. Prioritize serviceId (numeric booking or receipt primary key)
    if (row.serviceId != null && String(row.serviceId).trim() !== '' && String(row.serviceId) !== '0') {
      targetId = String(row.serviceId);
    }

    // 2. Fallback to Document Code / ID from description (e.g. "#TXSVISA750799", "#TXSFLT788386", "#TXSRCPT10023", "#15")
    if (!targetId && row.description) {
      const match = row.description.match(/#([A-Za-z0-9_-]+)/) || row.description.match(/\b(TXS[A-Za-z0-9_-]+)\b/i);
      if (match && match[1]) {
        targetId = match[1];
      }
    }

    // 3. Fallback to row.id if this is a direct booking/receipt row
    if (!targetId && row.id != null) {
      targetId = String(row.id);
    }

    const type = (row.type || '').toLowerCase();
    const desc = (row.description || '').toLowerCase();

    // Check receipts/deposits FIRST so receipts with service descriptions aren't misrouted
    const isReceiptOrDeposit =
      type === 'receipt' ||
      type === 'receipts' ||
      type === 'deposit' ||
      type === 'wallet_deposit' ||
      type === 'credit_settlement' ||
      type === 'payment' ||
      desc.startsWith('receipt') ||
      desc.includes('receipt #') ||
      desc.includes('wallet deposit') ||
      desc.includes('payment received') ||
      desc.includes('txsrcpt');

    if (isReceiptOrDeposit) {
      if (targetId) {
        return `/receipts/${targetId}`;
      }
      return `/receipts`;
    }

    if (!targetId) return null;

    if (type === 'flight' || type === 'flights' || type === 'flight_booking' || desc.includes('flight')) {
      return `/bookings/flights/${targetId}`;
    }
    if (type === 'hotel' || type === 'hotels' || type === 'hotel_booking' || desc.includes('hotel')) {
      return `/bookings/hotels/${targetId}`;
    }
    if (type === 'visa' || type === 'visas' || type === 'visa_application' || desc.includes('visa')) {
      return `/bookings/visas/${targetId}`;
    }
    if (type === 'vfs' || type === 'vfs_appointment' || desc.includes('vfs')) {
      return `/bookings/vfs/${targetId}`;
    }
    if (type === 'holiday' || type === 'holidays' || type === 'holiday_package' || desc.includes('holiday')) {
      return `/bookings/holidays/${targetId}`;
    }
    if (type === 'transport' || type === 'transportation' || desc.includes('transport')) {
      return `/bookings/transport/${targetId}`;
    }
    if (type === 'other' || type === 'otherservice' || type === 'other-services' || type === 'other_service' || desc.includes('other service')) {
      return `/bookings/other-services/${targetId}`;
    }

    return null;
  }

  let ledgerPage = $derived.by(() => {
    const p = $page.url.searchParams.get('ledgerPage');
    if (p) {
      const val = parseInt(p, 10);
      return !isNaN(val) && val >= 1 ? val : 1;
    }
    return 1;
  });

  async function loadHeadDetails() {
    if (isNaN(headId)) return;
    
    loading = true;
    error = null;
    try {
      head = await getHeadById(headId, urlType);
      if (!head) {
        error = { status: 404, detail: 'Head record was not found.' };
      }
    } catch (err: any) {
      error = err;
    } finally {
      loading = false;
    }
  }

  async function loadLedger() {
    if (isNaN(headId)) return;
    
    if (abortController) {
      abortController.abort();
    }
    const currentAbort = new AbortController();
    abortController = currentAbort;
    
    ledgerLoading = true;
    try {
      const res = await getHeadLedger(headId, { 
        page: ledgerPage, 
        pageSize: 10, 
        type: headType,
        startDate: ledgerStartDate || undefined,
        endDate: ledgerEndDate || undefined,
        serviceType: ledgerServiceFilter !== 'all' ? ledgerServiceFilter : undefined,
        search: ledgerSearch.trim() || undefined,
        sort: ledgerSort
      }, currentAbort.signal);

      if (!currentAbort.signal.aborted) {
        ledgerData = res;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to load ledger', err);
      }
    } finally {
      if (!currentAbort.signal.aborted) {
        ledgerLoading = false;
      }
    }
  }

  async function loadOutstandingBookings() {
    if (isNaN(headId)) return;
    outstandingLoading = true;
    try {
      outstandingBookings = await getOutstandingBookings(headId, headType);
    } catch (err) {
      console.error('Failed to load outstanding bookings', err);
    } finally {
      outstandingLoading = false;
    }
  }

  function handleTabChange(tab: string) {
    const currentParams = new URLSearchParams($page.url.searchParams);
    currentParams.set('tab', tab);
    if (tab !== 'ledger') {
      currentParams.delete('ledgerPage');
    }
    goto(`?${currentParams.toString()}`, { replaceState: true, keepFocus: true });
  }

  function handleLedgerPageChange(newPage: number) {
    const currentParams = new URLSearchParams($page.url.searchParams);
    currentParams.set('ledgerPage', String(newPage));
    goto(`?${currentParams.toString()}`, { keepFocus: true });
  }

  $effect(() => {
    const _ = [headId, urlType];
    loadHeadDetails();
  });

  $effect(() => {
    // Reload ledger when ledger tab is active or ledgerPage / headType changes
    if (head && activeTab === 'ledger') {
      const _ = [head.id, headType, ledgerPage];
      loadLedger();
    }
  });

  $effect(() => {
    // Load outstanding bookings when bookings tab is selected
    if (head && activeTab === 'bookings') {
      loadOutstandingBookings();
    }
  });
</script>

<div class="mb-4">
  <Button onclick={() => goto(headType === 'agent' ? '/heads?type=agent' : '/heads?type=customer')} variant="ghost" size="sm" class="gap-1.5 -ml-3 text-muted-foreground">
    <ChevronLeft class="h-4 w-4" />
    <span>Back to list</span>
  </Button>
</div>

{#if error}
  <Alert.Root variant="destructive">
    <ShieldAlert class="h-5 w-5" />
    <Alert.Title>
      {#if error.status === 404}
        Customer Not Found
      {:else}
        Failed to load customer profile
      {/if}
    </Alert.Title>
    <Alert.Description class="mt-2 text-sm">
      {error.detail || error.message || 'An unexpected connection error occurred.'}
    </Alert.Description>
  </Alert.Root>

{:else if loading}
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Skeleton class="h-10 w-48" />
      <Skeleton class="h-6 w-20" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-32 w-full" />
    </div>
    <Skeleton class="h-64 w-full" />
  </div>

{:else if head}
  <div class="space-y-6">
    <!-- Profile Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
      <div class="space-y-1">
        <h1 class="text-2xl font-bold tracking-tight text-foreground">{head.firstName || ''} {head.lastName || ''}</h1>
        <div class="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
          <span class="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {head.type}
          </span>
          <span class="h-4 w-[1px] bg-border hidden sm:inline"></span>
          <div class="flex items-center gap-1">
            <Globe class="h-3.5 w-3.5" />
            <span>{head.nationality}</span>
          </div>
          <span class="h-4 w-[1px] bg-border hidden sm:inline"></span>
          <div class="flex items-center gap-1">
            <Calendar class="h-3.5 w-3.5" />
            <span>Registered {formatDateOnly(head.createdAt)}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <StatusBadge status={head.status} />
      </div>
    </div>

    <!-- Financial Account Dashboard -->
    <CustomerAccountDashboard {headId} headType={normalizedHeadType} />

    <!-- Navigation Tabs -->
    <div class="border-b border-border">
      <nav class="flex gap-6 -mb-[1px]">
        <button
          onclick={() => handleTabChange('details')}
          class="pb-3 text-sm font-medium transition-colors border-b-2 focus:outline-none {activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
        >
          Customer Profile
        </button>
        <button
          onclick={() => handleTabChange('ledger')}
          class="pb-3 text-sm font-medium transition-colors border-b-2 focus:outline-none {activeTab === 'ledger' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}"
        >
          Transaction Ledger
        </button>
      </nav>
    </div>

    <!-- Tab Contents -->
    {#if activeTab === 'details'}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card class="md:col-span-2">
          <CardHeader>
            <CardTitle class="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="space-y-1">
                <span class="text-xs text-muted-foreground">Mobile Phone</span>
                <div class="flex items-center gap-2 font-medium">
                  <Phone class="h-4 w-4 text-muted-foreground" />
                  <span>{head.mobileNo}</span>
                </div>
              </div>
              <div class="space-y-1">
                <span class="text-xs text-muted-foreground">Email Address</span>
                <div class="flex items-center gap-2 font-medium">
                  <Mail class="h-4 w-4 text-muted-foreground" />
                  <span class="select-all">{head.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">Physical Location</CardTitle>
          </CardHeader>
          <CardContent class="text-sm space-y-3">
            <div class="flex items-start gap-2">
              <MapPin class="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span class="leading-relaxed">{head.address || 'No address registered.'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

    {:else if activeTab === 'ledger'}
      <div class="space-y-4">
        <!-- Header & Quick Totals Banner -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-semibold text-foreground">Transaction Ledger</h3>
            <p class="text-xs text-muted-foreground">Historical debit and credit transaction history for this {headType === 'agent' ? 'agent' : 'customer'} head.</p>
          </div>

          {#if ledgerData && ledgerData.items && ledgerData.items.length > 0}
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-xs">
                <span class="text-muted-foreground">Page Debits:</span>
                <span class="font-mono font-semibold text-destructive">
                  <MoneyDisplay amount={ledgerTotalDebit} currency="BHD" />
                </span>
              </div>
              <div class="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-xs">
                <span class="text-muted-foreground">Page Credits:</span>
                <span class="font-mono font-semibold text-green-600 dark:text-green-400">
                  <MoneyDisplay amount={ledgerTotalCredit} currency="BHD" />
                </span>
              </div>
            </div>
          {/if}
        </div>

        <!-- Filter Toolbar Card -->
        <Card class="bg-card border border-border shadow-sm">
          <CardContent class="p-4 space-y-3">
            <!-- Row 1: Quick Date Presets -->
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
                  <CalendarDays class="h-3.5 w-3.5" />
                  <span>Period:</span>
                </span>
                <button
                  type="button"
                  onclick={() => setDatePreset('all')}
                  class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {ledgerDatePreset === 'all' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
                >
                  All Time
                </button>
                <button
                  type="button"
                  onclick={() => setDatePreset('today')}
                  class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {ledgerDatePreset === 'today' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
                >
                  Today
                </button>
                <button
                  type="button"
                  onclick={() => setDatePreset('yesterday')}
                  class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {ledgerDatePreset === 'yesterday' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
                >
                  Yesterday
                </button>
                <button
                  type="button"
                  onclick={() => setDatePreset('this_week')}
                  class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {ledgerDatePreset === 'this_week' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onclick={() => setDatePreset('this_month')}
                  class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {ledgerDatePreset === 'this_month' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onclick={() => setDatePreset('last_month')}
                  class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {ledgerDatePreset === 'last_month' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
                >
                  Last Month
                </button>
              </div>

              {#if isLedgerFiltered}
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={clearLedgerFilters}
                  class="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <RotateCcw class="h-3 w-3" />
                  <span>Clear Filters</span>
                </Button>
              {/if}
            </div>

            <!-- Row 2: Date Pickers, Service Filter, Sort & Search -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1">
              <!-- From Date -->
              <div class="space-y-1">
                <label for="ledger-start-date" class="text-[11px] font-medium text-muted-foreground">From Date</label>
                <div class="relative">
                  <input
                    id="ledger-start-date"
                    type="date"
                    bind:value={ledgerStartDate}
                    onchange={handleCustomDateChange}
                    class="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <!-- To Date -->
              <div class="space-y-1">
                <label for="ledger-end-date" class="text-[11px] font-medium text-muted-foreground">To Date</label>
                <div class="relative">
                  <input
                    id="ledger-end-date"
                    type="date"
                    bind:value={ledgerEndDate}
                    onchange={handleCustomDateChange}
                    class="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <!-- Service Type Filter -->
              <div class="space-y-1">
                <label for="ledger-service-filter" class="text-[11px] font-medium text-muted-foreground">Service Type</label>
                <select
                  id="ledger-service-filter"
                  bind:value={ledgerServiceFilter}
                  onchange={handleLedgerFilterApply}
                  class="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="all">All Services</option>
                  <option value="flight">Flight Ticket</option>
                  <option value="hotel">Hotel Booking</option>
                  <option value="visa">Visa Application</option>
                  <option value="vfs">VFS Service</option>
                  <option value="holiday">Holiday Package</option>
                  <option value="transport">Transportation</option>
                  <option value="other">Other Service</option>
                  <option value="receipt">Receipt / Deposit</option>
                  <option value="sales_return">Sales Return</option>
                </select>
              </div>

              <!-- Sort Order Filter -->
              <div class="space-y-1">
                <label for="ledger-sort-order" class="text-[11px] font-medium text-muted-foreground">Sort By</label>
                <select
                  id="ledger-sort-order"
                  bind:value={ledgerSort}
                  onchange={handleLedgerFilterApply}
                  class="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                >
                  <option value="asc">Oldest First</option>
                  <option value="desc">Newest First</option>
                </select>
              </div>

              <!-- Search Box -->
              <div class="space-y-1">
                <label for="ledger-search-box" class="text-[11px] font-medium text-muted-foreground">Search</label>
                <div class="relative">
                  <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    id="ledger-search-box"
                    type="text"
                    placeholder="Ref #, description, mode..."
                    bind:value={ledgerSearch}
                    onkeydown={(e) => { if (e.key === 'Enter') handleLedgerFilterApply(); }}
                    class="pl-8 text-xs h-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Ledger Table & Content -->
        {#if ledgerLoading && (!ledgerData || ledgerData.items.length === 0)}
          <div class="space-y-4">
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
            <Skeleton class="h-10 w-full" />
          </div>
        {:else if !ledgerData || ledgerData.items.length === 0}
          <Card class="border-dashed">
            <CardContent class="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <CreditCard class="h-10 w-10 mb-3 text-muted-foreground/40" />
              <h3 class="font-semibold text-foreground">No ledger transactions</h3>
              <p class="text-xs mt-1">
                {#if isLedgerFiltered}
                  No transactions found matching your date and filter criteria.
                {:else}
                  This {headType === 'agent' ? 'agent' : 'customer'} head does not have any ledger logs registered.
                {/if}
              </p>
              {#if isLedgerFiltered}
                <Button
                  variant="outline"
                  size="sm"
                  onclick={clearLedgerFilters}
                  class="mt-4 gap-1.5 text-xs"
                >
                  <RotateCcw class="h-3.5 w-3.5" />
                  <span>Reset Filters</span>
                </Button>
              {/if}
            </CardContent>
          </Card>
        {:else}
          <Card class="overflow-hidden border border-border">
            <div class="overflow-x-auto relative">
              {#if ledgerLoading}
                <div class="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <RefreshCw class="h-6 w-6 animate-spin text-primary" />
                </div>
              {/if}
              <table class="w-full text-left border-collapse text-sm">
                <thead>
                  <tr class="bg-muted/40 border-b border-border font-medium text-muted-foreground">
                    <th class="px-6 py-4">Transaction Date</th>
                    <th class="px-6 py-4">Service Type</th>
                    <th class="px-6 py-4">Description</th>
                    <th class="px-6 py-4 text-right">Debit</th>
                    <th class="px-6 py-4 text-right">Credit</th>
                    <th class="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  {#each ledgerData.items as entry, idx (`${entry.type}_${entry.id}_${idx}`)}
                    {@const detailUrl = getBookingDetailUrl(entry)}
                    <tr class="hover:bg-muted/20">
                      <td class="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {formatDateTime(entry.createdAt)}
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {getServiceTypeDisplay(entry.type, entry.description).color}">
                          {getServiceTypeDisplay(entry.type, entry.description).label}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-foreground text-xs">
                        {#if detailUrl}
                          <a
                            href={detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary hover:underline transition-colors group"
                          >
                            <span>{formatLedgerDescription(entry.description)}</span>
                            <ExternalLink class="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </a>
                        {:else}
                          <span>{formatLedgerDescription(entry.description)}</span>
                        {/if}
                      </td>
                      <td class="px-6 py-4 text-right font-mono text-destructive">
                        {#if entry.debit > 0}
                          <div class="flex items-center gap-1 justify-end">
                            <ArrowUpRight class="h-3 w-3 text-destructive" />
                            <MoneyDisplay amount={entry.debit} currency="BHD" />
                          </div>
                        {:else}
                          —
                        {/if}
                      </td>
                      <td class="px-6 py-4 text-right font-mono text-green-600 dark:text-green-400">
                        {#if entry.credit > 0}
                          <div class="flex items-center gap-1 justify-end">
                            <ArrowDownRight class="h-3 w-3 text-green-600" />
                            <MoneyDisplay amount={entry.credit} currency="BHD" />
                          </div>
                        {:else}
                          —
                        {/if}
                      </td>
                      <td class="px-6 py-4 text-center">
                        {#if detailUrl}
                          <a
                            href={detailUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-primary/30 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Open details in new tab"
                          >
                            <span>View</span>
                            <ExternalLink class="h-3 w-3" />
                          </a>
                        {:else}
                          <span class="text-muted-foreground/40 font-normal">—</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <!-- Ledger Pagination Footer -->
            <div class="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 text-xs">
              <span class="text-muted-foreground">
                Page <strong>{ledgerPage}</strong> of <strong>{ledgerData.totalPages}</strong> ({ledgerData.totalCount} entries)
              </span>
              <div class="flex items-center gap-1">
                <Button
                  onclick={() => handleLedgerPageChange(ledgerPage - 1)}
                  disabled={ledgerPage <= 1 || ledgerLoading}
                  variant="outline"
                  size="sm"
                  class="gap-1 h-8"
                >
                  <ChevronLeft class="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
                <Button
                  onclick={() => handleLedgerPageChange(ledgerPage + 1)}
                  disabled={ledgerPage >= ledgerData.totalPages || ledgerLoading}
                  variant="outline"
                  size="sm"
                  class="gap-1 h-8"
                >
                  <span>Next</span>
                  <ChevronRight class="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        {/if}
      </div>
    {/if}
  </div>
{/if}
