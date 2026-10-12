<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { countries, type Country } from '$lib/utils/countries';
  import { Search, ChevronDown, Check, X } from 'lucide-svelte';

  interface Props {
    value?: string;
    id?: string;
    required?: boolean;
    class?: string;
  }

  let {
    value = $bindable('Bahraini'),
    id,
    required = false,
    class: className = ''
  }: Props = $props();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let containerRef = $state<HTMLDivElement | null>(null);
  let searchInputRef = $state<HTMLInputElement | null>(null);

  const selectedCountry = $derived(
    countries.find(c => c.nationality.toLowerCase() === value?.toLowerCase()) ||
    countries.find(c => c.name.toLowerCase() === value?.toLowerCase())
  );

  const filteredCountries = $derived(
    countries.filter(c => 
      c.nationality.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
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

  function selectCountry(country: Country) {
    value = country.nationality;
    isOpen = false;
    searchQuery = '';
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
    class="w-full text-xs bg-background border border-border rounded px-3 py-2 h-10 text-foreground focus:outline-none font-semibold flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
  >
    <span class="flex items-center gap-2 truncate">
      {#if selectedCountry}
        <span class="text-sm">{selectedCountry.flag}</span>
        <span>{selectedCountry.nationality}</span>
        <span class="text-muted-foreground font-normal text-[11px]">({selectedCountry.name})</span>
      {:else}
        <span class="text-muted-foreground font-normal">{value || 'Select Nationality...'}</span>
      {/if}
    </span>
    <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
  </button>

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
          placeholder="Search nationality or country..."
          class="w-full text-xs bg-background border border-input rounded-md pl-8 pr-8 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {#if searchQuery}
          <button
            type="button"
            onclick={() => searchQuery = ''}
            class="absolute right-4 text-muted-foreground hover:text-foreground"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        {/if}
      </div>

      <!-- Countries List -->
      <div class="max-h-56 overflow-y-auto divide-y divide-border/20 py-1" role="listbox">
        {#if filteredCountries.length === 0}
          <div class="px-3 py-4 text-center text-xs text-muted-foreground">
            No nationality matching "{searchQuery}"
          </div>
        {:else}
          {#each filteredCountries as country (country.name + country.nationality)}
            {@const isSelected = selectedCountry?.nationality === country.nationality}
            <button
              type="button"
              onclick={() => selectCountry(country)}
              class="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors {isSelected ? 'bg-primary/10 font-bold text-primary' : ''}"
              role="option"
              aria-selected={isSelected}
            >
              <span class="flex items-center gap-2 truncate">
                <span class="text-sm shrink-0">{country.flag}</span>
                <span class="truncate">{country.nationality}</span>
                <span class="text-muted-foreground font-normal text-[11px] truncate">({country.name})</span>
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
