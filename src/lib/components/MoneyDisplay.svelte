<script lang="ts">
  import { formatMoney } from '$lib/formatters/money';

  interface Props {
    amount: number | string | null | undefined;
    currency?: string;
    class?: string;
  }

  let { amount, currency = 'BHD', class: className = '' }: Props = $props();
</script>

<span class="font-mono font-medium tracking-tight tabular-nums {className}">
  {formatMoney(amount, currency)}
</span>
