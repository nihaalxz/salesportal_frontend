<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import HeadSelect from '$lib/components/HeadSelect.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { lookupHeads as lookupHeadsApi } from '$lib/features/heads/api/heads-api';
  import { 
    createQuotation,
    SUPPORTED_SERVICES, 
    type QuotationItem, 
    type CreateQuotationRequest
  } from '$lib/features/quotations/api/quotation-api';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    FileSpreadsheet, 
    Plus, 
    Trash2, 
    RotateCcw, 
    Loader2, 
    AlertCircle, 
    CheckCircle2, 
    Calendar,
    FileText, 
    User, 
    Calculator,
    BookmarkCheck,
    ArrowLeft
  } from 'lucide-svelte';

  // Client Selection State
  let clientType = $state<'customer' | 'agent'>('customer');
  let headId = $state<number | null>(null);
  let customerName = $state('');
  let customerContact = $state('');
  let customerEmail = $state('');
  let remarks = $state('');

  // Dropdown options
  let headsList = $state<any[]>([]);
  let agentsList = $state<any[]>([]);
  let loadingHeads = $state(false);
  let loadingAgents = $state(false);

  // Dynamic Service Items List
  let items = $state<QuotationItem[]>([
    {
      serviceType: 'FLIGHT BOOKING',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0
    }
  ]);

  function addItem() {
    items = [
      ...items,
      {
        serviceType: 'VISA',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalAmount: 0
      }
    ];
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      items = items.filter((_, i) => i !== index);
    }
  }

  function updateItemTotal(index: number) {
    const item = items[index];
    if (item) {
      const q = Math.max(1, item.quantity || 1);
      const p = item.unitPrice || 0;
      item.totalAmount = Number((q * p).toFixed(3));
    }
  }

  // Reactive Subtotal and Net Total
  let netTotal = $derived(
    items.reduce((sum, it) => sum + (it.totalAmount > 0 ? it.totalAmount : (it.quantity * it.unitPrice)), 0)
  );

  // Status & UI feedback
  let saving = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');
  let validationErrors = $state<Record<string, string[]>>({});

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
  });

  function selectHead(head: any) {
    headId = head?.id ?? null;
  }

  function handleClientTypeChange(type: 'customer' | 'agent') {
    clientType = type;
    headId = null;
    customerName = '';
    customerContact = '';
    customerEmail = '';
  }

  function resetForm() {
    customerName = '';
    customerContact = '';
    customerEmail = '';
    remarks = '';
    headId = null;
    errorMsg = '';
    successMsg = '';
    validationErrors = {};
    items = [
      {
        serviceType: 'FLIGHT BOOKING',
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalAmount: 0
      }
    ];
  }

  function validateForm(): boolean {
    const errors: Record<string, string[]> = {};

    if (!customerName.trim()) {
      errors.customerName = ['Client / Customer Name is required.'];
    }

    if (items.length === 0) {
      errors.items = ['At least one service quotation item is required.'];
    } else {
      items.forEach((it, idx) => {
        if (!it.serviceType) {
          errors[`items_${idx}_service`] = [`Item #${idx + 1}: Service type is required.`];
        }
        if (!it.description.trim()) {
          errors[`items_${idx}_desc`] = [`Item #${idx + 1}: Description is required.`];
        }
        if (it.unitPrice < 0) {
          errors[`items_${idx}_price`] = [`Item #${idx + 1}: Unit price cannot be negative.`];
        }
      });
    }

    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleSaveQuotation() {
    errorMsg = '';
    successMsg = '';
    if (!validateForm()) return;

    saving = true;
    try {
      const payload: CreateQuotationRequest = {
        clientType,
        headId: headId || null,
        customerName: customerName.trim(),
        customerContact: customerContact.trim() || null,
        customerEmail: customerEmail.trim() || null,
        remarks: remarks.trim() || null,
        items: items.map(it => ({
          serviceType: it.serviceType,
          description: it.description.trim(),
          quantity: Math.max(1, it.quantity || 1),
          unitPrice: it.unitPrice || 0,
          totalAmount: Number((Math.max(1, it.quantity || 1) * (it.unitPrice || 0)).toFixed(3))
        }))
      };

      const result = await createQuotation(payload);
      successMsg = `Quotation ${result.documentNumber} created and saved successfully!`;
      setTimeout(() => {
        goto(`/quotations/${result.id}`);
      }, 1000);
    } catch (err: any) {
      errorMsg = err.message || 'Failed to save quotation. Please check inputs.';
    } finally {
      saving = false;
    }
  }
</script>

<PageHeader 
  title="New Quotation" 
  description="Create and record a new official price estimate quotation into the system."
>
  <div class="flex items-center gap-2">
    <Button onclick={() => goto('/quotations')} variant="outline" size="sm" class="gap-1.5 text-xs">
      <ArrowLeft class="h-3.5 w-3.5" />
      <span>Back to List</span>
    </Button>
    <Button onclick={resetForm} variant="outline" size="sm" class="gap-1.5 text-xs">
      <RotateCcw class="h-3.5 w-3.5" />
      <span>Reset</span>
    </Button>
    <Button 
      onclick={handleSaveQuotation} 
      variant="default" 
      size="sm" 
      class="gap-1.5 text-xs shadow-md bg-teal-600 hover:bg-teal-700 text-white" 
      disabled={saving}
    >
      {#if saving}
        <Loader2 class="h-3.5 w-3.5 animate-spin" />
        <span>Saving...</span>
      {:else}
        <BookmarkCheck class="h-3.5 w-3.5" />
        <span>Save Quotation</span>
      {/if}
    </Button>
  </div>
</PageHeader>

<div class="w-full space-y-6">
  {#if errorMsg}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-5 w-5" />
      <Alert.Title>Validation Error</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{errorMsg}</Alert.Description>
    </Alert.Root>
  {/if}

  {#if successMsg}
    <Alert.Root class="border-success/30 bg-success/10 text-success dark:border-success/20 dark:bg-success/5 dark:text-success-foreground">
      <CheckCircle2 class="h-5 w-5 text-success" />
      <Alert.Title>Success</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{successMsg}</Alert.Description>
    </Alert.Root>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    
    <!-- Left 2 Cols: Client & Line Items -->
    <div class="lg:col-span-2 space-y-6">
      
      <!-- Client / Recipient Information -->
      <Card class="bg-card !overflow-visible relative z-30">
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <User class="h-4 w-4 text-teal-600" />
            <span>Client / Recipient Selection</span>
          </CardTitle>
          <CardDescription>Select client segment and choose registered customer head or enter details.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Segment Radio Switch -->
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input 
                type="radio" 
                name="clientTypeRadio" 
                value="customer" 
                checked={clientType === 'customer'} 
                onchange={() => handleClientTypeChange('customer')} 
                class="text-teal-600 accent-teal-600" 
              />
              <span>Customer</span>
            </label>
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input 
                type="radio" 
                name="clientTypeRadio" 
                value="agent" 
                checked={clientType === 'agent'} 
                onchange={() => handleClientTypeChange('agent')} 
                class="text-teal-600 accent-teal-600" 
              />
              <span>Agent</span>
            </label>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Searchable Head Dropdown -->
            <div class="space-y-1.5 sm:col-span-2">
              <label for="headSelectBox" class="text-xs font-semibold text-muted-foreground">
                Select {clientType === 'customer' ? 'Customer' : 'Agent'} Profile (Optional)
              </label>
              <HeadSelect
                id="headSelectBox"
                value={headId ?? 0}
                heads={clientType === 'customer' ? headsList : agentsList}
                clientType={clientType}
                loading={clientType === 'customer' ? loadingHeads : loadingAgents}
                onchange={(val) => {
                  headId = val || null;
                }}
              />
            </div>

            <!-- Client Name Input -->
            <div class="space-y-1.5 sm:col-span-2">
              <label for="clientNameInput" class="text-xs font-semibold text-muted-foreground">
                Recipient / Client Name *
              </label>
              <Input 
                id="clientNameInput" 
                placeholder="e.g. John Doe, ABC Enterprises" 
                bind:value={customerName} 
                required 
              />
              {#if validationErrors.customerName}
                <p class="text-xs text-destructive">{validationErrors.customerName[0]}</p>
              {/if}
            </div>

            <!-- Contact Number Input -->
            <div class="space-y-1.5">
              <label for="contactInput" class="text-xs font-semibold text-muted-foreground">
                Contact Number (Optional)
              </label>
              <Input 
                id="contactInput" 
                placeholder="+973 3xxxxxxx" 
                bind:value={customerContact} 
              />
            </div>

            <!-- Email Address Input -->
            <div class="space-y-1.5">
              <label for="emailInput" class="text-xs font-semibold text-muted-foreground">
                Email Address (Optional)
              </label>
              <Input 
                id="emailInput" 
                type="email" 
                placeholder="client@example.com" 
                bind:value={customerEmail} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Quotation Line Items Table -->
      <Card class="bg-card">
        <CardHeader class="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle class="text-base flex items-center gap-2">
              <FileSpreadsheet class="h-4 w-4 text-teal-600" />
              <span>Quotation Services & Items ({items.length})</span>
            </CardTitle>
            <CardDescription>Select service from the 6 core categories, add description, quantity, and price.</CardDescription>
          </div>
          <Button 
            onclick={addItem} 
            type="button" 
            variant="outline" 
            size="sm" 
            class="gap-1.5 shadow-sm border-teal-600/30 text-teal-700 dark:text-teal-400 hover:bg-teal-500/10 text-xs"
          >
            <Plus class="h-3.5 w-3.5" />
            <span>Add Service</span>
          </Button>
        </CardHeader>
        <CardContent class="space-y-4 divide-y divide-border">
          {#each items as item, index}
            <div class="pt-4 first:pt-0 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-teal-700 dark:text-teal-400">Item #{index + 1}</span>
                {#if items.length > 1}
                  <Button 
                    onclick={() => removeItem(index)} 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    class="h-7 px-2 text-destructive hover:bg-destructive/10 gap-1 text-xs"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                {/if}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                
                <!-- Service Dropdown (4 Cols) -->
                <div class="sm:col-span-4 space-y-1.5">
                  <label for="serviceType_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">
                    Service Category *
                  </label>
                  <select
                    id="serviceType_{index}"
                    class="w-full text-xs bg-background border border-border rounded px-2.5 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer font-medium"
                    bind:value={item.serviceType}
                  >
                    {#each SUPPORTED_SERVICES as srv}
                      <option value={srv.id}>{srv.label}</option>
                    {/each}
                  </select>
                  {#if validationErrors[`items_${index}_service`]}
                    <p class="text-[11px] text-destructive">{validationErrors[`items_${index}_service`][0]}</p>
                  {/if}
                </div>

                <!-- Quantity (2 Cols) -->
                <div class="sm:col-span-2 space-y-1.5">
                  <label for="qty_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">
                    Qty *
                  </label>
                  <Input 
                    id="qty_{index}"
                    type="number"
                    min="1"
                    step="1"
                    bind:value={item.quantity}
                    oninput={() => updateItemTotal(index)}
                    required
                  />
                </div>

                <!-- Unit Price (3 Cols) -->
                <div class="sm:col-span-3 space-y-1.5">
                  <label for="rate_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">
                    Rate (BHD) *
                  </label>
                  <div class="relative">
                    <span class="absolute left-2.5 top-2 text-[10px] text-muted-foreground">BHD</span>
                    <Input 
                      id="rate_{index}"
                      type="number"
                      min="0"
                      step="0.001"
                      class="pl-10 text-xs font-mono"
                      bind:value={item.unitPrice}
                      oninput={() => updateItemTotal(index)}
                      required
                    />
                  </div>
                  {#if validationErrors[`items_${index}_price`]}
                    <p class="text-[11px] text-destructive">{validationErrors[`items_${index}_price`][0]}</p>
                  {/if}
                </div>

                <!-- Line Total (3 Cols) -->
                <div class="sm:col-span-3 space-y-1.5">
                  <label for="total_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">
                    Amount (BHD)
                  </label>
                  <div class="h-9 px-3 bg-muted/40 border border-border rounded flex items-center justify-end font-mono text-xs font-bold text-teal-700 dark:text-teal-400">
                    BHD {(item.quantity * item.unitPrice).toFixed(3)}
                  </div>
                </div>

                <!-- Description (12 Cols) -->
                <div class="sm:col-span-12 space-y-1.5">
                  <label for="desc_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">
                    Item Narration / Details *
                  </label>
                  <textarea
                    id="desc_{index}"
                    rows="2"
                    placeholder="Enter itinerary details, flight route, hotel name, visa type, or passenger notes..."
                    class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-teal-600 resize-y"
                    bind:value={item.description}
                    required
                  ></textarea>
                  {#if validationErrors[`items_${index}_desc`]}
                    <p class="text-[11px] text-destructive">{validationErrors[`items_${index}_desc`][0]}</p>
                  {/if}
                </div>

              </div>
            </div>
          {/each}
        </CardContent>
      </Card>
    </div>

    <!-- Right Col: Summary & Actions -->
    <div class="space-y-6">

      <!-- Totals & Summary Card -->
      <Card class="bg-card border-teal-600/30">
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center justify-between">
            <span class="flex items-center gap-2">
              <Calculator class="h-4 w-4 text-teal-600" />
              <span>Quotation Total</span>
            </span>
            <span class="text-xs font-mono font-normal text-muted-foreground">
              {items.length} {items.length === 1 ? 'Service' : 'Services'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="bg-muted/40 rounded-lg p-4 space-y-2.5">
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>Subtotal:</span>
              <span class="font-mono">BHD {netTotal.toFixed(3)}</span>
            </div>
            <div class="border-t border-border pt-2 flex items-center justify-between">
              <span class="text-sm font-bold text-foreground">Net Estimate:</span>
              <span class="text-base font-bold font-mono text-teal-700 dark:text-teal-400">
                BHD {netTotal.toFixed(3)}
              </span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="pt-2 space-y-2">
            <Button 
              onclick={handleSaveQuotation} 
              type="button" 
              class="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-md font-medium cursor-pointer" 
              disabled={saving}
            >
              {#if saving}
                <Loader2 class="h-4 w-4 animate-spin" />
                <span>Saving to Database...</span>
              {:else}
                <BookmarkCheck class="h-4 w-4" />
                <span>Save Quotation</span>
              {/if}
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  </div>
</div>
