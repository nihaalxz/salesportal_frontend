<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { formatDateOnly } from '$lib/formatters/date';
  import { getFlightBookingById, type FlightBookingDetail } from '$lib/features/flights/api/flights-api';
  import { getSuppliers, getBanks, type SupplierResponse, type BankResponse } from '$lib/features/receipts/api/receipts-api';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { 
    ChevronLeft, 
    Calendar, 
    DollarSign, 
    Building, 
    Info,
    AlertCircle,
    Users,
    Download,
    Eye,
    Printer,
    RotateCcw
  } from 'lucide-svelte';
  import { getFileUrl } from '$lib/api/client';
  import { printInvoice } from '$lib/utils/print-invoice';

  const bookingId = $derived(page.params.id);

  const salesReturnAmt = $derived((booking as any)?.salesReturnAmount ?? 0);
  const purchaseReturnAmt = $derived((booking as any)?.purchaseReturnAmount ?? 0);
  const netSellingPrice = $derived(Math.max(0, (booking?.payableAmount ?? 0) - salesReturnAmt));
  const totalExpectedSupplierCost = $derived(
    booking?.passengers?.reduce((acc, p) => acc + (p.expectedSupplierCost ?? 0), 0) ?? booking?.expectedSupplierCost ?? 0
  );
  const netSupplierCost = $derived(Math.max(0, totalExpectedSupplierCost - purchaseReturnAmt));
  const totalProfit = $derived(netSellingPrice - netSupplierCost);
  const isAllInhouse = $derived(
    booking
      ? Boolean(
          (booking as any).isInhouse !== false &&
            !(booking as any).supplierId &&
            !(booking as any).supplierName &&
            ((booking as any).expectedSupplierCost ?? 0) <= 0 &&
            (booking.passengers?.length
              ? booking.passengers.every(
                  (p) =>
                    p.isInhouse &&
                    !p.supplierId &&
                    !(p as any).supplierName &&
                    (p.expectedSupplierCost ?? 0) <= 0
                )
              : true)
        )
      : true
  );

  let loading = $state(true);
  let error = $state<any>(null);
  let booking = $state<FlightBookingDetail | null>(null);
  let suppliers = $state<SupplierResponse[]>([]);
  let banks = $state<BankResponse[]>([]);

  let abortController: AbortController | null = null;

  async function loadDetails() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading = true;
    error = null;

    try {
      booking = await getFlightBookingById(bookingId, abortController.signal);
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
    loadDetails();
    getSuppliers().then(data => {
      suppliers = data;
    }).catch(console.error);
    getBanks().then(data => {
      banks = data;
    }).catch(console.error);

    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  });

  function getSupplierName(supplierId: number | null | undefined, fallbackName: string | null | undefined) {
    if (!supplierId) return fallbackName || '';
    const found = suppliers.find(s => s.id === supplierId);
    return found ? found.name : (fallbackName || `Supplier ${supplierId}`);
  }

  function getBankName(bankId: number | null | undefined, bankName: string | null | undefined) {
    if (bankName) return bankName;
    if (!bankId) return '';
    const found = banks.find(b => b.id === bankId);
    return found ? (found.bankName || (found as any).name) : `Bank #${bankId}`;
  }
</script>

<PageHeader title={booking ? `Flight Booking ${booking.documentNumber}` : 'Flight Booking Details'} description="Review flight itinerary, passenger manifest, and financial status.">
  <Button onclick={() => goto('/bookings/flights')} variant="outline" size="sm" class="gap-1.5">
    <ChevronLeft class="h-4 w-4" />
    <span>Back to List</span>
  </Button>
</PageHeader>



{#if error}
  <div class="space-y-6 w-full">
    <Alert.Root variant="destructive">
      <AlertCircle class="h-5 w-5" />
      <Alert.Title>Booking Load Failed</Alert.Title>
      <Alert.Description class="mt-2 text-sm">
        {error.status === 404 
          ? 'The requested flight booking was not found or access is unauthorized.' 
          : (error.detail || error.message || 'An unexpected database/network connection failure occurred.')}
      </Alert.Description>
    </Alert.Root>
    <Button onclick={() => goto('/bookings/flights')} variant="default">
      Return to List
    </Button>
  </div>

{:else if loading}
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
    <div class="md:col-span-2 space-y-6">
      <Card><CardContent class="pt-6"><Skeleton class="h-40 w-full" /></CardContent></Card>
      <Card><CardContent class="pt-6"><Skeleton class="h-28 w-full" /></CardContent></Card>
    </div>
    <div class="space-y-6">
      <Card><CardContent class="pt-6"><Skeleton class="h-36 w-full" /></CardContent></Card>
    </div>
  </div>

{:else if booking}
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
    <!-- Main booking info (Col span 2) -->
    <div class="lg:col-span-2 space-y-6">
      
      <!-- Primary Details Card -->
      <Card class="bg-card">
        <CardHeader class="pb-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle class="text-lg">Route & Client Information</CardTitle>
              <CardDescription>Sector route and customer connection details.</CardDescription>
            </div>
            <div class="flex gap-2 items-center flex-wrap">
              {#if booking.toLocation?.includes('Round Trip') || booking.toLocation?.includes('⇄')}
                <span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  Round Trip
                </span>
              {:else if booking.toLocation?.includes('Connecting')}
                <span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Connecting Flight
                </span>
              {:else}
                <span class="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  One Way
                </span>
              {/if}
              {#if (booking as any).hasSalesReturn || booking.paymentStatus?.toLowerCase().includes('return') || booking.processingStatus?.toLowerCase().includes('return')}
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50 shadow-sm animate-pulse">
                  <RotateCcw class="h-3.5 w-3.5" />
                  <span>Sales Return Performed</span>
                </span>
              {/if}
              <StatusBadge status={booking.paymentStatus} />
              <StatusBadge status={booking.processingStatus} />
            </div>
          </div>
        </CardHeader>
        <CardContent class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div>
            <span class="text-xs text-muted-foreground block mb-0.5">From Location</span>
            <span class="font-medium text-foreground">{booking.fromLocation || '-'}</span>
          </div>

          <div>
            <span class="text-xs text-muted-foreground block mb-0.5">To Location</span>
            <span class="font-medium text-foreground">{booking.toLocation || '-'}</span>
          </div>

          <div>
            <span class="text-xs text-muted-foreground block mb-0.5">Travel Date</span>
            <span class="font-medium text-foreground font-mono">{formatDateOnly(booking.travelDate)}</span>
          </div>

          <div>
            <span class="text-xs text-muted-foreground block mb-0.5">Airline Company</span>
            <span class="font-medium text-foreground">{booking.airlineCompany || '-'}</span>
          </div>

          {#if booking.ticketPnr}
            <div>
              <span class="text-xs text-muted-foreground block mb-0.5">Ticket PNR Number</span>
              <span class="font-medium font-mono text-foreground bg-muted/30 px-2 py-0.5 rounded text-xs border border-border/50 inline-block">{booking.ticketPnr}</span>
            </div>
          {/if}

          <div>
            <span class="text-xs text-muted-foreground block mb-0.5">Client Type</span>
            <span class="font-medium text-foreground capitalize">{booking.clientType || 'customer'}</span>
          </div>

          {#if booking.clientType === 'agent'}
            <div>
              <span class="text-xs text-muted-foreground block mb-0.5">Agent Details</span>
              <span class="font-medium text-foreground">{booking.agent || '-'} (ID: {booking.agentId})</span>
            </div>
          {:else}
            <div>
              <span class="text-xs text-muted-foreground block mb-0.5">Customer Head</span>
              <span class="font-medium text-foreground">{booking.headName || '-'}</span>
            </div>
          {/if}

          {#if booking.careOf}
            <div>
              <span class="text-xs text-muted-foreground block mb-0.5">Care Of</span>
              <span class="font-medium text-foreground">{booking.careOf}</span>
            </div>
          {/if}

          {#if (booking as any)?.supplierName || (booking as any)?.supplierId || booking.supplier}
            <div>
              <span class="text-xs text-muted-foreground block mb-0.5">Supplier Details</span>
              <span class="font-medium text-foreground">
                {(booking as any)?.supplierName || booking.supplier || `Supplier #${(booking as any)?.supplierId}`}
                {#if (booking as any)?.supplierId}
                  <span class="text-xs text-muted-foreground font-mono"> (ID: {(booking as any)?.supplierId})</span>
                {/if}
              </span>
            </div>
          {/if}
        </CardContent>
      </Card>
      
      {#if booking.paymentProof}
        <Card class="bg-card">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">Uploaded Attachments</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4 text-sm">
            <div class="flex items-center justify-between bg-muted/20 p-3 rounded">
              <div>
                <span class="font-medium text-foreground block">Payment Proof</span>
                <span class="text-xs text-muted-foreground">Uploaded payment proof document</span>
              </div>
              <div class="flex gap-2">
                <Button size="sm" variant="outline" href={getFileUrl(booking.paymentProof)} target="_blank" class="gap-1">
                  <Eye class="h-3.5 w-3.5" />
                  <span>View</span>
                </Button>
                <Button size="sm" variant="outline" href={getFileUrl(booking.paymentProof)} download class="gap-1">
                  <Download class="h-3.5 w-3.5" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Passengers Table -->
      <Card class="bg-card">
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Users class="h-4 w-4 text-primary" />
            <span>Passenger Details ({booking.passengers?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/20 text-xs text-muted-foreground uppercase tracking-wider">
                  <th class="py-3 px-4 font-semibold w-12 text-center">#</th>
                  <th class="py-3 px-4 font-semibold">Passenger Name</th>
                  <th class="py-3 px-4 font-semibold">Ticket PNR</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                {#if booking.passengers && booking.passengers.length > 0}
                  {#each booking.passengers as passenger, idx}
                    <tr class="hover:bg-muted/10 transition-colors">
                      <td class="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td class="py-3 px-4 font-medium text-foreground">
                        {passenger.prefix ? `${passenger.prefix} ` : ''}{passenger.passengerName}
                      </td>
                      <td class="py-3 px-4">
                        {#if (passenger as any).ticketPnr || booking.ticketPnr}
                          <span class="font-mono text-xs bg-muted px-2 py-1 rounded border border-border/40 font-semibold text-foreground">
                            {(passenger as any).ticketPnr || booking.ticketPnr}
                          </span>
                        {:else}
                          <span class="text-xs text-muted-foreground italic">-</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="3" class="py-4 text-center text-muted-foreground italic">No passengers found.</td>
                  </tr>
                {/if}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Financial Side Panel -->
    <div class="space-y-6">
      
      <!-- Money Aggregates Card -->
      <Card class="bg-card border-l-4 border-l-primary">
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <DollarSign class="h-4 w-4 text-primary" />
            <span>Financial Aggregates</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4 text-sm">
          {#if salesReturnAmt > 0}
            <div class="flex items-center justify-between border-b border-border pb-2 text-muted-foreground text-xs">
              <span>Original Selling Price</span>
              <span class="font-mono line-through">
                <MoneyDisplay amount={booking.payableAmount} />
              </span>
            </div>
            <div class="flex items-center justify-between border-b border-border pb-2 text-rose-600 dark:text-rose-400 text-xs">
              <span>Sales Return (Customer Refund)</span>
              <span class="font-mono font-semibold">
                -<MoneyDisplay amount={salesReturnAmt} />
              </span>
            </div>
          {/if}

          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Total Selling Price</span>
            <span class="font-bold text-foreground font-mono text-base">
              <MoneyDisplay amount={netSellingPrice} />
            </span>
          </div>

          {#if isAllInhouse}
            <div class="bg-muted/30 p-2.5 rounded text-xs text-muted-foreground leading-relaxed mt-2">
              <Info class="h-3.5 w-3.5 text-muted-foreground inline shrink-0 mr-1.5 align-text-bottom" />
              This flight booking is marked as <strong>In-House</strong>. Supplier cost and salesman commission profit are not calculated.
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Settle Method info -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <Building class="h-4 w-4 text-muted-foreground" />
            <span>Settle Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3.5 text-sm">
          {@const pMethod = (booking as any)?.paymentMethod || 'cash'}
          {@const bName = getBankName((booking as any)?.bankId, (booking as any)?.bankName)}
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Payment Method</span>
            <span class="font-semibold text-foreground capitalize">{pMethod}</span>
          </div>

          {#if pMethod.toLowerCase() === 'online'}
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Bank Name</span>
              <span class="font-semibold text-foreground">{bName || '-'}</span>
            </div>
          {/if}

          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">Date Booked</span>
            <span class="font-semibold text-foreground flex items-center gap-1">
              <Calendar class="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-'}
              </span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
{/if}
