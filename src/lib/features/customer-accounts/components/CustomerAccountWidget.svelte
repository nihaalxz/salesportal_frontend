<script lang="ts">
  import { customerAccountStore } from '../stores/customer-account-store.svelte';
  import FinancialLoadingSkeleton from './FinancialLoadingSkeleton.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { CreditCard, RefreshCw, AlertCircle } from 'lucide-svelte';

  interface Props {
    headId: number | null;
    headType?: string;
  }

  let { headId, headType = 'Customer' }: Props = $props();

  $effect(() => {
    if (headId) {
      customerAccountStore.selectHead(headId, headType, true);
    } else {
      customerAccountStore.selectHead(null);
    }
  });

  let summary = $derived(customerAccountStore.summary);
  let loading = $derived(customerAccountStore.loading);
  let error = $derived(customerAccountStore.error);
</script>

{#if headId}
  {#if loading && !summary}
    <FinancialLoadingSkeleton rows={1} />
  {:else if error}
  <Card class="bg-destructive/10 border-destructive/20 text-destructive">
    <CardContent class="p-4 flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs">
        <AlertCircle class="h-4 w-4" />
        <span>{error}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onclick={() => headId && customerAccountStore.selectHead(headId, headType, true)}
        class="h-7 text-xs gap-1 text-destructive hover:bg-destructive/20"
      >
        <RefreshCw class="h-3 w-3" />
        Retry
      </Button>
    </CardContent>
  </Card>
{:else if summary}
  <Card class="bg-card border-primary/20 shadow-sm">
    <CardHeader class="pb-2">
      <div class="flex items-center gap-2">
        <CreditCard class="h-4 w-4 text-primary" />
        <CardTitle class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Account</CardTitle>
      </div>
    </CardHeader>
    <CardContent class="space-y-2">
      <div class="flex items-baseline justify-between pt-1 border-t border-border/50">
        <span class="text-xs text-muted-foreground font-medium">Current Balance</span>
        <span class="text-lg font-extrabold tracking-tight {summary.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : summary.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}">
          {summary.balance >= 0 ? '+' : ''}{summary.balance.toFixed(3)} <span class="text-xs font-semibold text-muted-foreground">{summary.currency}</span>
        </span>
      </div>
      <p class="text-[11px] text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded border border-border/40">
        <span class="font-medium text-foreground">Note:</span> Positive balance means the customer has prepaid funds available. Negative balance means the customer currently owes the company. Creating this booking automatically updates the balance.
      </p>
    </CardContent>
  </Card>
  {/if}
{/if}
