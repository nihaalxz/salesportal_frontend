<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import CustomerAccountSummary from '$lib/features/customer-accounts/components/CustomerAccountSummary.svelte';
  import CustomerAccountStatementTable from '$lib/features/customer-accounts/components/CustomerAccountStatementTable.svelte';
  import FinancialLoadingSkeleton from '$lib/features/customer-accounts/components/FinancialLoadingSkeleton.svelte';
  import { customerAccountStore } from '$lib/features/customer-accounts/stores/customer-account-store.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { ChevronLeft, RefreshCw, AlertCircle, Printer } from 'lucide-svelte';

  let headId = $derived(parseInt($page.params.headId ?? '0', 10));

  $effect(() => {
    if (headId) {
      customerAccountStore.loadStatement(headId);
      customerAccountStore.loadApplications(headId);
    }
  });

  let statement = $derived(customerAccountStore.statement);
  let applications = $derived(customerAccountStore.applications);
  let loading = $derived(customerAccountStore.loading);
  let error = $derived(customerAccountStore.error);

  function handlePrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
</script>

<PageHeader title="Customer Account Statement" description="Official financial statement of account and audit ledger.">
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" onclick={() => goto(`/heads/${headId}`)} class="gap-1.5">
      <ChevronLeft class="h-4 w-4" />
      <span>Back to Profile</span>
    </Button>
    <Button variant="outline" size="sm" onclick={handlePrint} class="gap-1.5">
      <Printer class="h-4 w-4" />
      <span>Print Statement</span>
    </Button>
  </div>
</PageHeader>

<div class="space-y-6">
  {#if loading && !statement}
    <FinancialLoadingSkeleton rows={5} />
  {:else if error}
    <Card class="bg-destructive/10 border-destructive/20 text-destructive">
      <CardContent class="p-6 text-center space-y-3">
        <div class="flex items-center justify-center gap-2 font-bold">
          <AlertCircle class="h-5 w-5" />
          <span>Statement Error</span>
        </div>
        <p class="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onclick={() => customerAccountStore.loadStatement(headId, true)} class="gap-1.5">
          <RefreshCw class="h-4 w-4" />
          <span>Retry</span>
        </Button>
      </CardContent>
    </Card>
  {:else if statement}
    <CustomerAccountSummary summary={statement.summary} {applications} />
    <CustomerAccountStatementTable timeline={statement.timeline} />
  {/if}
</div>
