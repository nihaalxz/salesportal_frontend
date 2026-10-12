<script lang="ts">
  interface Props {
    title: string;
    description?: string;
    children?: import('svelte').Snippet;
  }

  let { title, description = '', children }: Props = $props();
</script>

<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5 mb-6">
  <div>
    <h1 class="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
    {#if description}
      <p class="text-sm text-muted-foreground mt-1.5">{description}</p>
    {/if}
  </div>
  {#if children}
    <div class="flex flex-wrap items-center gap-3">
      {@render children()}
    </div>
  {/if}
</div>
