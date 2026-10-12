<script lang="ts">
  import Badge from '$lib/components/ui/badge/badge.svelte';

  interface Props {
    status: string | null | undefined;
    class?: string;
  }

  let { status, class: className = '' }: Props = $props();

  const formattedStatus = $derived((status || '').toLowerCase().trim());

  function formatLabel(str: string): string {
    if (!str) return 'Unknown';
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Determine badge variant and label mapping
  const config = $derived(() => {
    switch (formattedStatus) {
      case 'paid':
      case 'approved':
      case 'completed':
      case 'success':
      case 'active':
        return { variant: 'success' as const, label: formatLabel(status || 'Completed') };
      case 'pending':
      case 'processing':
      case 'partial':
      case 'draft':
        return { variant: 'warning' as const, label: formatLabel(status || 'Pending') };
      case 'document_update_requested':
      case 'document update requested':
      case 'documents_required':
      case 'documents required':
        return { variant: 'warning' as const, label: 'Document Update Requested' };
      case 'documents_resubmitted':
      case 'documents resubmitted':
        return { variant: 'warning' as const, label: 'Documents Resubmitted' };
      case 'under_review':
      case 'under review':
        return { variant: 'warning' as const, label: 'Under Review' };
      case 'cancelled':
      case 'failed':
      case 'rejected':
      case 'overdue':
        return { variant: 'destructive' as const, label: formatLabel(status || 'Failed') };
      default:
        return { variant: 'secondary' as const, label: formatLabel(status || 'Unknown') };
    }
  });

  const activeConfig = $derived(config());
</script>

<Badge variant={activeConfig.variant} class={className}>
  {activeConfig.label}
</Badge>
