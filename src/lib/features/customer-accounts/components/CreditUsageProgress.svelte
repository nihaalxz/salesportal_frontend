<script lang="ts">
  interface Props {
    creditUsed: number;
    creditLimit: number;
    currency?: string;
  }

  let { creditUsed, creditLimit, currency = 'BHD' }: Props = $props();

  let percentage = $derived.by(() => {
    if (creditLimit <= 0) return 0;
    return Math.min(100, Math.max(0, (creditUsed / creditLimit) * 100));
  });

  let progressColor = $derived.by(() => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-amber-500';
    return 'bg-indigo-500';
  });
</script>

<div class="space-y-1.5">
  <div class="flex items-center justify-between text-xs">
    <span class="text-muted-foreground font-medium">Credit Facility Utilization</span>
    <span class="font-bold text-foreground">{percentage.toFixed(1)}%</span>
  </div>

  <div class="h-2 w-full bg-muted rounded-full overflow-hidden">
    <div
      class="h-full transition-all duration-500 rounded-full {progressColor}"
      style="width: {percentage}%"
    ></div>
  </div>

  <div class="flex items-center justify-between text-[10px] text-muted-foreground">
    <span>Used: {creditUsed.toFixed(3)} {currency}</span>
    <span>Limit: {creditLimit.toFixed(3)} {currency}</span>
  </div>
</div>
