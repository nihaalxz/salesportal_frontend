<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { getVisaApplicationById, getVisaCountries, getVisaPackages, reuploadVisaDocuments, type VisaApplicationDetail, type VisaCountryMaster, type VisaPackageMaster, type ApplicantDocReuploadPayload } from '$lib/features/visas/api/visas-api';
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

  let loading = $state(true);
  let error = $state<any>(null);
  let booking = $state<VisaApplicationDetail | null>(null);
  let suppliers = $state<SupplierResponse[]>([]);
  let banks = $state<BankResponse[]>([]);
  let visaCountries = $state<VisaCountryMaster[]>([]);
  let visaPackages = $state<VisaPackageMaster[]>([]);

  let isRejected = $derived(booking?.processingStatus?.toLowerCase() === 'rejected');
  let rejectionFee = $derived((booking as any)?.rejectionFee ?? 0);
  let salesReturnAmt = $derived((booking as any)?.salesReturnAmount ?? 0);
  let purchaseReturnAmt = $derived((booking as any)?.purchaseReturnAmount ?? 0);
  let netSupplierCost = $derived(Math.max(0, (booking?.expectedSupplierCost ?? 0) - purchaseReturnAmt));
  let balanceRefunded = $derived(isRejected ? Math.max(0, (booking?.payableAmount ?? 0) - netSupplierCost - rejectionFee) : salesReturnAmt);
  let netSellingAmount = $derived(Math.max(0, (booking?.payableAmount ?? 0) - balanceRefunded));
  let grossProfit = $derived(isRejected ? rejectionFee : (netSellingAmount - netSupplierCost));

  let govtVisaTrackingId = $derived.by(() => {
    if (!booking) return null;
    const topRef = (booking as any).govtFeeReference || (booking as any).visaAppId || (booking as any).govt_fee_reference;
    if (topRef) return topRef;

    if (booking.applicants && booking.applicants.length > 0) {
      const appRefs = booking.applicants
        .map(a => (a as any).govtFeeReference || (a as any).visaAppId || (a as any).govt_fee_reference)
        .filter(Boolean);
      if (appRefs.length > 0) {
        return Array.from(new Set(appRefs)).join(', ');
      }
    }
    return null;
  });

  // Re-upload Modal State
  let showReuploadModal = $state(false);
  let isSubmittingReupload = $state(false);
  let reuploadError = $state('');
  let applicantFiles = $state<Record<number, { passportCopy?: File; iqamaHotelNo?: File; bankDoc?: File }>>({});

  function openReuploadModal() {
    reuploadError = '';
    applicantFiles = {};
    if (booking?.applicants) {
      for (const app of booking.applicants) {
        applicantFiles[app.id] = {};
      }
    }
    showReuploadModal = true;
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async function handleReuploadSubmit() {
    if (!booking || !booking.applicants) return;

    isSubmittingReupload = true;
    reuploadError = '';

    try {
      const payload: ApplicantDocReuploadPayload[] = [];
      for (const app of booking.applicants) {
        const files = applicantFiles[app.id];
        if (!files) continue;

        let passportBase64: string | undefined = undefined;
        let iqamaBase64: string | undefined = undefined;
        let bankBase64: string | undefined = undefined;

        if (files.passportCopy) {
          passportBase64 = await fileToBase64(files.passportCopy);
        }
        if (files.iqamaHotelNo) {
          iqamaBase64 = await fileToBase64(files.iqamaHotelNo);
        }
        if (files.bankDoc) {
          bankBase64 = await fileToBase64(files.bankDoc);
        }

        if (passportBase64 || iqamaBase64 || bankBase64) {
          payload.push({
            applicantId: app.id,
            passportCopy: passportBase64,
            iqamaHotelNo: iqamaBase64,
            bankDoc: bankBase64
          });
        }
      }

      if (payload.length === 0) {
        reuploadError = 'Please select at least one document to re-upload.';
        isSubmittingReupload = false;
        return;
      }

      await reuploadVisaDocuments(bookingId, payload);
      showReuploadModal = false;
      await loadDetails();
    } catch (err: any) {
      reuploadError = err.message || 'Failed to re-upload documents. Please try again.';
    } finally {
      isSubmittingReupload = false;
    }
  }

  function isDocFilePath(str?: string | null): boolean {
    if (!str) return false;
    const s = str.trim().toLowerCase();
    return s.startsWith('/uploads/') || s.startsWith('uploads/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:');
  }

  let abortController: AbortController | null = null;

  async function loadDetails() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading = true;
    error = null;

    try {
      booking = await getVisaApplicationById(bookingId, abortController.signal);
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
    getVisaCountries().then(data => {
      visaCountries = data || [];
    }).catch(console.error);
    getVisaPackages().then(data => {
      visaPackages = data || [];
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

  function getCountryName(countryId: number | null | undefined) {
    if (!countryId) return '-';
    const found = visaCountries.find(c => c.id === countryId);
    if (found) return found.name;
    const pkg = visaPackages.find(p => p.countryId === countryId);
    if (pkg) return pkg.countryName;
    return `Country #${countryId}`;
  }

  function getVisaPackageName(packId: number | null | undefined, fallbackName: string | null | undefined) {
    if (fallbackName && fallbackName.trim()) return fallbackName;
    if (!packId) return '-';
    const found = visaPackages.find(p => p.id === packId);
    return found ? found.name : `Package #${packId}`;
  }
</script>

<PageHeader title={booking ? `Visa Application ${booking.documentNumber}` : 'Visa Application Details'} description="Review visa package request, applicant files, and payment status.">
  <Button onclick={() => goto('/bookings/visas')} variant="outline" size="sm" class="gap-1.5">
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
          ? 'The requested visa booking was not found or access is unauthorized.' 
          : (error.detail || error.message || 'An unexpected database/network connection failure occurred.')}
      </Alert.Description>
    </Alert.Root>
    <Button onclick={() => goto('/bookings/visas')} variant="default">
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

      {#if booking.processingStatus?.toLowerCase() === 'document_update_requested'}
        <!-- Action Required Document Request Banner -->
        <Card class="bg-amber-500/10 border-amber-500/30">
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-500 text-white">Action Required</span>
                <CardTitle class="text-base text-amber-800 dark:text-amber-300">Document Update Requested by Operations</CardTitle>
              </div>
              <Button size="sm" onclick={openReuploadModal} class="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 cursor-pointer">
                Re-upload Documents
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-2 text-xs">
            <p class="text-sm font-medium text-foreground">
              <strong>Operations Feedback:</strong> {(booking as any).documentRequestNote || 'Please inspect and re-upload updated applicant documents.'}
            </p>
            <p class="text-[11px] text-muted-foreground">
              Click the button above to upload clear/updated passport copies or required documents for the applicants.
            </p>
          </CardContent>
        </Card>
      {/if}
      
      <!-- Primary Details Card -->
      <Card class="bg-card">
        <CardHeader class="pb-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle class="text-lg">Visa Package Details</CardTitle>
              <CardDescription>Visa processing package metadata and client info.</CardDescription>
            </div>
            <div class="flex gap-2 items-center flex-wrap">
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
            <span class="text-xs text-muted-foreground block mb-0.5">Destination Country</span>
            <span class="font-medium text-foreground">{getCountryName(booking.countryId)}</span>
          </div>

          <div>
            <span class="text-xs text-muted-foreground block mb-0.5">Visa Package Name</span>
            <span class="font-medium text-foreground">{getVisaPackageName(booking.visaPackId, booking.visaPackName)}</span>
          </div>

          <div>
            <span class="text-xs text-muted-foreground block mb-0.5">Nationality</span>
            <span class="font-medium text-foreground">
              {booking.applicants && booking.applicants.length > 0
                ? Array.from(new Set(booking.applicants.map(a => a.nationality).filter(Boolean))).join(', ') || '-'
                : '-'}
            </span>
          </div>

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

          {#if (booking as any).assignedOperatorName}
            <div>
              <span class="text-xs text-muted-foreground block mb-0.5">Processed / Assigned Operator</span>
              <span class="font-semibold text-primary block">{(booking as any).assignedOperatorName}</span>
            </div>
          {/if}

          {#if booking.supplierId || booking.supplierName}
            <div>
              <span class="text-xs text-muted-foreground block mb-0.5">Supplier Details</span>
              <span class="font-medium text-foreground">{getSupplierName(booking.supplierId, booking.supplierName)} (ID: {booking.supplierId})</span>
            </div>
          {/if}

          {#if govtVisaTrackingId}
            <div>
              <span class="text-xs text-muted-foreground block mb-0.5">Govt Visa Tracking ID</span>
              <span class="font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-300/60 dark:border-emerald-800/60 inline-block text-xs">
                {govtVisaTrackingId}
              </span>
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Document Notes / Status Card (if visa has document, notes, rejection doc, or payment proof) -->
      {#if booking.visaDocument || booking.approvalNote || booking.rejectionDocument || booking.rejectionNote || booking.refundNote || booking.paymentProof}
        <Card class="bg-card">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">Processing Documents & Remarks</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4 text-sm">
            {#if booking.paymentProof}
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
            {/if}

            {#if booking.visaDocument}
              <div class="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded">
                <div>
                  <span class="font-medium text-emerald-600 dark:text-emerald-400 block">Visa Document</span>
                  <span class="text-xs text-muted-foreground">Download the approved visa copy</span>
                </div>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" href={getFileUrl(booking.visaDocument)} target="_blank" class="gap-1">
                    <Eye class="h-3.5 w-3.5" />
                    <span>View</span>
                  </Button>
                  <Button size="sm" variant="outline" href={getFileUrl(booking.visaDocument)} download class="gap-1">
                    <Download class="h-3.5 w-3.5" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            {:else if booking.processingStatus?.toLowerCase() === 'approved'}
              <div class="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 p-3 rounded">
                <div>
                  <span class="font-medium text-amber-600 dark:text-amber-400 block">Visa Approved (Document Pending)</span>
                  <span class="text-xs text-muted-foreground">The visa application is approved. Official document copy will be uploaded shortly by operations.</span>
                </div>
              </div>
            {/if}

            {#if booking.rejectionDocument}
              <div class="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-3 rounded">
                <div>
                  <span class="font-medium text-red-600 dark:text-red-400 block">Rejection Document</span>
                  <span class="text-xs text-muted-foreground">Download the uploaded rejection proof document</span>
                </div>
                <div class="flex gap-2">
                  <Button size="sm" variant="outline" href={getFileUrl(booking.rejectionDocument)} target="_blank" class="gap-1">
                    <Eye class="h-3.5 w-3.5" />
                    <span>View</span>
                  </Button>
                  <Button size="sm" variant="outline" href={getFileUrl(booking.rejectionDocument)} download class="gap-1">
                    <Download class="h-3.5 w-3.5" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            {/if}

            {#if booking.approvalNote}
              <div>
                <span class="text-xs text-muted-foreground block mb-0.5">Approval Note</span>
                <p class="text-foreground bg-muted/10 p-2.5 rounded whitespace-pre-wrap">{booking.approvalNote}</p>
              </div>
            {/if}

            {#if booking.rejectionNote}
              <div>
                <span class="text-xs text-muted-foreground block mb-0.5">Rejection Details (Fee: <MoneyDisplay amount={booking.rejectionFee} />)</span>
                <p class="text-foreground bg-red-500/5 border border-red-500/10 p-2.5 rounded whitespace-pre-wrap">{booking.rejectionNote}</p>
              </div>
            {/if}

            {#if booking.refundNote}
              <div>
                <span class="text-xs text-muted-foreground block mb-0.5">Refund Note</span>
                <p class="text-foreground bg-muted/10 p-2.5 rounded whitespace-pre-wrap">{booking.refundNote}</p>
              </div>
            {/if}
          </CardContent>
        </Card>
      {/if}

      <!-- Applicants List -->
      <Card class="bg-card">
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Users class="h-4 w-4 text-primary" />
            <span>Applicants List ({booking.applicants?.length || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="border-b border-border bg-muted/20 text-xs text-muted-foreground uppercase tracking-wider">
                  <th class="py-3 px-4 font-semibold">Name / Contact</th>
                  <th class="py-3 px-4 font-semibold">Passport & Nationality</th>
                  <th class="py-3 px-4 font-semibold">In-house</th>
                  <th class="py-3 px-4 font-semibold text-right">Selling Price</th>
                  <th class="py-3 px-4 font-semibold text-right">Supplier Cost</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                {#if booking.applicants && booking.applicants.length > 0}
                  {#each booking.applicants as applicant}
                    <tr class="hover:bg-muted/10 transition-colors">
                      <td class="py-3 px-4">
                        <span class="font-medium text-foreground block">
                          {#if applicant.fName || applicant.lName}
                            {applicant.prefix ? `${applicant.prefix} ` : ''}{applicant.fName || ''} {applicant.lName || ''}
                          {:else}
                            <span class="italic text-muted-foreground">Pending Entry (From Passport)</span>
                          {/if}
                        </span>
                        <span class="text-xs text-muted-foreground block">{applicant.emailId || '-'} | {applicant.contactNo || '-'}</span>
                      </td>
                      <td class="py-3 px-4">
                        <span class="font-medium text-foreground block">{applicant.passportNo || '-'}</span>
                        <span class="text-xs text-muted-foreground block mb-1">
                          Nationality: <span class="font-semibold text-foreground">{applicant.nationality || '-'}</span> &middot; DOB: {applicant.dob ? new Date(applicant.dob).toLocaleDateString() : '-'}
                        </span>
                        {#if (applicant as any).govtFeeReference || (applicant as any).visaAppId || (applicant as any).govt_fee_reference}
                          <div class="mt-1 mb-1">
                            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-300/60 dark:border-emerald-800/60 font-mono">
                              Govt Visa Tracking ID: {(applicant as any).govtFeeReference || (applicant as any).visaAppId || (applicant as any).govt_fee_reference}
                            </span>
                          </div>
                        {/if}
                        {#if (applicant as any).passportCopy}
                          <div class="flex items-center gap-2 mt-1">
                            <a
                              href={getFileUrl((applicant as any).passportCopy)}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                              title="View Passport Copy"
                            >
                              <Eye class="h-3 w-3" />
                              <span>View</span>
                            </a>
                            <a
                              href={getFileUrl((applicant as any).passportCopy)}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                              title="Download Passport Copy"
                            >
                              <Download class="h-3 w-3" />
                              <span>Download</span>
                            </a>
                          </div>
                        {/if}
                        {#if (applicant as any).iqamaHotelNo}
                          <div class="flex items-center gap-2 mt-1 text-xs">
                            <span class="text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[150px]">{(applicant as any).iqamaHotelNo}</span>
                            {#if isDocFilePath((applicant as any).iqamaHotelNo)}
                              <a
                                href={getFileUrl((applicant as any).iqamaHotelNo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                title="View Iqama / Hotel Document"
                              >
                                <Eye class="h-3 w-3" />
                                <span>View</span>
                              </a>
                              <a
                                href={getFileUrl((applicant as any).iqamaHotelNo)}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                title="Download Iqama / Hotel Document"
                              >
                                <Download class="h-3 w-3" />
                                <span>Download</span>
                              </a>
                            {/if}
                          </div>
                        {/if}
                        {#if (applicant as any).bankDoc}
                          <div class="flex items-center gap-2 mt-1 text-xs">
                            <span class="text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[150px]">Bank Document</span>
                            {#if isDocFilePath((applicant as any).bankDoc)}
                              <a
                                href={getFileUrl((applicant as any).bankDoc)}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                title="View Bank Document"
                              >
                                <Eye class="h-3 w-3" />
                                <span>View</span>
                              </a>
                              <a
                                href={getFileUrl((applicant as any).bankDoc)}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                title="Download Bank Document"
                              >
                                <Download class="h-3 w-3" />
                                <span>Download</span>
                              </a>
                            {/if}
                          </div>
                        {/if}
                      </td>
                      <td class="py-3 px-4">
                        {#if applicant.isInhouse}
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Yes</span>
                        {:else}
                          <div class="flex flex-col gap-0.5">
                            <span class="inline-flex items-center w-max px-1.5 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">No</span>
                            {#if booking.supplierId || booking.supplierName}
                              <span class="text-xs text-muted-foreground font-medium">{getSupplierName(booking.supplierId, booking.supplierName)}</span>
                            {/if}
                          </div>
                        {/if}
                      </td>
                      <td class="py-3 px-4 text-right font-semibold font-mono text-foreground">
                        <MoneyDisplay amount={applicant.payableAmount} />
                      </td>
                      <td class="py-3 px-4 text-right font-medium font-mono text-muted-foreground">
                        {#if applicant.isInhouse}
                          <span class="text-muted-foreground italic">-</span>
                        {:else}
                          <MoneyDisplay amount={applicant.expectedSupplierCost} />
                        {/if}
                      </td>
                    </tr>
                  {/each}
                {:else}
                  <tr>
                    <td colspan="5" class="py-4 text-center text-muted-foreground italic">No applicants found.</td>
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
          {#if isRejected}
            <div class="flex items-center justify-between border-b border-border pb-2 text-muted-foreground text-xs">
              <span>Original Selling Price</span>
              <span class="font-mono">
                <MoneyDisplay amount={booking.payableAmount} />
              </span>
            </div>
            <div class="flex items-center justify-between border-b border-border pb-2 text-rose-600 dark:text-rose-400 text-xs">
              <span>Customer Refund (Head Credit)</span>
              <span class="font-mono font-semibold">
                -<MoneyDisplay amount={balanceRefunded} />
              </span>
            </div>
            <div class="flex items-center justify-between border-b border-border pb-2">
              <span class="text-muted-foreground">Retained Selling Price</span>
              <span class="font-bold text-foreground font-mono text-base">
                <MoneyDisplay amount={netSellingAmount} />
              </span>
            </div>
          {:else}
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
                <MoneyDisplay amount={netSellingAmount} />
              </span>
            </div>
          {/if}

          {#if !booking.supplierId && !booking.supplierName && (booking.applicants?.every(a => a.isInhouse) ?? true)}
            <div class="bg-muted/30 p-2.5 rounded text-xs text-muted-foreground leading-relaxed mt-2">
              <Info class="h-3.5 w-3.5 text-muted-foreground inline shrink-0 mr-1.5 align-text-bottom" />
              This visa application is marked as <strong>In-House</strong>. Supplier cost and salesman commission profit are not calculated.
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
          {@const pMethod = (booking as any)?.paymentMethod || booking.applicants?.[0]?.paymentMethod || 'cash'}
          {@const bName = getBankName((booking as any)?.bankId || booking.applicants?.[0]?.bankId, (booking as any)?.bankName || booking.applicants?.[0]?.bankName)}
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

<!-- Re-upload Documents Modal -->
{#if showReuploadModal && booking}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" role="dialog" aria-modal="true">
    <div class="bg-background border border-border w-full max-w-xl rounded-xl shadow-lg flex flex-col max-h-[90vh]">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border">
        <h2 class="text-base font-bold text-foreground">Re-upload Applicant Documents</h2>
        <button class="text-muted-foreground hover:text-foreground text-lg cursor-pointer" onclick={() => (showReuploadModal = false)}>&times;</button>
      </div>

      <div class="p-5 overflow-y-auto space-y-4 text-xs">
        {#if reuploadError}
          <div class="p-3 text-xs rounded bg-destructive/10 text-destructive border border-destructive/20 font-medium" role="alert">{reuploadError}</div>
        {/if}

        <div class="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1">
          <p class="font-bold text-amber-800 dark:text-amber-300">Operations Feedback:</p>
          <p class="text-muted-foreground">{(booking as any).documentRequestNote || 'No specific note provided.'}</p>
        </div>

        {#if booking.applicants && booking.applicants.length > 0}
          {#each booking.applicants as applicant, idx}
            <div class="p-4 bg-muted/20 border border-border rounded-lg space-y-3">
              <div class="font-bold text-foreground flex items-center justify-between">
                <span>Applicant #{idx + 1}: {(applicant.fName || applicant.lName) ? `${applicant.prefix ? `${applicant.prefix} ` : ''}${applicant.fName || ''} ${applicant.lName || ''}`.trim() : 'Pending Entry (From Passport)'}</span>
                <span class="text-muted-foreground font-mono text-[11px]">{applicant.passportNo || 'No Passport'}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="space-y-1">
                  <label for="reupload-passport-{applicant.id}" class="font-bold text-muted-foreground block text-[10px] uppercase">Passport Copy (PDF/Image)</label>
                  <input
                    id="reupload-passport-{applicant.id}"
                    type="file"
                    onchange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (!applicantFiles[applicant.id]) applicantFiles[applicant.id] = {};
                      applicantFiles[applicant.id].passportCopy = file;
                    }}
                    class="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                  />
                </div>

                <div class="space-y-1">
                  <label for="reupload-iqama-{applicant.id}" class="font-bold text-muted-foreground block text-[10px] uppercase">Iqama / Hotel Document</label>
                  <input
                    id="reupload-iqama-{applicant.id}"
                    type="file"
                    onchange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (!applicantFiles[applicant.id]) applicantFiles[applicant.id] = {};
                      applicantFiles[applicant.id].iqamaHotelNo = file;
                    }}
                    class="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                  />
                </div>

                <div class="space-y-1">
                  <label for="reupload-bank-{applicant.id}" class="font-bold text-muted-foreground block text-[10px] uppercase">Bank Document</label>
                  <input
                    id="reupload-bank-{applicant.id}"
                    type="file"
                    onchange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (!applicantFiles[applicant.id]) applicantFiles[applicant.id] = {};
                      applicantFiles[applicant.id].bankDoc = file;
                    }}
                    class="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                  />
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <div class="flex justify-end gap-2 px-5 py-3 border-t border-border bg-muted/15 rounded-b-xl">
        <Button variant="outline" size="sm" onclick={() => (showReuploadModal = false)} disabled={isSubmittingReupload}>Cancel</Button>
        <Button size="sm" onclick={handleReuploadSubmit} disabled={isSubmittingReupload} class="bg-primary text-primary-foreground font-bold">
          {#if isSubmittingReupload}
            <svg class="animate-spin h-3 w-3 text-white mr-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
            Submitting...
          {:else}
            Submit Re-upload
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/if}
