<script lang="ts">
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { getDashboardSummary, getDashboardTrend, type DashboardTrendPoint } from '$lib/features/dashboard/api/dashboard-api';
  import { getProfitSummary, type SalesmanProfitSummary } from '$lib/features/profit/api/profit-api';
  import { getLeads } from '$lib/features/leads/api/leads-api';
  import { formatDateOnly } from '$lib/formatters/date';
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { Button } from '$lib/components/ui/button';
  import { 
    ShieldAlert, 
    RefreshCw, 
    TrendingUp, 
    DollarSign, 
    Users, 
    Sparkles,
    Activity,
    CreditCard,
    FileText,
    Clock,
    Bell,
    Calendar,
    ArrowRight,
    ExternalLink,
    X,
    Phone,
    User
  } from 'lucide-svelte';

  let loading = $state(true);
  let error = $state<any>(null);
  let summary = $state<any>(null);
  let profitSummary = $state<SalesmanProfitSummary | null>(null);
  let trendPoints = $state<DashboardTrendPoint[]>([]);
  let dueLeads = $state<any[]>([]);
  let showReminderModal = $state(false);
  let hasAutoPrompted = $state(false);

  let abortController: AbortController | null = null;

  async function loadDashboard() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading = true;
    error = null;
    try {
      const [summaryResult, profitSummaryResult, trendResult, leadsResult] = await Promise.all([
        getDashboardSummary(abortController.signal),
        getProfitSummary().catch(() => null),
        getDashboardTrend(abortController.signal).catch(() => ({ points: [] })),
        getLeads({ pageSize: 100 }, abortController.signal).catch(() => ({ items: [], totalCount: 0 }))
      ]);
      summary = summaryResult;
      profitSummary = profitSummaryResult;
      trendPoints = trendResult.points ?? [];

      if (leadsResult && leadsResult.items) {
        const today = new Date();
        dueLeads = leadsResult.items.filter((l: any) => {
          if (!l.reminderDate) return false;
          const d = new Date(l.reminderDate);
          if (isNaN(d.getTime())) return false;
          const remDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return remDate <= todayDate;
        });

        if (dueLeads.length > 0 && !hasAutoPrompted) {
          showReminderModal = true;
          hasAutoPrompted = true;
        }
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

  $effect(() => {
    loadDashboard();
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  });

  function formatServicesDisplay(servicesJson: string | null) {
    try {
      const arr = JSON.parse(servicesJson || '[]');
      return arr.join(', ') || 'None';
    } catch {
      return servicesJson || 'None';
    }
  }

  // Derives service distribution metrics safely
  const distribution = $derived.by(() => {
    if (!summary) return [];
    
    const services = [
      { key: 'Flights', count: summary.totalFlightBookings || 0, label: 'Flight Tickets', color: 'bg-blue-500' },
      { key: 'Hotels', count: summary.totalHotelBookings || 0, label: 'Hotel Bookings', color: 'bg-orange-500' },
      { key: 'Visas', count: summary.totalVisaApplications || 0, label: 'Visa Services', color: 'bg-purple-500' },
      { key: 'Vfs', count: summary.totalVfsAppointments || 0, label: 'VFS Appointments', color: 'bg-pink-500' },
      { key: 'Holidays', count: summary.totalHolidayPackages || 0, label: 'Holiday Packages', color: 'bg-teal-500' },
      { key: 'Transport', count: summary.totalTransportations || 0, label: 'Transportation', color: 'bg-indigo-500' },
      { key: 'Other', count: summary.totalOtherServices || 0, label: 'Other Services', color: 'bg-slate-500' }
    ];

    const total = services.reduce((sum, item) => sum + item.count, 0);

    return services.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);
  });

  const totalBookingsCount = $derived(
    summary 
      ? (summary.totalFlightBookings + 
         summary.totalHotelBookings + 
         summary.totalVisaApplications + 
         summary.totalVfsAppointments + 
         summary.totalHolidayPackages + 
         summary.totalTransportations + 
         summary.totalOtherServices) 
      : 0
  );

  // Chart derived helpers
  const trendMax = $derived(
    trendPoints.length > 0 ? Math.max(...trendPoints.map(p => p.totalValue), 1) : 1
  );

  const trendTotal = $derived(trendPoints.reduce((s, p) => s + p.totalValue, 0));

  let hoveredIndex = $state<number | null>(null);
</script>

<PageHeader title="Dashboard" description="Overview of your sales aggregates, reminders, and booking totals.">
  <div class="flex items-center gap-2">
    {#if dueLeads.length > 0}
      <Button onclick={() => showReminderModal = true} variant="outline" size="sm" class="gap-1.5 border-red-500/40 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400">
        <Bell class="h-4 w-4 animate-bounce text-red-500" />
        <span>Due Reminders ({dueLeads.length})</span>
      </Button>
    {/if}
    <Button onclick={loadDashboard} variant="outline" size="sm" class="gap-2">
      <RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
      <span>Reload Metrics</span>
    </Button>
  </div>
</PageHeader>

{#if error}
  <div class="space-y-6">
    <Alert.Root variant="destructive">
      <ShieldAlert class="h-5 w-5" />
      <Alert.Title>Dashboard Loading Failed</Alert.Title>
      <Alert.Description class="mt-2 text-sm">
        {error.detail || error.message || 'An unexpected connection failure occurred.'}
      </Alert.Description>
    </Alert.Root>
    <Button onclick={loadDashboard} variant="default" class="w-fit">
      <span>Retry Fetch</span>
    </Button>
  </div>

{:else if loading}
  <!-- Skeletons representing cards grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {#each Array(6) as _}
      <Card>
        <CardHeader class="pb-2">
          <Skeleton class="h-4 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton class="h-8 w-16 mb-1" />
          <Skeleton class="h-3 w-36" />
        </CardContent>
      </Card>
    {/each}
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <Card class="lg:col-span-2">
      <CardHeader><Skeleton class="h-5 w-40" /></CardHeader>
      <CardContent><Skeleton class="h-48 w-full" /></CardContent>
    </Card>
    <Card>
      <CardHeader><Skeleton class="h-5 w-40" /></CardHeader>
      <CardContent><Skeleton class="h-48 w-full" /></CardContent>
    </Card>
  </div>

{:else if summary}
  <!-- Stat Cards Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    <!-- Total Sales -->
    <Card class="border-l-4 border-l-primary bg-card">
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Sales</span>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="text-2xl font-bold mt-2 text-foreground font-mono">
          <MoneyDisplay amount={summary.totalPayableAmount} currency="BHD" />
        </div>
        <p class="text-[10px] text-muted-foreground mt-1.5 flex justify-between">
          <span>Paid: <strong class="text-green-600 font-mono">{summary.totalPaidAmount || 0} BHD</strong></span>
          <span>Pending: <strong class="text-destructive font-mono">{summary.totalPendingAmount || 0} BHD</strong></span>
        </p>
      </CardContent>
    </Card>

    <!-- Total Profit -->
    <Card class="border-l-4 border-l-green-600 bg-card">
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Profit</span>
          <TrendingUp class="h-4 w-4 text-green-600" />
        </div>
        <div class="text-2xl font-bold mt-2 text-green-600 dark:text-green-400 font-mono">
          <MoneyDisplay amount={summary.totalProfit} currency="BHD" />
        </div>
        {#if profitSummary}
          <p class="text-[10px] text-muted-foreground mt-1.5 flex justify-between">
            <span>Settled: <strong class="text-emerald-600 font-mono">{profitSummary.approvedProfit} BHD</strong></span>
            <span>Estimated: <strong class="text-amber-600 font-mono">{profitSummary.estimatedProfit} BHD</strong></span>
          </p>
        {:else}
          <p class="text-[10px] text-muted-foreground mt-1.5">Authoritative net profit ledger</p>
        {/if}
      </CardContent>
    </Card>

    <!-- Credit to Collect -->
    <Card class="border-l-4 border-l-amber-500 bg-card">
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credit to Collect</span>
          <CreditCard class="h-4 w-4 text-amber-500" />
        </div>
        <div class="text-2xl font-bold mt-2 text-foreground font-mono">
          <MoneyDisplay amount={summary.totalReceivables} currency="BHD" />
        </div>
        <p class="text-[10px] text-muted-foreground mt-1.5">Sum of negative balances (heads & agents)</p>
      </CardContent>
    </Card>

    <!-- Due Lead Reminders Widget -->
    <Card class="border-l-4 {dueLeads.length > 0 ? 'border-l-red-500 bg-red-500/5' : 'border-l-amber-500 bg-card'}">
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Lead Reminders</span>
          <div class="relative">
            <Bell class="h-4 w-4 {dueLeads.length > 0 ? 'text-red-500 animate-bounce' : 'text-amber-500'}" />
            {#if dueLeads.length > 0}
              <span class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
            {/if}
          </div>
        </div>
        <div class="text-2xl font-bold mt-2 text-foreground font-mono flex items-center gap-2">
          <span>{dueLeads.length}</span>
          {#if dueLeads.length > 0}
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-300/50">
              Needs Follow-up
            </span>
          {/if}
        </div>
        <div class="mt-2 flex items-center justify-between">
          <p class="text-[10px] text-muted-foreground">Follow-ups due today or past due</p>
          <Button onclick={() => showReminderModal = true} variant="outline" size="sm" class="h-7 text-xs px-2.5 gap-1 border-primary/30 hover:bg-primary/10 text-primary">
            <span>Check Pop-up</span>
            <ExternalLink class="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Pending Receipts -->
    <Card class="border-l-4 border-l-purple-500 bg-card">
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending Receipts</span>
          <FileText class="h-4 w-4 text-purple-500" />
        </div>
        <div class="text-2xl font-bold mt-2 text-foreground font-mono">
          {summary.pendingReceipts || 0}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1.5">Receipts awaiting accountant approval</p>
      </CardContent>
    </Card>

    <!-- Customer Heads -->
    <Card class="border-l-4 border-l-blue-500 bg-card">
      <CardContent class="pt-6">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accounts Summary</span>
          <Users class="h-4 w-4 text-blue-500" />
        </div>
        <div class="text-2xl font-bold mt-2 text-foreground font-mono">
          {summary.totalHeads}
        </div>
        <p class="text-[10px] text-muted-foreground mt-1.5 flex gap-2 items-center">
          <Sparkles class="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Active Leads: <strong>{summary.activeLeads}</strong></span>
        </p>
      </CardContent>
    </Card>
  </div>

  <!-- Operational Visualizations Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- 7-Day Sales Trend -->
    <Card class="lg:col-span-2">
      <CardHeader>
        <CardTitle class="text-base flex items-center gap-2">
          <Activity class="h-4 w-4 text-primary" />
          <span>7-Day Sales Trend</span>
        </CardTitle>
        <CardDescription class="flex items-center justify-between">
          <span>Daily bookings value trend over the last 7 days.</span>
          {#if trendTotal > 0}
            <span class="text-xs font-semibold text-foreground font-mono">
              {trendTotal.toFixed(3)} BHD total
            </span>
          {/if}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {#if trendPoints.length === 0}
          <div class="h-44 w-full bg-muted/10 border border-dashed border-border rounded flex flex-col items-center justify-center text-center gap-2">
            <TrendingUp class="h-7 w-7 text-muted-foreground/30" />
            <p class="text-sm text-muted-foreground">No bookings in the last 7 days.</p>
          </div>
        {:else}
          <!-- Bar chart -->
          <div class="relative h-44 flex items-end gap-2 px-1">
            {#each trendPoints as point, i}
              {@const barPct = trendMax > 0 ? (point.totalValue / trendMax) * 100 : 0}
              <div
                class="relative flex-1 flex flex-col items-center gap-1 group"
                role="img"
                aria-label="{point.label}: {point.totalValue.toFixed(3)} BHD"
                onmouseenter={() => hoveredIndex = i}
                onmouseleave={() => hoveredIndex = null}
              >
                <!-- Tooltip -->
                {#if hoveredIndex === i}
                  <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-popover border border-border rounded-md shadow-lg px-2.5 py-1.5 text-xs whitespace-nowrap pointer-events-none">
                    <p class="font-semibold text-foreground">{point.label}</p>
                    <p class="text-primary font-mono">{point.totalValue.toFixed(3)} BHD</p>
                    <p class="text-muted-foreground">{point.bookingCount} booking{point.bookingCount !== 1 ? 's' : ''}</p>
                  </div>
                {/if}

                <!-- Bar -->
                <div class="w-full flex flex-col justify-end" style="height: 140px;">
                  <div
                    class="w-full rounded-t transition-all duration-200 {hoveredIndex === i ? 'bg-primary' : 'bg-primary/60'} {barPct === 0 ? 'opacity-0' : ''}"
                    style="height: {Math.max(barPct, barPct > 0 ? 4 : 0)}%;"
                  ></div>
                  {#if barPct === 0}
                    <div class="w-full h-[2px] bg-border rounded"></div>
                  {/if}
                </div>

                <!-- Label -->
                <span class="text-[10px] text-muted-foreground font-medium">{point.label}</span>
              </div>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- Service Distribution Widget -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Service Distribution</CardTitle>
        <CardDescription>Breakdown across booking types ({totalBookingsCount} total).</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        {#if totalBookingsCount === 0}
          <div class="text-center py-8 text-xs text-muted-foreground">No bookings recorded.</div>
        {:else}
          <div class="space-y-3.5">
            {#each distribution as item}
              {#if item.count > 0}
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-xs font-medium text-foreground">
                    <span>{item.label}</span>
                    <span class="text-muted-foreground font-mono">{item.count} ({item.percentage}%)</span>
                  </div>
                  <div class="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div class="h-full {item.color} rounded-full" style="width: {item.percentage}%"></div>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  </div>
{/if}

<!-- REMINDER DUE LEADS POPUP MODAL -->
{#if showReminderModal}
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-border flex items-center justify-between bg-red-500/10 dark:bg-red-950/20">
        <div class="flex items-center gap-2.5">
          <div class="h-9 w-9 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <Bell class="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <h3 class="font-bold text-base text-foreground flex items-center gap-2">
              <span>Reminder Due Leads</span>
              <span class="bg-red-600 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                {dueLeads.length} {dueLeads.length === 1 ? 'Lead' : 'Leads'}
              </span>
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">Follow-up reminders scheduled for today or pending review.</p>
          </div>
        </div>
        <button onclick={() => showReminderModal = false} class="text-muted-foreground hover:text-foreground text-sm font-semibold p-1 rounded-md hover:bg-muted" aria-label="Close">✕</button>
      </div>

      <!-- Modal Body (Due Leads List) -->
      <div class="p-6 space-y-3.5 max-h-[60vh] overflow-y-auto divide-y divide-border">
        {#if dueLeads.length === 0}
          <div class="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Sparkles class="h-8 w-8 text-muted-foreground/40" />
            <p class="text-xs font-medium">No pending lead reminders due today!</p>
          </div>
        {:else}
          {#each dueLeads as lead (lead.id)}
            <div class="pt-3.5 first:pt-0 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-sm font-bold text-foreground flex items-center gap-2">
                    <User class="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{lead.name}</span>
                  </h4>
                  <div class="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span class="flex items-center gap-1 font-mono">
                      <Phone class="h-3 w-3" />
                      <span>{lead.countryCode} {lead.mobileNo}</span>
                    </span>
                    {#if lead.leadSource}
                      <span class="bg-muted px-2 py-0.5 rounded text-[10px] font-semibold text-foreground">
                        Source: {lead.leadSource}
                      </span>
                    {/if}
                  </div>
                </div>

                <div class="flex flex-col items-end gap-1 shrink-0">
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-600 text-white animate-pulse shadow-2xs">
                    <Calendar class="h-3 w-3" />
                    <span>{formatDateOnly(lead.reminderDate)}</span>
                  </span>
                  <StatusBadge status={lead.status} />
                </div>
              </div>

              <div class="text-xs text-muted-foreground font-medium flex items-center gap-1">
                <span>Services:</span>
                <span class="text-foreground font-semibold">{formatServicesDisplay(lead.services)}</span>
              </div>

              {#if lead.description}
                <p class="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded border border-border/50 italic">
                  "{lead.description}"
                </p>
              {/if}
            </div>
          {/each}
        {/if}
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between">
        <span class="text-xs text-muted-foreground">
          Showing <strong>{dueLeads.length}</strong> active reminder{dueLeads.length !== 1 ? 's' : ''}
        </span>
        <div class="flex items-center gap-3">
          <Button variant="outline" size="sm" onclick={() => showReminderModal = false}>Dismiss</Button>
          <Button onclick={() => { showReminderModal = false; goto('/leads'); }} class="bg-green-600 hover:bg-green-700 text-white gap-1.5" size="sm">
            <span>View All in Leads Page</span>
            <ArrowRight class="h-4 w-4" />
          </Button>
        </div>
      </div>

    </div>
  </div>
{/if}
