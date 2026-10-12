<script lang="ts">
  interface Props {
    balance: number;
    currency?: string;
    class?: string;
  }

  let { balance, currency = 'BHD', class: className = '' }: Props = $props();

  let formatted = $derived.by(() => {
    const val = Math.abs(balance).toFixed(3);
    if (balance > 0) return `+${val} ${currency}`;
    if (balance < 0) return `-${val} ${currency}`;
    return `0.000 ${currency}`;
  });

  let statusLabel = $derived.by(() => {
    return 'Balance';
  });

  let badgeVariantClass = $derived.by(() => {
    if (balance > 0) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50';
    }
    if (balance < 0) {
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50';
    }
    return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800';
  });
</script>

<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium tracking-tight transition-colors {badgeVariantClass} {className}">
  <span class="inline-block w-1.5 h-1.5 rounded-full {balance > 0 ? 'bg-emerald-500' : balance < 0 ? 'bg-red-500' : 'bg-zinc-400'}"></span>
  <span class="opacity-80 font-normal">{statusLabel}:</span>
  <span class="font-bold">{formatted}</span>
</div>
