<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { formatDateOnly, formatDateTime } from '$lib/formatters/date';
  import { 
    getQuotationById, 
    downloadSavedQuotationPdf, 
    type QuotationDetail 
  } from '$lib/features/quotations/api/quotation-api';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import * as Alert from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { 
    ChevronLeft, 
    Download, 
    Eye, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    XCircle,
    User, 
    Phone, 
    Mail, 
    FileSpreadsheet, 
    Info, 
    Lock,
    ShieldCheck,
    Calendar,
    Briefcase
  } from 'lucide-svelte';

  const quotationId = page.params.id;

  let loading = $state(true);
  let error = $state<any>(null);
  let quotation = $state<QuotationDetail | null>(null);
  let downloadingPdf = $state(false);

  async function loadQuotation() {
    loading = true;
    error = null;
    try {
      quotation = await getQuotationById(quotationId);
    } catch (err: any) {
      error = err;
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadQuotation();
  });

  async function handleDownloadPdf() {
    if (!quotation) return;
    downloadingPdf = true;
    try {
      const blob = await downloadSavedQuotationPdf(quotation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quotation.documentNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    } finally {
      downloadingPdf = false;
    }
  }

  async function handlePreviewPdf() {
    if (!quotation) return;
    downloadingPdf = true;
    try {
      const blob = await downloadSavedQuotationPdf(quotation.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(err.message || 'Failed to preview PDF.');
    } finally {
      downloadingPdf = false;
    }
  }

  function isApproved(status?: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'approved' || s === 'success';
  }
</script>

<div class="space-y-6">
  <!-- Back Button & Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="space-y-1">
      <Button 
        variant="ghost" 
        size="sm" 
        class="gap-1 pl-0 text-muted-foreground hover:text-foreground text-xs" 
        onclick={() => goto('/quotations')}
      >
        <ChevronLeft class="h-4 w-4" />
        <span>Back to Quotations</span>
      </Button>
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold tracking-tight text-foreground font-mono">
          {#if loading}
            <Skeleton class="h-8 w-48" />
          {:else if quotation}
            {quotation.documentNumber}
          {:else}
            Quotation Details
          {/if}
        </h1>
        {#if quotation}
          <!-- Status Badge -->
          {#if isApproved(quotation.status)}
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 class="h-3.5 w-3.5" />
              Approved
            </span>
          {:else if (quotation.status || '').toLowerCase() === 'rejected'}
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20">
              <XCircle class="h-3.5 w-3.5" />
              Rejected
            </span>
          {:else}
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <Clock class="h-3.5 w-3.5" />
              Pending Approval
            </span>
          {/if}
        {/if}
      </div>
    </div>

    <!-- Actions (PDF buttons gated by approved status) -->
    {#if quotation}
      <div class="flex items-center gap-2">
        {#if isApproved(quotation.status)}
          <Button 
            onclick={handlePreviewPdf} 
            variant="outline" 
            size="sm" 
            class="gap-1.5 text-xs shadow-xs" 
            disabled={downloadingPdf}
          >
            <Eye class="h-3.5 w-3.5 text-teal-600" />
            <span>Preview PDF</span>
          </Button>
          <Button 
            onclick={handleDownloadPdf} 
            variant="default" 
            size="sm" 
            class="gap-1.5 text-xs shadow-md bg-teal-600 hover:bg-teal-700 text-white" 
            disabled={downloadingPdf}
          >
            <Download class="h-3.5 w-3.5" />
            <span>Download Official PDF</span>
          </Button>
        {:else}
          <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium border border-border">
            <Lock class="h-3.5 w-3.5 text-amber-600" />
            <span>PDF downloads locked pending Accounts approval</span>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if error}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-5 w-5" />
      <Alert.Title>Failed to load quotation</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{error.message || 'Quotation not found.'}</Alert.Description>
    </Alert.Root>
  {/if}

  {#if loading}
    <div class="space-y-4">
      <Skeleton class="h-32 w-full rounded-xl" />
      <Skeleton class="h-64 w-full rounded-xl" />
    </div>
  {:else if quotation}

    <!-- Client & Quotation Metadata Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <!-- Card 1: Client Information -->
      <Card class="bg-card shadow-2xs">
        <CardContent class="p-4 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
            <User class="h-3.5 w-3.5 text-teal-600" />
            <span>Recipient Information</span>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="text-sm font-bold text-foreground">{quotation.customerName}</div>
            {#if quotation.customerContact}
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Phone class="h-3.5 w-3.5" />
                <span>{quotation.customerContact}</span>
              </div>
            {/if}
            {#if quotation.customerEmail}
              <div class="flex items-center gap-1.5 text-muted-foreground">
                <Mail class="h-3.5 w-3.5" />
                <span>{quotation.customerEmail}</span>
              </div>
            {/if}
          </div>
        </CardContent>
      </Card>

      <!-- Card 2: Sales Representative -->
      <Card class="bg-card shadow-2xs">
        <CardContent class="p-4 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
            <Briefcase class="h-3.5 w-3.5 text-teal-600" />
            <span>Prepared By</span>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="text-sm font-bold text-foreground">{quotation.salesmanName || 'Sales Representative'}</div>
            <div class="text-muted-foreground text-[11px]">Texas Travels Sales Team</div>
          </div>
        </CardContent>
      </Card>

      <!-- Card 3: Quotation Summary -->
      <Card class="bg-card shadow-2xs">
        <CardContent class="p-4 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">
            <Calendar class="h-3.5 w-3.5 text-teal-600" />
            <span>Quotation Summary</span>
          </div>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Created Date:</span>
              <span class="font-medium text-foreground">{formatDateOnly(quotation.createdAt)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Total Services:</span>
              <span class="font-medium text-foreground">{quotation.items.length}</span>
            </div>
            <div class="flex justify-between border-t border-border pt-1.5 mt-1 font-bold text-sm">
              <span>Grand Total:</span>
              <span class="text-teal-700 dark:text-teal-400 font-mono"><MoneyDisplay amount={quotation.totalAmount} /></span>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>

    <!-- Quotation Line Items Table -->
    <Card class="bg-card shadow-2xs overflow-hidden">
      <div class="p-4 border-b border-border flex items-center justify-between">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet class="h-4 w-4 text-teal-600" />
          <span>Quotation Line Items & Specifications</span>
        </h3>
        <span class="text-xs text-muted-foreground">{quotation.items.length} item(s)</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="bg-muted/50 text-muted-foreground font-semibold border-b border-border text-[11px] uppercase tracking-wider">
            <tr>
              <th class="py-3 px-4 w-12 text-center">#</th>
              <th class="py-3 px-4 w-44">Service Category</th>
              <th class="py-3 px-4">Item Description / Details</th>
              <th class="py-3 px-4 text-center w-20">Quantity</th>
              <th class="py-3 px-4 text-right w-32">Unit Price</th>
              <th class="py-3 px-4 text-right w-36">Total Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y border-border">
            {#each quotation.items as item, index (item.id || index)}
              <tr class="hover:bg-muted/30 transition-colors">
                <td class="py-3 px-4 text-center font-mono text-muted-foreground">{index + 1}</td>
                <td class="py-3 px-4">
                  <span class="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                    {item.serviceType}
                  </span>
                </td>
                <td class="py-3 px-4 font-medium text-foreground whitespace-pre-wrap">{item.description}</td>
                <td class="py-3 px-4 text-center font-mono">{item.quantity}</td>
                <td class="py-3 px-4 text-right font-mono text-muted-foreground"><MoneyDisplay amount={item.unitPrice} /></td>
                <td class="py-3 px-4 text-right font-mono font-bold text-foreground"><MoneyDisplay amount={item.totalAmount} /></td>
              </tr>
            {/each}
          </tbody>
          <tfoot class="bg-muted/30 border-t border-border font-semibold">
            <tr>
              <td colspan="5" class="py-3 px-4 text-right uppercase tracking-wider text-muted-foreground text-[11px]">Estimate Total (BHD):</td>
              <td class="py-3 px-4 text-right font-mono font-bold text-base text-teal-700 dark:text-teal-400">
                <MoneyDisplay amount={quotation.totalAmount} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>

    <!-- Remarks / Notes Card -->
    {#if quotation.remarks}
      <Card class="bg-card shadow-2xs">
        <CardContent class="p-4 space-y-2">
          <div class="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Info class="h-3.5 w-3.5 text-teal-600" />
            <span>Special Terms, Inclusions & Conditions</span>
          </div>
          <div class="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-lg border border-border">
            {quotation.remarks}
          </div>
        </CardContent>
      </Card>
    {/if}

  {/if}
</div>
