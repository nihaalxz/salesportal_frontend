<script lang="ts">
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import HeadSelect from '$lib/components/HeadSelect.svelte';
  import CustomerAccountWidget from '$lib/features/customer-accounts/components/CustomerAccountWidget.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { createOtherService, type HeadLookup } from '$lib/features/other-services/api/other-services-api';
  import { lookupHeads as lookupHeadsApi } from '$lib/features/heads/api/heads-api';
  import { getBanks, getSuppliers, type BankResponse } from '$lib/features/receipts/api/receipts-api';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    ChevronLeft, 
    Save, 
    Loader2, 
    AlertCircle, 
    UserCheck,
    Plus,
    Trash2,
    Briefcase,
    DollarSign
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  // Form State
  let clientType = $state('customer');
  let headId = $state<number | null>(null);

  interface ApplicantInput {
    prefix: string;
    name: string;
  }

  // Dynamic applicants/clients state
  let applicants = $state<ApplicantInput[]>([
    { prefix: 'Mr.', name: '' }
  ]);

  function addApplicant() {
    applicants = [...applicants, { prefix: 'Mr.', name: '' }];
  }

  function removeApplicant(index: number) {
    if (applicants.length > 1) {
      applicants = applicants.filter((_, i) => i !== index);
    }
  }

  let agent = $state('');
  let agentId = $state<number | null>(null);
  let isInhouse = $state(true);
  let supplierId = $state<number | null>(null);
  let expectedSupplierCost = $state(0);
  let amount = $state(0);
  let serviceName = $state('');
  let narration = $state('');
  let paymentMethod = $state('credit');
  let bankId = $state<number | null>(null);
  let status = $state('pending');

  // Interactive UI state (Dropdown list)
  let headsList = $state<HeadLookup[]>([]);
  let agentsList = $state<any[]>([]);
  let loadingHeads = $state(false);
  let loadingAgents = $state(false);
  let realBanks = $state<BankResponse[]>([]);
  let suppliers = $state<{ id: number; name: string }[]>([]);

  let submitting = $state(false);
  let successMsg = $state('');
  let errorMsg = $state('');
  let validationErrors = $state<Record<string, string[]>>({});

  const prefixes = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

  onMount(async () => {
    loadingHeads = true;
    try {
      headsList = await lookupHeadsApi('', 100, 'customer');
    } catch (err) {
      console.error('Failed to load active customer heads:', err);
    } finally {
      loadingHeads = false;
    }

    loadingAgents = true;
    try {
      agentsList = await lookupHeadsApi('', 100, 'agent');
    } catch (err) {
      console.error('Failed to load active agents:', err);
    } finally {
      loadingAgents = false;
    }

    getBanks().then(res => {
      realBanks = res;
    }).catch(err => {
      console.error('Failed to load banks:', err);
    });

    getSuppliers().then(res => {
      const filtered = res.filter(s => s.categories && s.categories.some(c => c.toLowerCase().includes('other')));
      suppliers = (filtered.length > 0 ? filtered : res).map(s => ({ id: s.id, name: s.name }));
    }).catch(err => {
      console.error('Failed to load suppliers:', err);
    });
  });

  // Generate unique idempotency key for this form session, safe for SSR
  function getFreshIdempotencyKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'idemp-' + Math.random().toString(36).substring(2) + '-' + Date.now();
  }

  // Reactive Profit calculation
  let computedProfit = $derived(isInhouse ? 0 : Math.max(0, amount - expectedSupplierCost));

  function selectHead(head: HeadLookup) {
    headId = head.id ?? null;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    errorMsg = '';
    successMsg = '';
    validationErrors = {};

    // Basic frontend checks
    const errors: Record<string, string[]> = {};
    if (applicants.length === 0) {
      errors.applicants = ['At least one applicant / client name is required.'];
    } else {
      applicants.forEach((a, i) => {
        if (!a.name.trim()) {
          errors[`applicants_${i}_name`] = [`Applicant ${i + 1} name is required.`];
        }
      });
    }

    if (!serviceName.trim()) errors.serviceName = ['Service type name is required.'];
    if (amount < 0) errors.amount = ['Amount must be non-negative.'];
    
    if (clientType === 'customer' && !headId) {
      errors.headId = ['Customer account head is required.'];
    }
    if (clientType === 'agent') {
      if (!agentId) {
        errors.agentId = ['Agent selection is required.'];
      }
    }

    if (!isInhouse) {
      if (!supplierId) errors.supplierId = ['Supplier selection is required.'];
      if (expectedSupplierCost < 0) errors.expectedSupplierCost = ['Expected supplier cost must be non-negative.'];
    }

    if (Object.keys(errors).length > 0) {
      validationErrors = errors;
      submitting = false;
      return;
    }

    const numApplicants = applicants.length || 1;
    const perApplicantAmount = amount / numApplicants;
    const perApplicantCost = (isInhouse ? 0 : expectedSupplierCost) / numApplicants;

    // Prepare Request Body
    const request = {
      clientType,
      headId: clientType === 'customer' ? headId : null,
      prefix: applicants[0]?.prefix || 'Mr.',
      name: applicants.map(a => a.name.trim()).filter(Boolean).join(', '),
      applicants: applicants.map(a => ({
        prefix: a.prefix,
        name: a.name.trim(),
        amount: perApplicantAmount,
        expectedSupplierCost: perApplicantCost,
        isInhouse,
        supplierId: isInhouse ? null : supplierId
      })),
      agent: clientType === 'agent' ? agent : null,
      agentId: clientType === 'agent' ? agentId : null,
      isInhouse,
      supplierId: isInhouse ? null : supplierId,
      expectedSupplierCost: isInhouse ? 0 : expectedSupplierCost,
      amount,
      serviceName,
      narration,
      paymentMethod,
      bankId: paymentMethod === 'online' ? bankId : null,
      bankName: paymentMethod === 'online' ? (realBanks.find(b => b.id === bankId)?.bankName ?? '') : null,
      status,
      paymentProof: null
    };

    try {
      const response = await createOtherService(request, getFreshIdempotencyKey());
      successMsg = `Booking ${response.documentNumber} successfully created!`;
      setTimeout(() => {
        goto(`/bookings/other-services/${response.id}`);
      }, 1000);
    } catch (err: any) {
      if (err.status === 422 || err.status === 400) {
        if (err.errors) {
          validationErrors = err.errors;
        } else {
          errorMsg = err.detail || err.message || 'Validation failed. Please correct the fields.';
        }
      } else {
        errorMsg = err.detail || err.message || 'An unexpected connection failure occurred.';
      }
    } finally {
      submitting = false;
    }
  }
</script>

<PageHeader title="New Other Service" description="Record a new custom service booking.">
  <Button onclick={() => goto('/bookings/other-services')} variant="outline" size="sm" class="gap-1.5">
    <ChevronLeft class="h-4 w-4" />
    <span>Back to List</span>
  </Button>
</PageHeader>

<form onsubmit={handleSubmit} class="w-full space-y-6">
  
  {#if errorMsg}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-5 w-5" />
      <Alert.Title>Submission Error</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{errorMsg}</Alert.Description>
    </Alert.Root>
  {/if}

  {#if successMsg}
    <Alert.Root class="border-success/30 bg-success/10 text-success dark:border-success/20 dark:bg-success/5 dark:text-success-foreground">
      <UserCheck class="h-5 w-5 text-success" />
      <Alert.Title>Success</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{successMsg}</Alert.Description>
    </Alert.Root>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Main Form Fields -->
    <div class="md:col-span-2 space-y-6">
      
      <!-- Customer / Agent Segment Card -->
      <Card class="bg-card !overflow-visible relative z-30">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Client Segment</CardTitle>
          <CardDescription>Select whether booking for a registered customer or an external agent.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Client Type Selection -->
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="radio" value="customer" bind:group={clientType} class="text-primary accent-primary" />
              <span>Customer</span>
            </label>
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="radio" value="agent" bind:group={clientType} class="text-primary accent-primary" />
              <span>Agent</span>
            </label>
          </div>

          <!-- Customer Head Selection Dropdown -->
          {#if clientType === 'customer'}
            <div class="space-y-1.5">
              <label for="customerHeadSelect" class="text-xs font-semibold text-muted-foreground">Select Customer Head *</label>
              <HeadSelect
                id="customerHeadSelect"
                value={headId ?? 0}
                heads={headsList}
                clientType="customer"
                loading={loadingHeads}
                required
                onchange={(val, selectedHead) => {
                  headId = val || null;
                  if (selectedHead) {
                    selectHead(selectedHead);
                  }
                }}
              />
              {#if validationErrors.headId}
                <p class="text-xs text-destructive">{validationErrors.headId[0]}</p>
              {/if}
            </div>

          {:else}
            <!-- Agent Select -->
            <div class="space-y-1.5">
              <label for="agentHeadSelect" class="text-xs font-semibold text-muted-foreground">Select Agent *</label>
              <HeadSelect
                id="agentHeadSelect"
                value={agentId ?? 0}
                heads={agentsList}
                clientType="agent"
                loading={loadingAgents}
                required
                onchange={(val, selectedAgent) => {
                  agentId = val || null;
                  if (selectedAgent) {
                    agent = `${selectedAgent.firstName || ''} ${selectedAgent.lastName || ''}`.trim();
                  } else {
                    agent = '';
                  }
                }}
              />
              {#if validationErrors.agentId}
                <p class="text-xs text-destructive">{validationErrors.agentId[0]}</p>
              {/if}
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Booking Info Card -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Booking Information</CardTitle>
          <CardDescription>Enter the service category details.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-1.5">
            <label for="serviceNameInput" class="text-xs font-semibold text-muted-foreground">Service Name *</label>
            <Input 
              id="serviceNameInput"
              placeholder="e.g. VIP Lounge, Travel Insurance, Meet & Greet" 
              bind:value={serviceName} 
              required
            />
            {#if validationErrors.serviceName}
              <p class="text-xs text-destructive">{validationErrors.serviceName[0]}</p>
            {/if}
          </div>

          <div class="space-y-1.5">
            <label for="narrationInput" class="text-xs font-semibold text-muted-foreground">Narration / Notes</label>
            <Input 
              id="narrationInput"
              placeholder="Additional service details or special requests" 
              bind:value={narration} 
            />
          </div>
        </CardContent>
      </Card>

      <!-- Applicants List Card -->
      <Card class="bg-card">
        <CardHeader class="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle class="text-base">Applicants / Beneficiaries List ({applicants.length})</CardTitle>
            <CardDescription>Enter prefix and name for each recipient of this service.</CardDescription>
          </div>
          <Button onclick={addApplicant} type="button" variant="outline" size="sm" class="gap-1.5 shadow-sm border-primary/30 text-primary hover:bg-primary/10">
            <Plus class="h-3.5 w-3.5" />
            <span>Add Applicant</span>
          </Button>
        </CardHeader>
        <CardContent class="space-y-4 divide-y divide-border">
          {#each applicants as applicant, index}
            <div class="pt-4 first:pt-0 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-primary">Applicant / Client #{index + 1}</span>
                {#if applicants.length > 1}
                  <Button onclick={() => removeApplicant(index)} type="button" variant="ghost" size="sm" class="h-7 px-2 text-destructive hover:bg-destructive/10 gap-1 text-xs">
                    <Trash2 class="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                {/if}
              </div>

              <div class="grid grid-cols-12 gap-3">
                <div class="col-span-3 sm:col-span-3 space-y-1.5">
                  <label for="prefix_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Prefix</label>
                  <select 
                    id="prefix_{index}"
                    class="w-full text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground focus:outline-none"
                    bind:value={applicant.prefix}
                  >
                    {#each prefixes as pref}
                      <option value={pref}>{pref}</option>
                    {/each}
                  </select>
                </div>

                <div class="col-span-9 sm:col-span-9 space-y-1.5">
                  <label for="name_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Applicant Name *</label>
                  <Input 
                    id="name_{index}"
                    placeholder="Full name as in ID" 
                    bind:value={applicant.name}
                    required
                  />
                  {#if validationErrors[`applicants_${index}_name`] || validationErrors[`applicants[${index}].name`] || validationErrors[`applicants[${index}].Name`]}
                    <p class="text-xs text-destructive">{validationErrors[`applicants_${index}_name`]?.[0] || validationErrors[`applicants[${index}].name`]?.[0] || validationErrors[`applicants[${index}].Name`]?.[0]}</p>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
          {#if validationErrors.name || validationErrors.applicants}
            <p class="text-xs text-destructive pt-2">{validationErrors.name?.[0] || validationErrors.applicants?.[0]}</p>
          {/if}
        </CardContent>
      </Card>
    </div>

    <!-- Right Column (Financial & Payment Panel) -->
    <div class="space-y-6">
      
      <!-- Pricing Card -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Costing & Profit</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-1.5">
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer mb-2">
              <input type="checkbox" bind:checked={isInhouse} class="accent-primary" />
              <span>In-house service</span>
            </label>
          </div>

          <div class="space-y-1.5">
            <label for="payableAmountInput" class="text-xs font-semibold text-muted-foreground">Selling Price (BHD) *</label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-xs text-muted-foreground">BHD</span>
              <Input
                id="payableAmountInput"
                type="number"
                step="0.001"
                min="0"
                class="pl-11"
                value={amount}
                oninput={(e) => amount = Number(e.currentTarget.value) || 0}
                required
              />
            </div>
            {#if validationErrors.amount}
              <p class="text-xs text-destructive">{validationErrors.amount[0]}</p>
            {/if}
          </div>

          {#if !isInhouse}
            <div class="space-y-3.5 border-t border-border pt-4">
              <!-- Supplier Select -->
              <div class="space-y-1.5">
                <label for="supplierSelect" class="text-xs font-semibold text-muted-foreground">Supplier *</label>
                <select 
                  id="supplierSelect"
                  class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none cursor-pointer"
                  value={supplierId === null ? '' : supplierId}
                  onchange={(e) => supplierId = Number(e.currentTarget.value) || null}
                  required
                >
                  <option value="">Select Supplier</option>
                  {#each suppliers as sup}
                    <option value={sup.id}>{sup.name}</option>
                  {/each}
                </select>
                {#if validationErrors.supplierId}
                  <p class="text-xs text-destructive">{validationErrors.supplierId[0]}</p>
                {/if}
              </div>

              <!-- Supplier Cost -->
              <div class="space-y-1.5">
                <label for="supplierCostInput" class="text-xs font-semibold text-muted-foreground">Supplier Cost (BHD) *</label>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-xs text-muted-foreground">BHD</span>
                  <Input
                    id="supplierCostInput"
                    type="number"
                    step="0.001"
                    min="0"
                    class="pl-11"
                    value={expectedSupplierCost}
                    oninput={(e) => expectedSupplierCost = Number(e.currentTarget.value) || 0}
                    required
                  />
                </div>
                {#if validationErrors.expectedSupplierCost}
                  <p class="text-xs text-destructive">{validationErrors.expectedSupplierCost[0]}</p>
                {/if}
              </div>

              <div class="flex items-center justify-between text-xs text-green-600 font-medium">
                <span>Calculated Profit:</span>
                <span class="font-bold font-mono">BHD {computedProfit.toFixed(3)}</span>
              </div>
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Settlement Panel -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Payment & Settlement</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <CustomerAccountWidget headId={clientType === 'customer' ? headId : agentId} headType={clientType === 'agent' ? 'Agent' : 'Customer'} />
          </div>

          <!-- Processing Status Dropdown -->
          <div class="space-y-1.5">
            <label for="bookingStatusSelect" class="text-xs font-semibold text-muted-foreground">Processing Status</label>
            <select 
              id="bookingStatusSelect"
              class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              bind:value={status}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
            {#if validationErrors.status}
              <p class="text-xs text-destructive">{validationErrors.status[0]}</p>
            {/if}
          </div>

          <!-- Form submit button -->
          <Button 
            id="submitOtherServiceBookingBtn"
            type="submit" 
            class="w-full mt-4 gap-1.5" 
            disabled={submitting || (clientType === 'customer' && !headId)}
          >
            {#if submitting}
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            {:else}
              <Save class="h-4 w-4" />
              <span>Save Booking</span>
            {/if}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</form>
