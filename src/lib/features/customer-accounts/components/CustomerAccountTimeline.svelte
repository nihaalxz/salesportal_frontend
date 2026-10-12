<script lang="ts">
  import type { AccountTimelineItemResponse } from '../types/customer-account-types';
  import { getTransactionVisualConfig } from '../utils/transaction-type-mapper';
  import EmptyFinancialState from './EmptyFinancialState.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { History } from 'lucide-svelte';

  interface Props {
    timeline: AccountTimelineItemResponse[];
    limit?: number;
  }

  let { timeline, limit }: Props = $props();

  let displayedItems = $derived.by(() => {
    if (limit && limit > 0) return timeline.slice(0, limit);
    return timeline;
  });
</script>

<Card class="bg-card border-border">
  <CardHeader class="pb-3 flex flex-row items-center justify-between">
    <div class="flex items-center gap-2">
      <History class="h-4 w-4 text-primary" />
      <CardTitle class="text-sm font-bold">Financial Audit Stream</CardTitle>
    </div>
    <span class="text-xs text-muted-foreground">{timeline.length} Transactions</span>
  </CardHeader>

  <CardContent class="space-y-3">
    {#if timeline.length === 0}
      <EmptyFinancialState
        title="No Timeline Entries"
        description="There are no audit records recorded for this customer account."
      />
    {:else}
      <div class="space-y-2 divide-y divide-border">
        {#each displayedItems as item}
          {@const visual = getTransactionVisualConfig(item.eventType || item.serviceType)}
          <div class="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
            <div class="space-y-0.5 min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border {visual.badgeClass}">
                  {visual.label}
                </span>
                <span class="font-mono text-[10px] text-muted-foreground truncate">{item.referenceNumber}</span>
              </div>
              <p class="text-muted-foreground truncate">{item.description ? item.description.replace(/\s*\((?:Credit\s+Facility|CreditFacility)\)/gi, '').trim() : '-'}</p>
              <span class="text-[10px] text-muted-foreground">{new Date(item.transactionDate).toLocaleString()}</span>
            </div>

            <div class="text-right space-y-0.5">
              {#if item.debit > 0}
                <div class="font-bold text-red-600 dark:text-red-400">-{item.debit.toFixed(3)} BHD</div>
              {:else if item.credit > 0}
                <div class="font-bold text-emerald-600 dark:text-emerald-400">+{item.credit.toFixed(3)} BHD</div>
              {/if}
              <div class="text-[10px] text-muted-foreground font-medium">Bal: {item.runningBalance.toFixed(3)} BHD</div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </CardContent>
</Card>
