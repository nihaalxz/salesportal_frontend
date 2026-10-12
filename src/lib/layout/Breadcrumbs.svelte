<script lang="ts">
  import { page } from '$app/stores';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';

  const segmentLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    leads: 'Leads',
    heads: 'Heads',
    bookings: 'Bookings',
    flights: 'Flight Tickets',
    hotels: 'Hotel Bookings',
    visas: 'Visa Services',
    vfs: 'VFS Appointments',
    holidays: 'Holiday Packages',
    transport: 'Transportation',
    'other-services': 'Other Services'
  };

  const breadcrumbs = $derived(() => {
    const paths = $page.url.pathname.split('/').filter(Boolean);
    let accum = '';
    
    return paths.map((segment, idx) => {
      accum += `/${segment}`;
      const label = segmentLabels[segment] || segment.replace(/-/g, ' ');
      return {
        label,
        route: accum,
        isLast: idx === paths.length - 1
      };
    });
  });

  const activeBreadcrumbs = $derived(breadcrumbs());
</script>

{#if activeBreadcrumbs.length > 0}
  <Breadcrumb.Root>
    <Breadcrumb.List>
      <Breadcrumb.Item>
        <Breadcrumb.Link href="/dashboard">Home</Breadcrumb.Link>
      </Breadcrumb.Item>
      {#each activeBreadcrumbs as bc}
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          {#if bc.isLast}
            <Breadcrumb.Page>{bc.label}</Breadcrumb.Page>
          {:else}
            <Breadcrumb.Link href={bc.route}>{bc.label}</Breadcrumb.Link>
          {/if}
        </Breadcrumb.Item>
      {/each}
    </Breadcrumb.List>
  </Breadcrumb.Root>
{/if}
