<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { phoneCodeCountries, type Country } from '$lib/utils/countries';
  import { Search, ChevronDown, Check, X } from 'lucide-svelte';

  interface Props {
    value?: string;
    id?: string;
    required?: boolean;
    class?: string;
  }

  let {
    value = $bindable('+973'),
    id,
    required = false,
    class: className = ''
  }: Props = $props();

  let isOpen = $state(false);
  let searchQuery = $state('');
  let containerRef = $state<HTMLDivElement | null>(null);
  let searchInputRef = $state<HTMLInputElement | null>(null);
  let currentCountry = $state<Country | null>(null);

  // Synchronize initial or external value changes with currentCountry
  $effect(() => {
    if (!currentCountry || currentCountry.dialCode !== value) {
      currentCountry = phoneCodeCountries.find(c => c.dialCode === value) || phoneCodeCountries[0];
    }
  });

  const filteredCountries = $derived(
    phoneCodeCountries.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const cleanQ = q.startsWith('+') ? q.slice(1) : q;
      const cleanDial = c.dialCode.startsWith('+') ? c.dialCode.slice(1) : c.dialCode;

      return (
        c.name.toLowerCase().includes(q) ||
        c.nationality.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        cleanDial.includes(cleanQ)
      );
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

  function selectCountry(country: Country) {
    currentCountry = country;
    value = country.dialCode;
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
    class="w-full text-xs bg-background border border-border rounded px-2.5 py-2 h-10 text-foreground focus:outline-none font-semibold flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors"
    aria-expanded={isOpen}
    aria-haspopup="listbox"
  >
    <span class="flex items-center gap-1.5 truncate">
      {#if currentCountry}
        <span class="text-sm shrink-0">{currentCountry.flag}</span>
        <span class="font-mono text-xs font-semibold">{currentCountry.dialCode}</span>
      {:else}
        <span class="font-mono text-xs font-semibold">{value || '+973'}</span>
      {/if}
    </span>
    <ChevronDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" />
  </button>

  <!-- Dropdown Panel with Search Bar -->
  {#if isOpen}
    <div
      class="absolute top-full left-0 z-50 mt-1 w-72 sm:w-80 rounded-md border border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150"
    >
      <!-- Search Input Header -->
      <div class="p-2 border-b border-border bg-muted/20 relative flex items-center">
        <Search class="absolute left-4 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          bind:this={searchInputRef}
          type="text"
          bind:value={searchQuery}
          placeholder="Search country or code (e.g. 973)..."
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
            No country matching "{searchQuery}"
          </div>
        {:else}
          {#each filteredCountries as country, i (country.name + country.dialCode)}
            {@const isSelected = currentCountry?.name === country.name && currentCountry?.dialCode === country.dialCode}
            <button
              type="button"
              onclick={() => selectCountry(country)}
              class="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors {isSelected ? 'bg-primary/10 font-bold text-primary' : ''}"
              role="option"
              aria-selected={isSelected}
            >
              <span class="flex items-center gap-2 truncate mr-2">
                <span class="text-sm shrink-0">{country.flag}</span>
                <span class="truncate font-medium">{country.name}</span>
              </span>
              <span class="flex items-center gap-1.5 shrink-0 font-mono text-muted-foreground text-[11px]">
                <span>{country.dialCode}</span>
                {#if isSelected}
                  <Check class="h-3.5 w-3.5 text-primary ml-1" />
                {/if}
              </span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

