<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { countries, type Country } from '$lib/utils/countries';
  import { Search, ChevronDown, Check, X, Globe, Plus } from 'lucide-svelte';
  import { Badge } from '$lib/components/ui/badge';

  interface Props {
    values?: string[];
    id?: string;
    placeholder?: string;
    required?: boolean;
    class?: string;
  }

  let {
    values = $bindable([]),
    id,
    placeholder = 'Select destination countries...',
    required = false,
    class: className = ''
  }: Props = $props();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let containerRef = $state<HTMLDivElement | null>(null);
  let searchInputRef = $state<HTMLInputElement | null>(null);

  function getCountryObj(name: string): Country | undefined {
    const lower = name.toLowerCase().trim();
    return countries.find(c => c.name.toLowerCase() === lower || c.nationality.toLowerCase() === lower);
  }

  const filteredCountries = $derived(
    countries.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      c.nationality.toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
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

  function toggleCountry(country: Country) {
    const index = values.findIndex(v => v.toLowerCase() === country.name.toLowerCase());
    if (index >= 0) {
      values = values.filter((_, i) => i !== index);
    } else {
      values = [...values, country.name];
    }
  }

  function removeCountry(index: number, e: MouseEvent) {
    e.stopPropagation();
    values = values.filter((_, i) => i !== index);
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
  <!-- Multi-select Input Trigger Box -->
  <div
    {id}
    role="button"
    tabindex="0"
    onclick={toggleDropdown}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { toggleDropdown(e as any); } }}
    class="min-h-[38px] w-full text-xs bg-background border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none flex flex-wrap items-center gap-1.5 justify-between cursor-pointer hover:border-primary/50 transition-colors"
  >
    <div class="flex flex-wrap items-center gap-1.5 flex-1">
      {#if values.length === 0}
        <span class="text-muted-foreground font-normal py-0.5">{placeholder}</span>
      {:else}
        {#each values as countryName, idx}
          {@const countryObj = getCountryObj(countryName)}
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
            {#if countryObj?.flag}
              <span>{countryObj.flag}</span>
            {/if}
            <span>{countryName}</span>
            <button
              type="button"
              onclick={(e) => removeCountry(idx, e)}
              class="hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5 ml-0.5 transition-colors"
              aria-label="Remove {countryName}"
            >
              <X class="h-3 w-3" />
            </button>
          </span>
        {/each}
      {/if}
    </div>

    <div class="flex items-center gap-1 shrink-0 text-muted-foreground ml-auto">
      <span class="text-[10px] font-medium opacity-70">
        {#if values.length > 0}
          {values.length} selected
        {/if}
      </span>
      <ChevronDown class="h-4 w-4 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
    </div>
  </div>

  {#if required && values.length === 0}
    <input type="text" value="" required class="sr-only" tabindex="-1" aria-hidden="true" />
  {/if}

  <!-- Dropdown Panel with Search Bar -->
  {#if isOpen}
    <div
      class="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150"
    >
      <!-- Search Input Header -->
      <div class="p-2 border-b border-border bg-muted/20 relative flex items-center">
        <Search class="absolute left-4 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          bind:this={searchInputRef}
          type="text"
          bind:value={searchQuery}
          placeholder="Search and select multiple countries..."
          class="w-full text-xs bg-background border border-input rounded-md pl-8 pr-8 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => searchQuery = ''}
            class="absolute right-4 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        {/if}
      </div>

      <!-- Selected Countries Summary Bar inside Dropdown -->
      {#if values.length > 0}
        <div class="px-3 py-1.5 bg-muted/40 border-b border-border text-[11px] flex items-center justify-between text-muted-foreground">
          <span>{values.length} countries selected</span>
          <button
            type="button"
            onclick={(e) => { e.stopPropagation(); values = []; }}
            class="text-destructive hover:underline text-[10px] font-semibold"
          >
            Clear All
          </button>
        </div>
      {/if}

      <!-- Countries List with Multi-select Checkboxes -->
      <div class="max-h-56 overflow-y-auto divide-y divide-border/20 py-1" role="listbox">
        {#if filteredCountries.length === 0}
          <div class="px-3 py-4 text-center text-xs text-muted-foreground">
            No country matching "{searchQuery}"
          </div>
        {:else}
          {#each filteredCountries as c (c.name)}
            {@const isSelected = values.some(v => v.toLowerCase() === c.name.toLowerCase())}
            <button
              type="button"
              onclick={() => toggleCountry(c)}
              class="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors {isSelected ? 'bg-primary/10 font-bold text-primary' : ''}"
              role="option"
              aria-selected={isSelected}
            >
              <span class="flex items-center gap-2 truncate">
                <span class="text-sm shrink-0">{c.flag}</span>
                <span class="truncate font-medium">{c.name}</span>
              </span>
              <div class="h-4 w-4 rounded border flex items-center justify-center {isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}">
                {#if isSelected}
                  <Check class="h-3 w-3" />
                {/if}
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
