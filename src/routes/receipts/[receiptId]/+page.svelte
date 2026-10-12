<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { getReceiptById } from '$lib/features/receipts/api/receipts-api';
  import { formatDateOnly, formatDateTime } from '$lib/formatters/date';
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    ChevronLeft, 
    RefreshCw,
    ShieldAlert,
    CheckCircle,
    User,
    Calendar,
    CreditCard,
    DollarSign,
    Info,
    Building2,
    FileText,
    Download,
    Eye,
    Printer
  } from 'lucide-svelte';
  import { getFileUrl } from '$lib/api/client';
  import { printInvoice } from '$lib/utils/print-invoice';


  let receiptId = $derived($page.params.receiptId);

  let loading = $state(true);
  let error = $state<any>(null);
  let receipt = $state<any>(null);

  async function loadReceiptDetails() {
    if (!receiptId) return;
    loading = true;
    error = null;
    try {
      receipt = await getReceiptById(receiptId);
    } catch (err: any) {
      error = err;
    } finally {
      loading = false;
    }
  }



  $effect(() => {
    loadReceiptDetails();
  });
</script>

<div class="mb-4">
  <Button onclick={() => goto('/receipts')} variant="ghost" size="sm" class="gap-1.5 -ml-3 text-muted-foreground">
    <ChevronLeft class="h-4 w-4" />
    <span>Back to list</span>
  </Button>
</div>

{#if error}
  <Alert.Root variant="destructive">
    <ShieldAlert class="h-5 w-5" />
    <Alert.Title>Failed to load receipt details</Alert.Title>
    <Alert.Description class="mt-2 flex flex-col gap-3">
      <p>{error.detail || error.message || 'Record not found or access denied.'}</p>
      <Button onclick={loadReceiptDetails} variant="outline" size="sm" class="w-fit gap-2">
        <RefreshCw class="h-4 w-4" />
        <span>Retry Loading</span>
      </Button>
    </Alert.Description>
  </Alert.Root>

{:else if loading}
  <div class="space-y-6">
    <Skeleton class="h-20 w-full" />
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton class="h-40 col-span-2" />
      <Skeleton class="h-40" />
    </div>
  </div>

{:else if receipt}
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold tracking-tight text-foreground font-mono">{receipt.documentNumber || receipt.receiptId}</h1>
          <StatusBadge status={receipt.status} />
        </div>
        <p class="text-sm text-muted-foreground">
          Logged on {formatDateTime(receipt.createdAt)}
        </p>
      </div>
    </div>



    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left Panel: Core Details -->
      <div class="md:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <DollarSign class="h-4 w-4" />
              <span>Payment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="grid grid-cols-2 gap-6 text-sm">
            <div>
              <span class="text-muted-foreground block text-xs mb-1">Service Type</span>
              <span class="font-bold text-foreground capitalize bg-primary/10 text-primary px-2.5 py-1 rounded text-xs inline-block border border-primary/20">
                {receipt.service === 'credit_settlement' ? 'Credit Settlement' : receipt.service.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span class="text-muted-foreground block text-xs mb-1">Receipt Amount</span>
              <span class="font-bold text-lg text-foreground font-mono">
                <MoneyDisplay amount={receipt.amount} currency="BHD" />
              </span>
            </div>
            <div>
              <span class="text-muted-foreground block text-xs mb-1">Payment Method</span>
              <span class="font-semibold text-foreground capitalize font-mono">
                {receipt.paymentMode}
              </span>
            </div>
            {#if receipt.bookingId}
              <div>
                <span class="text-muted-foreground block text-xs mb-1">Allocation Mode</span>
                <span class="font-semibold bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded text-xs font-mono">
                  Specific Booking ID: {receipt.bookingId}
                </span>
              </div>
            {/if}
          </CardContent>
        </Card>



        <!-- Narration -->
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText class="h-4 w-4" />
              <span>Payment Description / Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-foreground bg-muted/10 p-5 rounded-lg border border-border leading-relaxed">
            {receipt.narration || 'No narration provided.'}
          </CardContent>
        </Card>

        {#if receipt.paymentProof}
          <Card>
            <CardHeader>
              <CardTitle class="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText class="h-4 w-4" />
                <span>Uploaded Attachments</span>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4 text-sm">
              <div class="flex items-center justify-between bg-muted/20 p-3 rounded">
                <div>
                  <span class="font-medium text-foreground block">Payment Proof</span>
                  <span class="text-xs text-muted-foreground">Uploaded payment proof document</span>
                </div>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" href={getFileUrl(receipt.paymentProof)} target="_blank" class="gap-1">
                    <Eye class="h-3.5 w-3.5" />
                    <span>View</span>
                  </Button>
                  <Button size="sm" variant="outline" href={getFileUrl(receipt.paymentProof)} download class="gap-1">
                    <Download class="h-3.5 w-3.5" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        {/if}
      </div>

      <!-- Right Panel: Customer & Bank Info -->
      <div class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User class="h-4 w-4" />
              <span>Customer Account</span>
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3 text-sm">
            <div>
              <span class="text-muted-foreground block text-xs">Customer Name</span>
              <span class="font-bold text-foreground">{receipt.headName || 'General Account'}</span>
            </div>
            <div>
              <span class="text-muted-foreground block text-xs">Client Type</span>
              <span class="font-semibold text-foreground capitalize">{receipt.clientType}</span>
            </div>
          </CardContent>
        </Card>

        {#if receipt.paymentMode === 'online'}
          <Card>
            <CardHeader>
              <CardTitle class="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 class="h-4 w-4" />
                <span>Bank Deposit Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 text-sm">
              <div>
                <span class="text-muted-foreground block text-xs">Receiving Bank</span>
                <span class="font-bold text-foreground">{receipt.bankName || 'Not Specified'}</span>
              </div>
              {#if receipt.paymentReference}
                <div>
                  <span class="text-muted-foreground block text-xs">Transaction Reference</span>
                  <span class="font-semibold font-mono text-foreground">{receipt.paymentReference}</span>
                </div>
              {/if}
            </CardContent>
          </Card>
        {/if}
      </div>
    </div>
  </div>
{/if}
