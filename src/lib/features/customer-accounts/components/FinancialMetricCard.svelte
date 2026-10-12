<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';

  interface Props {
    title: string;
    value: string | number;
    subtitle?: string;
    currency?: string;
    variant?: 'default' | 'emerald' | 'amber' | 'red' | 'indigo';
  }

  let { title, value, subtitle, currency = 'BHD', variant = 'default' }: Props = $props();

  let formattedValue = $derived.by(() => {
    if (typeof value === 'number') {
      return `${value.toFixed(3)} ${currency}`;
    }
    return value;
  });

  let variantClasses = $derived.by(() => {
    switch (variant) {
      case 'emerald':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-900/30';
      case 'amber':
        return 'text-amber-600 dark:text-amber-400 bg-amber-500/5 border-amber-200/50 dark:border-amber-900/30';
      case 'red':
        return 'text-red-600 dark:text-red-400 bg-red-500/5 border-red-200/50 dark:border-red-900/30';
      case 'indigo':
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-200/50 dark:border-indigo-900/30';
      default:
        return 'text-foreground bg-card border-border';
    }
  });
</script>

<Card class="transition-all hover:shadow-sm border {variantClasses}">
  <CardContent class="p-4 space-y-1">
    <span class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
    <div class="text-lg font-bold tracking-tight">{formattedValue}</div>
    {#if subtitle}
      <p class="text-[11px] text-muted-foreground opacity-90">{subtitle}</p>
    {/if}
  </CardContent>
</Card>
