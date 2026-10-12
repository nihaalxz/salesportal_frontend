<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';
  import { FileClock } from 'lucide-svelte';

  interface Props {
    outstandingReceivables: number;
    openReceivablesCount?: number;
    currency?: string;
  }

  let { outstandingReceivables, openReceivablesCount = 0, currency = 'BHD' }: Props = $props();
</script>

<Card class="bg-card border-border">
  <CardContent class="p-4 space-y-1">
    <div class="flex items-center justify-between">
      <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <FileClock class="h-3.5 w-3.5 text-amber-500" />
        Outstanding Applications
      </span>
      {#if openReceivablesCount > 0}
        <span class="text-[10px] bg-amber-500/10 text-amber-600 font-bold px-2 py-0.5 rounded-full">
          {openReceivablesCount} Open
        </span>
      {/if}
    </div>

    <div class="text-lg font-bold tracking-tight text-amber-600 dark:text-amber-400">
      {outstandingReceivables.toFixed(3)} <span class="text-xs text-muted-foreground font-normal">{currency}</span>
    </div>
    <p class="text-[11px] text-muted-foreground">Unsettled booking receivables awaiting collection.</p>
  </CardContent>
</Card>
