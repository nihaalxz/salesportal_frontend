<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import StatusBadge from '$lib/components/StatusBadge.svelte';
  import { getLeads, createLead, updateLead } from '$lib/features/leads/api/leads-api';
  import { formatDateOnly, formatDateTime } from '$lib/formatters/date';
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    User, 
    Mail, 
    Phone,
    ShieldAlert,
    RefreshCw,
    Edit2,
    Plus,
    Calendar,
    CheckCircle,
    Info,
    AlertCircle
  } from 'lucide-svelte';

  let loading = $state(true);
  let error = $state<any>(null);
  let leadsData = $state<any>(null);
  let searchInput = $state('');

  let abortController: AbortController | null = null;
  let searchDebounceTimer: any;

  // URL state derivation
  const pageNum = $derived(parseInt($page.url.searchParams.get('page') || '1', 10));
  const pageSizeNum = $derived(parseInt($page.url.searchParams.get('pageSize') || '10', 10));
  const statusFilter = $derived($page.url.searchParams.get('status') || '');

  // Form State
  let showCreateDialog = $state(false);
  let showEditDialog = $state(false);
  let selectedLeadToEdit = $state<any>(null);

  let formName = $state('');
  let formCountryCode = $state('+973');
  let formMobileNo = $state('');
  let formServices = $state<string[]>([]);
  let formLeadSourceSelect = $state('Instagram');
  let formCustomLeadSource = $state('');
  let formDescription = $state('');
  let formReminderDate = $state('');
  let formStatus = $state('Pending');

  let submitting = $state(false);
  let submitError = $state<string | null>(null);
  let validationErrors = $state<Record<string, string[]>>({});

  const AVAILABLE_SERVICES = [
    'Flights',
    'Visa Services',
    'Holiday Packages',
    'VFS Appointment',
    'Hotel Booking',
    'Transportation',
    'Other Services'
  ];

  const LEAD_SOURCES = [
    'Instagram',
    'Facebook',
    'WhatsApp',
    'Texas CRM',
    'Website',
    'Others'
  ];

  const LEAD_STATUSES = [
    { value: 'Pending', label: 'Pending' },
    { value: 'Followed Up', label: 'Followed Up' },
    { value: 'Completed', label: 'Completed' }
  ];

  async function fetchLeads(urlSearchParams: URLSearchParams) {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    loading = true;
    error = null;

    const page = parseInt(urlSearchParams.get('page') || '1', 10);
    const pageSize = parseInt(urlSearchParams.get('pageSize') || '10', 10);
    const searchTerm = urlSearchParams.get('searchTerm') || undefined;
    const status = urlSearchParams.get('status') || undefined;

    searchInput = searchTerm || '';

    try {
      leadsData = await getLeads({ page, pageSize, searchTerm, status }, abortController.signal);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        error = err;
      }
    } finally {
      if (!abortController.signal.aborted) {
        loading = false;
      }
    }
  }

  function handleSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    searchInput = value;

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      const currentParams = new URLSearchParams($page.url.searchParams);
      if (value.trim()) {
        currentParams.set('searchTerm', value.trim());
      } else {
        currentParams.delete('searchTerm');
      }
      currentParams.set('page', '1');
      goto(`?${currentParams.toString()}`, { replaceState: true, keepFocus: true });
    }, 300);
  }

  function handleStatusFilterChange(status: string) {
    const currentParams = new URLSearchParams($page.url.searchParams);
    if (status) {
      currentParams.set('status', status);
    } else {
      currentParams.delete('status');
    }
    currentParams.set('page', '1');
    goto(`?${currentParams.toString()}`, { replaceState: true });
  }

  function handlePageChange(newPage: number) {
    const currentParams = new URLSearchParams($page.url.searchParams);
    currentParams.set('page', String(newPage));
    goto(`?${currentParams.toString()}`, { keepFocus: true });
  }

  function openCreateDialog() {
    formName = '';
    formCountryCode = '+973';
    formMobileNo = '';
    formServices = [];
    formLeadSourceSelect = 'Instagram';
    formCustomLeadSource = '';
    formDescription = '';
    formReminderDate = '';
    formStatus = 'Pending';
    submitError = null;
    validationErrors = {};
    showCreateDialog = true;
  }

  function openEditDialog(lead: any) {
    selectedLeadToEdit = lead;
    formName = lead.name || '';
    formCountryCode = lead.countryCode || '+973';
    formMobileNo = lead.mobileNo || '';
    formStatus = lead.status || 'Pending';
    formDescription = lead.description || '';
    formReminderDate = lead.reminderDate ? new Date(lead.reminderDate).toISOString().substring(0, 16) : '';
    submitError = null;
    validationErrors = {};

    // Parse serialized services JSON
    try {
      formServices = JSON.parse(lead.services || '[]');
    } catch {
      formServices = [];
    }

    // Resolve source selector
    const sourceStr = lead.leadSource || 'Instagram';
    if (LEAD_SOURCES.includes(sourceStr)) {
      formLeadSourceSelect = sourceStr;
      formCustomLeadSource = '';
    } else {
      formLeadSourceSelect = 'Others';
      formCustomLeadSource = sourceStr;
    }

    showEditDialog = true;
  }

  function toggleService(service: string) {
    if (formServices.includes(service)) {
      formServices = formServices.filter(s => s !== service);
    } else {
      formServices = [...formServices, service];
    }
  }

  async function handleCreateLead(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    submitError = null;
    validationErrors = {};

    let source = formLeadSourceSelect;
    if (source === 'Others') {
      source = formCustomLeadSource.trim();
    }

    const payload = {
      name: formName,
      countryCode: formCountryCode,
      mobileNo: formMobileNo,
      services: formServices,
      leadSource: source,
      description: formDescription || null,
      reminderDate: formReminderDate ? new Date(formReminderDate).toISOString() : null
    };

    try {
      await createLead(payload);
      showCreateDialog = false;
      fetchLeads($page.url.searchParams);
    } catch (err: any) {
      if (err.status === 422 && err.errors) {
        validationErrors = err.errors;
      } else {
        submitError = err.detail || err.message || 'Failed to create lead.';
      }
    } finally {
      submitting = false;
    }
  }

  async function handleEditLead(e: SubmitEvent) {
    e.preventDefault();
    if (!selectedLeadToEdit) return;
    submitting = true;
    submitError = null;
    validationErrors = {};

    let source = formLeadSourceSelect;
    if (source === 'Others') {
      source = formCustomLeadSource.trim();
    }

    const payload = {
      name: formName,
      status: formStatus,
      countryCode: formCountryCode,
      mobileNo: formMobileNo,
      services: formServices,
      leadSource: source,
      description: formDescription || null,
      reminderDate: formReminderDate ? new Date(formReminderDate).toISOString() : null
    };

    try {
      await updateLead(selectedLeadToEdit.id, payload);
      showEditDialog = false;
      fetchLeads($page.url.searchParams);
    } catch (err: any) {
      if (err.status === 422 && err.errors) {
        validationErrors = err.errors;
      } else {
        submitError = err.detail || err.message || 'Failed to update lead.';
      }
    } finally {
      submitting = false;
    }
  }



  $effect(() => {
    fetchLeads($page.url.searchParams);
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  });

  function formatServicesDisplay(servicesJson: string | null) {
    try {
      const arr = JSON.parse(servicesJson || '[]');
      return arr.join(', ') || 'None';
    } catch {
      return servicesJson || 'None';
    }
  }

  function isReminderDateToday(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  }
</script>

<PageHeader title="Leads" description="Track and manage sales inquiries and prospects.">
  <Button onclick={openCreateDialog} class="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
    <Plus class="h-4 w-4" />
    <span>Create Lead</span>
  </Button>
</PageHeader>

<div class="space-y-6">
  <!-- Filters Bar -->
  <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
    <div class="flex flex-1 gap-3 w-full sm:max-w-md">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchInput}
          oninput={handleSearchInput}
          placeholder="Search prospects..."
          class="pl-9 h-10"
        />
      </div>

      <select
        value={statusFilter}
        onchange={(e) => handleStatusFilterChange(e.currentTarget.value)}
        class="bg-background border border-input rounded px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none text-foreground font-semibold"
      >
        <option value="">All Statuses</option>
        {#each LEAD_STATUSES as s}
          <option value={s.value}>{s.label}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if error}
    <Alert.Root variant="destructive">
      <ShieldAlert class="h-5 w-5" />
      <Alert.Title>Failed to load sales leads</Alert.Title>
      <Alert.Description class="mt-2 flex flex-col gap-3">
        <p>{error.detail || error.message || 'An error occurred while communicating with the server.'}</p>
        <Button onclick={() => fetchLeads($page.url.searchParams)} variant="outline" size="sm" class="w-fit gap-2">
          <RefreshCw class="h-4 w-4" />
          <span>Retry Loading</span>
        </Button>
      </Alert.Description>
    </Alert.Root>

  {:else if loading}
    <Card class="overflow-hidden border border-border">
      <div class="space-y-4 p-6">
        <Skeleton class="h-10 w-full" />
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
        <Skeleton class="h-12 w-full" />
      </div>
    </Card>

  {:else if !leadsData || leadsData.items.length === 0}
    <Card class="border-dashed">
      <CardContent class="flex flex-col items-center justify-center p-12 text-center">
        <User class="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 class="text-lg font-semibold text-foreground">No leads found</h3>
        <p class="text-sm text-muted-foreground mt-1 max-w-sm">
          {#if searchInput || statusFilter}
            No leads match your active filters. Try resetting search criteria.
          {:else}
            You have no active leads registered. Create a new lead to start tracking.
          {/if}
        </p>
      </CardContent>
    </Card>

  {:else}
    <Card class="overflow-hidden border border-border bg-card shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-muted/40 border-b border-border font-medium text-muted-foreground">
              <th class="px-6 py-4">Name</th>
              <th class="px-6 py-4">Contact</th>
              <th class="px-6 py-4">Interested Services</th>
              <th class="px-6 py-4">Lead Source</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Reminder</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            {#each leadsData.items as lead (lead.id)}
              {@const isReminderToday = isReminderDateToday(lead.reminderDate)}
              <tr class="transition-colors {isReminderToday ? 'animate-blink-red border-l-4 border-l-red-600' : 'hover:bg-muted/20'}">
                <td class="px-6 py-4 font-semibold text-foreground">
                  <div class="space-y-1">
                    <span class="block">{lead.name}</span>
                    <span class="text-[11px] text-muted-foreground block font-mono font-normal">{formatDateOnly(lead.createdAt)}</span>
                    {#if lead.description}
                      <p class="text-xs font-normal text-muted-foreground line-clamp-1 max-w-[200px]" title={lead.description}>
                        {lead.description}
                      </p>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 text-xs font-mono font-semibold text-muted-foreground">
                  {lead.countryCode} {lead.mobileNo}
                </td>
                <td class="px-6 py-4 text-xs text-foreground font-semibold">
                  {formatServicesDisplay(lead.services)}
                </td>
                <td class="px-6 py-4 text-xs font-semibold text-foreground">
                  {lead.leadSource}
                </td>
                <td class="px-6 py-4">
                  <StatusBadge status={lead.status} />
                </td>
                <td class="px-6 py-4">
                  {#if lead.reminderDate}
                    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold {isReminderToday ? 'bg-red-600 text-white animate-pulse shadow-sm' : 'bg-amber-100/90 text-amber-950 border border-amber-300/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60 shadow-2xs'}">
                      <Calendar class="h-3.5 w-3.5 shrink-0 {isReminderToday ? 'text-white' : 'text-amber-700 dark:text-amber-400'}" />
                      <span>{formatDateOnly(lead.reminderDate)}</span>
                    </span>
                  {:else}
                    <span class="text-xs text-muted-foreground/60">—</span>
                  {/if}
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end gap-2">
                    <Button size="sm" variant="outline" class="gap-1 h-8" onclick={() => openEditDialog(lead)}>
                      <Edit2 class="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Pagination Footer -->
    <div class="flex items-center justify-between bg-muted/20 border border-border rounded-lg px-6 py-4 text-xs mt-6">
      <span class="text-muted-foreground">
        Page <strong>{pageNum}</strong> of <strong>{leadsData.totalPages}</strong> ({leadsData.totalCount} leads)
      </span>
      <div class="flex items-center gap-1">
        <Button
          onclick={() => handlePageChange(pageNum - 1)}
          disabled={pageNum <= 1}
          variant="outline"
          size="sm"
          class="h-8 gap-1"
        >
          <ChevronLeft class="h-4 w-4" />
          <span>Previous</span>
        </Button>
        <Button
          onclick={() => handlePageChange(pageNum + 1)}
          disabled={pageNum >= leadsData.totalPages}
          variant="outline"
          size="sm"
          class="h-8 gap-1"
        >
          <span>Next</span>
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}
</div>

<!-- CREATE DIALOG MODAL -->
{#if showCreateDialog}
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 class="font-semibold text-base text-foreground">Create Sales Lead</h3>
        <button onclick={() => showCreateDialog = false} class="text-muted-foreground hover:text-foreground text-sm font-semibold">✕</button>
      </div>
      <form onsubmit={handleCreateLead} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        {#if submitError}
          <div class="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
            {submitError}
          </div>
        {/if}

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Prospect Name *</label>
          <Input bind:value={formName} placeholder="Lead Name" required />
          {#if validationErrors.name}
            <p class="text-xs text-destructive">{validationErrors.name[0]}</p>
          {/if}
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Code *</label>
            <Input bind:value={formCountryCode} placeholder="+973" required />
          </div>
          <div class="col-span-2 space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Mobile No *</label>
            <Input bind:value={formMobileNo} placeholder="Mobile Phone" required />
            {#if validationErrors.mobileNo}
              <p class="text-xs text-destructive">{validationErrors.mobileNo[0]}</p>
            {/if}
          </div>
        </div>

        <!-- Services Checkboxes -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Services Interested *</label>
          <div class="grid grid-cols-2 gap-2 border border-border rounded p-3 bg-muted/10">
            {#each AVAILABLE_SERVICES as s}
              <label class="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                <input type="checkbox" checked={formServices.includes(s)} onchange={() => toggleService(s)} class="accent-primary" />
                <span>{s}</span>
              </label>
            {/each}
          </div>
          {#if validationErrors.services}
            <p class="text-xs text-destructive">{validationErrors.services[0]}</p>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Lead Source *</label>
            <select bind:value={formLeadSourceSelect} class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none">
              {#each LEAD_SOURCES as src}
                <option value={src}>{src}</option>
              {/each}
            </select>
          </div>
          {#if formLeadSourceSelect === 'Others'}
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground">Specify Source *</label>
              <Input bind:value={formCustomLeadSource} placeholder="Source Name" required />
            </div>
          {/if}
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Description / Notes</label>
          <Input bind:value={formDescription} placeholder="Lead description details" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Reminder Date & Time</label>
          <Input type="datetime-local" bind:value={formReminderDate} />
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" type="button" onclick={() => showCreateDialog = false}>Cancel</Button>
          <Button type="submit" class="bg-green-600 hover:bg-green-700 text-white" disabled={submitting}>
            {#if submitting}
              Creating...
            {:else}
              Create Lead
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- EDIT DIALOG MODAL -->
{#if showEditDialog}
  <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
      <div class="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 class="font-semibold text-base text-foreground">Edit Sales Lead</h3>
        <button onclick={() => showEditDialog = false} class="text-muted-foreground hover:text-foreground text-sm font-semibold">✕</button>
      </div>
      <form onsubmit={handleEditLead} class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        {#if submitError}
          <div class="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
            {submitError}
          </div>
        {/if}

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Prospect Name *</label>
          <Input bind:value={formName} placeholder="Lead Name" required />
          {#if validationErrors.name}
            <p class="text-xs text-destructive">{validationErrors.name[0]}</p>
          {/if}
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Pipeline Status *</label>
          <select bind:value={formStatus} class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none font-semibold">
            {#each LEAD_STATUSES as s}
              <option value={s.value}>{s.label}</option>
            {/each}
          </select>
          {#if validationErrors.status}
            <p class="text-xs text-destructive">{validationErrors.status[0]}</p>
          {/if}
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Code *</label>
            <Input bind:value={formCountryCode} placeholder="+973" disabled />
          </div>
          <div class="col-span-2 space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Mobile No *</label>
            <Input bind:value={formMobileNo} placeholder="Mobile Phone" disabled />
            {#if validationErrors.mobileNo}
              <p class="text-xs text-destructive">{validationErrors.mobileNo[0]}</p>
            {/if}
          </div>
        </div>

        <!-- Services Checkboxes -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Services Interested *</label>
          <div class="grid grid-cols-2 gap-2 border border-border rounded p-3 bg-muted/10">
            {#each AVAILABLE_SERVICES as s}
              <label class="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                <input type="checkbox" checked={formServices.includes(s)} onchange={() => toggleService(s)} class="accent-primary" />
                <span>{s}</span>
              </label>
            {/each}
          </div>
          {#if validationErrors.services}
            <p class="text-xs text-destructive">{validationErrors.services[0]}</p>
          {/if}
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-muted-foreground">Lead Source *</label>
            <select bind:value={formLeadSourceSelect} class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none">
              {#each LEAD_SOURCES as src}
                <option value={src}>{src}</option>
              {/each}
            </select>
          </div>
          {#if formLeadSourceSelect === 'Others'}
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-muted-foreground">Specify Source *</label>
              <Input bind:value={formCustomLeadSource} placeholder="Source Name" required />
            </div>
          {/if}
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Description / Notes</label>
          <Input bind:value={formDescription} placeholder="Lead description details" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-muted-foreground">Reminder Date & Time</label>
          <Input type="datetime-local" bind:value={formReminderDate} />
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-border mt-6">
          <Button variant="outline" type="button" onclick={() => showEditDialog = false}>Cancel</Button>
          <Button type="submit" class="bg-green-600 hover:bg-green-700 text-white" disabled={submitting}>
            {#if submitting}
              Saving...
            {:else}
              Save Changes
            {/if}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  @keyframes blinkRedRow {
    0%, 100% {
      background-color: rgba(239, 68, 68, 0.28);
    }
    50% {
      background-color: rgba(239, 68, 68, 0.05);
    }
  }

  :global(.animate-blink-red) {
    animation: blinkRedRow 1.2s infinite ease-in-out;
  }
</style>
