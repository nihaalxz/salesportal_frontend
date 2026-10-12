<script lang="ts">
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import HeadSelect from '$lib/components/HeadSelect.svelte';
  import { lookupHeads } from '$lib/features/heads/api/heads-api';
  import { createReceipt, getBanks } from '$lib/features/receipts/api/receipts-api';
  import type { BankResponse } from '$lib/features/receipts/api/receipts-api';
  import { customerAccountStore } from '$lib/features/customer-accounts/stores/customer-account-store.svelte';
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    ChevronLeft, 
    Wallet,
    Loader2,
    Save,
    AlertCircle,
    Receipt as ReceiptIcon
  } from 'lucide-svelte';

  // Form State
  let clientType = $state('customer');
  let selectedHeadId = $state<number>(0);
  let selectedHead = $state<any>(null);
  let headsList = $state<any[]>([]);
  let searchingHeads = $state(false);

  let amount = $state<number>(0);
  let paymentMode = $state('cash'); // cash, online
  let selectedBankId = $state<number>(0);
  let selectedBankName = $state('');
  let narration = $state('');
  let paymentProof = $state<string | null>(null);
  let paymentProofFile = $state<File | null>(null);

  function handlePaymentProofChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      paymentProofFile = file;
      const reader = new FileReader();
      reader.onload = (event) => {
        paymentProof = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      paymentProofFile = null;
      paymentProof = null;
    }
  }

  let banks = $state<BankResponse[]>([]);
  let submitting = $state(false);
  let submitError = $state<string | null>(null);
  let validationErrors = $state<Record<string, string[]>>({});

  // Load banks on init
  $effect(() => {
    getBanks().then(res => {
      banks = res;
    }).catch(err => {
      console.error('Failed to load banks', err);
    });
  });

  // Search heads filtered by clientType
  async function searchHeads(term: string) {
    searchingHeads = true;
    try {
      headsList = await lookupHeads(term, 100, clientType);
    } catch (err) {
      console.error(err);
    } finally {
      searchingHeads = false;
    }
  }

  // Load heads on init & clientType change
  $effect(() => {
    const _ = clientType;
    selectedHeadId = 0;
    selectedHead = null;
    searchHeads('');
  });

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    submitError = null;
    validationErrors = {};

    try {
      const payload = {
        headId: selectedHeadId > 0 ? selectedHeadId : null,
        clientType,
        agentName: clientType === 'agent' && selectedHead ? `${selectedHead.firstName} ${selectedHead.lastName}` : null,
        narration: narration.trim() || 'Balance Deposit',
        service: 'deposit',
        bookingId: null,
        amount,
        paymentMode,
        bankId: paymentMode === 'online' && selectedBankId > 0 ? selectedBankId : null,
        bankName: paymentMode === 'online' ? selectedBankName : null,
        paymentProof
      };

      const res = await createReceipt(payload);
      if (selectedHeadId > 0) customerAccountStore.invalidate(selectedHeadId);
      goto(`/receipts/${res.id}`);
    } catch (err: any) {
      if (err.status === 422 && err.errors) {
        validationErrors = err.errors;
      } else {
        submitError = err.detail || err.message || err.title || 'Failed to record payment receipt.';
      }
    } finally {
      submitting = false;
    }
  }
</script>

<PageHeader title="New Payment Receipt" description="Log a balance deposit received from a customer or agency account.">
  <Button onclick={() => goto('/receipts')} variant="outline" size="sm" class="gap-1.5">
    <ChevronLeft class="h-4 w-4" />
    <span>Back to List</span>
  </Button>
</PageHeader>

<form onsubmit={handleSubmit} class="w-full space-y-6">
  {#if submitError}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-5 w-5" />
      <Alert.Title>Submission Error</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{submitError}</Alert.Description>
    </Alert.Root>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Left Column (Customer Identification) -->
    <div class="md:col-span-2 space-y-6">
      
      <!-- Customer / Agent Identification Card -->
      <Card class="bg-card !overflow-visible relative z-30">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Account Head Identification</CardTitle>
          <CardDescription>Select the customer account or agency account who made the payment.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-1.5">
            <span class="text-xs font-semibold text-muted-foreground">Client Type *</span>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input type="radio" value="customer" bind:group={clientType} class="text-primary accent-primary" />
                <span>Customer</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input type="radio" value="agent" bind:group={clientType} class="text-primary accent-primary" />
                <span>Agent</span>
              </label>
            </div>
          </div>

          <div class="space-y-1.5">
            <label for="customerHeadSelect" class="text-xs font-semibold text-muted-foreground">
              {clientType === 'agent' ? 'Select Agent *' : 'Select Customer *'}
            </label>
            <HeadSelect
              id="customerHeadSelect"
              bind:value={selectedHeadId}
              heads={headsList}
              {clientType}
              loading={searchingHeads}
              required
              onchange={(newId, head) => {
                selectedHeadId = newId;
                selectedHead = head;
              }}
            />
            {#if validationErrors.headId}
              <p class="text-xs text-destructive">{validationErrors.headId[0]}</p>
            {/if}
          </div>

          {#if selectedHead}
            <div class="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary font-semibold w-fit">
              <Wallet class="h-4 w-4 shrink-0 text-primary" />
              <span>Current Account Balance: <MoneyDisplay amount={selectedHead.balance ?? selectedHead.wallet} currency="BHD" /></span>
            </div>
          {/if}
        </CardContent>
      </Card>

    </div>

    <!-- Right Column (Financial & Payment Execution Panel) -->
    <div class="space-y-6">
      
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Payment Execution</CardTitle>
          <CardDescription>Submit received amount and payment method.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-1.5">
            <label for="amountInput" class="text-xs font-semibold text-muted-foreground">Received Amount (BHD) *</label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-xs text-muted-foreground">BHD</span>
              <Input
                id="amountInput"
                type="number"
                step="0.001"
                min="0.001"
                class="pl-11 font-mono text-base font-bold"
                value={amount}
                oninput={(e) => amount = Number(e.currentTarget.value) || 0}
                required
              />
            </div>
          </div>

          <!-- Payment Mode -->
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground block">Payment Method *</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="radio" value="cash" bind:group={paymentMode} class="text-primary accent-primary" />
                <span>Cash</span>
              </label>
              <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input type="radio" value="online" bind:group={paymentMode} class="text-primary accent-primary" />
                <span>Online Bank Deposit</span>
              </label>
            </div>
          </div>

          <!-- Receiving Bank Select if Online -->
          {#if paymentMode === 'online'}
            <div class="space-y-1.5 pt-1">
              <label for="bankSelect" class="text-xs font-semibold text-muted-foreground">Receiving Bank *</label>
              <select 
                id="bankSelect" 
                value={selectedBankId} 
                onchange={(e) => {
                  selectedBankId = parseInt(e.currentTarget.value, 10);
                  const bank = banks.find(b => b.id === selectedBankId);
                  selectedBankName = bank ? bank.bankName : '';
                }}
                class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none font-semibold cursor-pointer" 
                required
              >
                <option value={0}>-- Select Bank Account --</option>
                {#each banks as b}
                  <option value={b.id}>{b.bankName} ({b.accountNumber})</option>
                {/each}
              </select>
            </div>
          {/if}

          <!-- Payment Proof Upload -->
          <div class="space-y-1.5 pt-2 border-t border-border">
            <label for="paymentProofInput" class="text-xs font-semibold text-muted-foreground">Payment Proof (Optional)</label>
            <input
              id="paymentProofInput"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              class="w-full text-xs bg-background border border-border rounded px-3 py-1.5 text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
              onchange={handlePaymentProofChange}
            />
            {#if paymentProofFile}
              <p class="text-[10px] text-muted-foreground font-semibold">Selected: {paymentProofFile.name}</p>
            {/if}
          </div>

          <div class="space-y-1.5">
            <label for="narrationInput" class="text-xs font-semibold text-muted-foreground">Narration / Notes</label>
            <textarea
              id="narrationInput"
              rows="2"
              bind:value={narration}
              placeholder="Add optional payment details..."
              class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none"
            ></textarea>
          </div>
        </CardContent>
      </Card>

      <!-- Pre-submit Summary Box -->
      {#if selectedHead && amount > 0}
        <Card class="border-primary/30 bg-primary/5">
          <CardHeader class="pb-2">
            <CardTitle class="text-xs font-bold uppercase tracking-wider text-primary">Receipt Summary</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2 text-xs">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <span class="text-[10px] text-muted-foreground block">Head</span>
                <span class="font-bold text-foreground">{selectedHead.firstName} {selectedHead.lastName}</span>
              </div>
              <div>
                <span class="text-[10px] text-muted-foreground block">Receipt Amount</span>
                <span class="font-mono font-bold text-emerald-600"><MoneyDisplay amount={amount} currency="BHD" /></span>
              </div>
              <div>
                <span class="text-[10px] text-muted-foreground block">Method</span>
                <span class="font-semibold capitalize text-foreground">{paymentMode}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Submit Button -->
      <Button 
        type="submit" 
        class="w-full gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" 
        disabled={submitting || amount <= 0 || !selectedHeadId}
      >
        {#if submitting}
          <Loader2 class="h-4 w-4 animate-spin" />
          <span>Submitting...</span>
        {:else}
          <Save class="h-4 w-4" />
          <span>Save Receipt</span>
        {/if}
      </Button>

    </div>
  </div>
</form>
