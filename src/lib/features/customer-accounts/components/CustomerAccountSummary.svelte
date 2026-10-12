<script lang="ts">
  import type { CustomerAccountSummaryResponse, CustomerApplicationReceivableSummary } from '../types/customer-account-types';
  import CustomerBalanceBadge from './CustomerBalanceBadge.svelte';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Clock } from 'lucide-svelte';

  interface Props {
    summary: CustomerAccountSummaryResponse;
    applications?: CustomerApplicationReceivableSummary | null;
  }

  let { summary, applications = null }: Props = $props();

  let openApps = $derived(applications?.items ?? []);

  let formattedLastActivity = $derived.by(() => {
    if (!summary.lastUpdated) return 'No recent updates';
    try {
      return new Date(summary.lastUpdated).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return summary.lastUpdated;
    }
  });

  let balanceStatusText = $derived.by(() => {
    if (summary.balance > 0) return 'Texas Travels holds prepaid funds for this account.';
    if (summary.balance < 0) return 'Customer owes this outstanding balance to Texas Travels.';
    return 'Account is fully settled (Net Zero balance).';
  });

  let badgeLabel = $derived.by(() => {
    if (summary.balance > 0) return 'Balance (+)';
    if (summary.balance < 0) return 'Balance (-)';
    return 'Net Zero (Settled)';
  });

  let badgeClass = $derived.by(() => {
    if (summary.balance > 0) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    if (summary.balance < 0) return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
    return 'bg-muted text-muted-foreground border border-border';
  });
</script>

<div class="space-y-6">
  <!-- Top Account Header -->
  <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-border rounded-lg shadow-sm">
    <div class="space-y-0.5">
      <div class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Head</div>
      <div class="text-base font-bold text-foreground">{summary.headName} ({summary.headType})</div>
    </div>
    <CustomerBalanceBadge balance={summary.balance} currency={summary.currency} />
  </div>

  <!-- Hero One Financial Truth Balance Card -->
  <Card class="border-border bg-card shadow-sm relative overflow-hidden">
    <div class="absolute top-0 right-0 w-36 h-36 -mr-8 -mt-8 rounded-full opacity-10 pointer-events-none {summary.balance > 0 ? 'bg-emerald-500' : summary.balance < 0 ? 'bg-red-500' : 'bg-zinc-500'}"></div>
    <CardContent class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Balance</span>
        <span class="px-3 py-1 text-xs font-bold rounded-full {badgeClass}">
          {badgeLabel}
        </span>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
        <div>
          <div class="text-4xl font-extrabold tracking-tight font-mono {summary.balance > 0 ? 'text-emerald-600 dark:text-emerald-400' : summary.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}">
            {summary.balance >= 0 ? '+' : ''}{summary.balance.toFixed(3)} <span class="text-base font-semibold text-muted-foreground">{summary.currency}</span>
          </div>
          <p class="text-xs text-muted-foreground font-medium mt-1">{balanceStatusText}</p>
        </div>

        <div class="text-xs text-muted-foreground font-medium flex items-center gap-1.5 self-start sm:self-auto">
          <Clock class="w-3.5 h-3.5" />
          <span>Last Activity: <strong class="text-foreground">{formattedLastActivity}</strong></span>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
