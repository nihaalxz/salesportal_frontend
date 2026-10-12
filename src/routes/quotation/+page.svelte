<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/quotations', { replaceState: true });
  });
</script>

<div class="flex items-center justify-center p-12 text-sm text-muted-foreground">
  Redirecting to Quotation Generator...
</div>
