<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Search, ChevronDown, Check, X, User, Building2, Loader2 } from 'lucide-svelte';

  interface Head {
    id: number;
    firstName: string;
    lastName: string;
    mobileNo?: string;
    companyName?: string;
    type?: string;
    wallet?: number;
    [key: string]: any;
  }

  interface Props {
    value?: number;
    heads?: Head[];
    clientType?: string; // 'customer' | 'agent'
    loading?: boolean;
    id?: string;
    placeholder?: string;
    required?: boolean;
    class?: string;
    onchange?: (headId: number, head: Head | null) => void;
  }

  let {
    value = $bindable(0),
    heads = [],
    clientType = 'customer',
    loading = false,
    id = 'customerHeadSelect',
    placeholder = '',
    required = false,
    class: className = '',
    onchange
  }: Props = $props();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let containerRef = $state<HTMLDivElement | null>(null);
  let searchInputRef = $state<HTMLInputElement | null>(null);

  const effectivePlaceholder = $derived(
    placeholder || (clientType === 'agent' ? '-- Select Agent --' : '-- Select Customer --')
  );

  const selectedHead = $derived(
    heads.find(h => Number(h.id) === Number(value)) || null
  );

  const filteredHeads = $derived(
    heads.filter(h => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const fullName = `${h.firstName || ''} ${h.lastName || ''}`.toLowerCase();
      const mobile = (h.mobileNo || '').toLowerCase();
      const company = (h.companyName || '').toLowerCase();
      return fullName.includes(q) || mobile.includes(q) || company.includes(q);
    })
  );

  function toggleDropdown(e: MouseEvent) {
    e.stopPropagation();
    isOpen = !isOpen;
    if (isOpen) {
      searchQuery = '';
      setTimeout(() => {
        if (searchInputRef) {
          searchInputRef.focus();
        }
      }, 50);
    }
  }

  function selectHead(head: Head | null) {
    const newId = head ? head.id : 0;
    value = newId;
    isOpen = false;
    searchQuery = '';
    if (onchange) {
      onchange(newId, head);
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (containerRef && !containerRef.contains(event.target as Node)) {
      isOpen = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen) {
      isOpen = false;
    }
  }

  onMount(() => {
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
  });

  onDestroy(() => {
    window.removeEventListener('click', handleClickOutside);
    window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="relative w-full {className}" bind:this={containerRef}>
  <!-- Trigger Button -->
  <button
    {id}
    type="button"
    onclick={toggleDropdown}
    class="w-full text-xs bg-background border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all select-none shadow-sm"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
  >
    <span class="flex items-center gap-2 truncate">
      {#if loading}
        <Loader2 class="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
        <span class="text-muted-foreground font-normal">Loading list...</span>
      {:else if selectedHead}
        {#if clientType === 'agent'}
          <Building2 class="h-3.5 w-3.5 shrink-0 text-primary" />
        {:else}
          <User class="h-3.5 w-3.5 shrink-0 text-primary" />
        {/if}
        <span class="font-bold">{selectedHead.firstName} {selectedHead.lastName}</span>
        {#if selectedHead.mobileNo}
          <span class="text-muted-foreground font-normal text-[11px]">({selectedHead.mobileNo})</span>
        {/if}
      {:else}
        <span class="text-muted-foreground font-normal">{effectivePlaceholder}</span>
      {/if}
    </span>
    <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
  </button>

  <!-- Dropdown Panel with Search Bar -->
  {#if isOpen}
    <div
      class="absolute top-full left-0 right-0 z-50 mt-1.5 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Search Input Header -->
      <div class="p-2 border-b border-border bg-muted/30 relative flex items-center">
        <Search class="absolute left-4 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          bind:this={searchInputRef}
          type="text"
          bind:value={searchQuery}
          placeholder={clientType === 'agent' ? "Search agent name, mobile, or company..." : "Search customer name or mobile..."}
          class="w-full text-xs bg-background border border-input rounded-md pl-8 pr-8 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => searchQuery = ''}
            class="absolute right-4 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        {/if}
      </div>

      <!-- Heads List -->
      <div class="max-h-60 overflow-y-auto divide-y divide-border/20 py-1" role="listbox">
        <!-- Clear / Default Option -->
        <button
          type="button"
          onclick={() => selectHead(null)}
          class="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors text-muted-foreground italic font-normal"
        >
          <span>{effectivePlaceholder}</span>
          {#if !selectedHead}
            <Check class="h-3.5 w-3.5 shrink-0 text-primary" />
          {/if}
        </button>

        {#if filteredHeads.length === 0}
          <div class="px-3 py-4 text-center text-xs text-muted-foreground">
            No {clientType === 'agent' ? 'agents' : 'customers'} matching "{searchQuery}"
          </div>
        {:else}
          {#each filteredHeads as head (head.id)}
            {@const isSelected = selectedHead?.id === head.id}
            <button
              type="button"
              onclick={() => selectHead(head)}
              class="w-full text-left px-3 py-2.5 text-xs flex items-center justify-between hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors {isSelected ? 'bg-primary/10 font-bold text-primary' : 'text-foreground'}"
              role="option"
              aria-selected={isSelected}
            >
              <span class="flex items-center gap-2.5 truncate">
                {#if clientType === 'agent'}
                  <Building2 class="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                {:else}
                  <User class="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                {/if}
                <span class="truncate font-semibold">{head.firstName} {head.lastName}</span>
                {#if head.mobileNo}
                  <span class="text-muted-foreground font-normal text-[11px] truncate">({head.mobileNo})</span>
                {/if}
              </span>
              {#if isSelected}
                <Check class="h-3.5 w-3.5 shrink-0 text-primary" />
              {/if}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
