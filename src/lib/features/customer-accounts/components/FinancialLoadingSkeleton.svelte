<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';

  interface Props {
    rows?: number;
  }

  let { rows = 3 }: Props = $props();
</script>

<div class="space-y-4 animate-pulse">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {#each Array(rows) as _}
      <Card class="bg-card/50 border-border/50">
        <CardContent class="p-4 space-y-3">
          <div class="h-3 w-24 bg-muted rounded"></div>
          <div class="h-6 w-32 bg-muted rounded"></div>
          <div class="h-2 w-16 bg-muted/60 rounded"></div>
        </CardContent>
      </Card>
    {/each}
  </div>
</div>
