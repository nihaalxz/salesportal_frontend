<script lang="ts">
  import { WalletCards } from 'lucide-svelte';

  interface Props {
    title?: string;
    description?: string;
  }

  let {
    title = 'No Financial Activity Recorded',
    description = 'This customer has no balance transactions or open receivables.'
  }: Props = $props();
</script>

<div class="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg bg-card/40 my-4 space-y-3">
  <div class="p-3 bg-muted/30 rounded-full text-muted-foreground">
    <WalletCards class="h-6 w-6" />
  </div>
  <div class="space-y-1">
    <h4 class="text-sm font-semibold text-foreground">{title}</h4>
    <p class="text-xs text-muted-foreground max-w-sm">{description}</p>
  </div>
</div>
