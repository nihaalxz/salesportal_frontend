<script lang="ts">
  let { children } = $props();
</script>

<!-- Login route uses a standalone layout — no sidebar, no header -->
{@render children()}
