<script lang="ts">
  import { customerAccountStore } from '../stores/customer-account-store.svelte';
  import CustomerAccountSummary from './CustomerAccountSummary.svelte';
  import CustomerAccountTimeline from './CustomerAccountTimeline.svelte';
  import FinancialLoadingSkeleton from './FinancialLoadingSkeleton.svelte';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { RefreshCw, AlertCircle, FileText } from 'lucide-svelte';

  interface Props {
    headId: number;
    headType?: string;
  }

  let { headId, headType = 'Customer' }: Props = $props();

  $effect(() => {
    if (headId) {
      customerAccountStore.selectHead(headId, headType, true);
      customerAccountStore.loadApplications(headId, headType, true);
      customerAccountStore.loadTimeline(headId, true);
    }
  });

  let summary = $derived(customerAccountStore.summary);
  let applications = $derived(customerAccountStore.applications);
  let timeline = $derived(customerAccountStore.timeline);
  let loading = $derived(customerAccountStore.loading);
  let error = $derived(customerAccountStore.error);
</script>

<div class="space-y-6">
  {#if loading && !summary}
    <FinancialLoadingSkeleton rows={4} />
  {:else if error}
    <Card class="bg-destructive/10 border-destructive/20 text-destructive">
      <CardContent class="p-6 text-center space-y-3">
        <div class="flex items-center justify-center gap-2 font-bold">
          <AlertCircle class="h-5 w-5" />
          <span>Customer Account Unavailable</span>
        </div>
        <p class="text-xs text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onclick={() => customerAccountStore.refresh(headId)}
          class="gap-1.5"
        >
          <RefreshCw class="h-4 w-4" />
          <span>Retry Connection</span>
        </Button>
      </CardContent>
    </Card>
  {:else if summary}
    <!-- Summary Cards -->
    <CustomerAccountSummary {summary} {applications} />
  {/if}
</div>
