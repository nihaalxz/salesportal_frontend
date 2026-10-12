<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Zap } from 'lucide-svelte';

  interface Props {
    totalPurchasingPower: number;
    availableBalance: number;
    availableCredit: number;
    currency?: string;
  }

  let {
    totalPurchasingPower,
    availableBalance,
    availableCredit,
    currency = 'BHD'
  }: Props = $props();
</script>

<Card class="bg-gradient-to-br from-indigo-500/10 via-primary/5 to-background border-primary/20">
  <CardContent class="p-4 space-y-2">
    <div class="flex items-center justify-between">
      <span class="text-xs font-semibold text-primary flex items-center gap-1.5 uppercase tracking-wider">
        <Zap class="h-3.5 w-3.5 text-primary fill-primary/20" />
        Total Purchasing Power
      </span>
      <span class="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Active Facility</span>
    </div>

    <div class="text-2xl font-extrabold text-foreground tracking-tight">
      {totalPurchasingPower.toFixed(3)} <span class="text-sm font-semibold text-muted-foreground">{currency}</span>
    </div>

    <div class="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-xs">
      <div>
        <span class="text-[10px] text-muted-foreground block">Prepaid Funds</span>
        <span class="font-bold text-emerald-600 dark:text-emerald-400">+{availableBalance.toFixed(3)} {currency}</span>
      </div>
      <div>
        <span class="text-[10px] text-muted-foreground block">Available Credit</span>
        <span class="font-bold text-indigo-600 dark:text-indigo-400">+{availableCredit.toFixed(3)} {currency}</span>
      </div>
    </div>
  </CardContent>
</Card>
