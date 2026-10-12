<script lang="ts">
  import { onMount } from 'svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { getBookingProfit, type SalesmanProfitRecord } from '$lib/features/profit/api/profit-api';
  import { ShieldCheck, Clock, AlertTriangle, Building, CheckCircle2 } from 'lucide-svelte';

  interface Props {
    bookingType: string;
    bookingId: number | string;
    fallbackProfit?: number;
    class?: string;
  }

  let { bookingType, bookingId, fallbackProfit = 0, class: className = '' }: Props = $props();

  let profitRecord = $state<SalesmanProfitRecord | null>(null);
  let loading = $state(true);

  onMount(async () => {
    if (bookingType && bookingId) {
      profitRecord = await getBookingProfit(bookingType, bookingId);
    }
    loading = false;
  });

  const displayProfit = $derived(
    profitRecord ? profitRecord.profitAmount : fallbackProfit
  );

  const isFinal = $derived(profitRecord?.isFinal ?? false);
  const costSource = $derived(profitRecord?.supplierCostSource ?? 'Estimated');
  const profitType = $derived(profitRecord?.profitType ?? 'Normal');
</script>

<div class="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md {className}">
  <div class="flex items-center justify-between gap-2 mb-2">
    <div class="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      <ShieldCheck class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <span>Authoritative Profit</span>
    </div>
    {#if loading}
      <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground animate-pulse">
        Checking ledger...
      </span>
    {:else if isFinal}
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 class="h-3 w-3" />
        <span>Settled</span>
      </span>
    {:else if profitType === 'Inhouse'}
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <Building class="h-3 w-3" />
        <span>In-house</span>
      </span>
    {:else if profitType === 'Rejection'}
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertTriangle class="h-3 w-3" />
        <span>Rejection Fee</span>
      </span>
    {:else}
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <Clock class="h-3 w-3" />
        <span>Estimated</span>
      </span>
    {/if}
  </div>

  <div class="flex items-baseline justify-between mt-1">
    <span class="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
      <MoneyDisplay amount={displayProfit} />
    </span>
    {#if profitRecord?.accountsApprovedTotal !== undefined && profitRecord.accountsApprovedTotal !== null}
      <span class="text-xs text-muted-foreground font-mono">
        Supplier Payment: <strong class="text-foreground"><MoneyDisplay amount={profitRecord.accountsApprovedTotal} /></strong>
      </span>
    {/if}
  </div>

  <div class="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
    <span>Cost Source: <strong class="text-foreground font-medium">{costSource}</strong></span>
    {#if profitRecord?.finalizedAt}
      <span>Settled: {new Date(profitRecord.finalizedAt).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
    {:else}
      <span>Pending Accounts Approval</span>
    {/if}
  </div>
</div>
