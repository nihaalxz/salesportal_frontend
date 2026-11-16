<script lang="ts">
  import { goto } from '$app/navigation';
  import { 
    isShortcutsModalOpen, 
    closeShortcutsModal, 
    openCreateHeadModal,
    SHORTCUTS, 
    type ShortcutDefinition 
  } from '$lib/services/shortcuts';
  import { Keyboard, X, ArrowRight } from 'lucide-svelte';

  function handleNavigate(route?: string) {
    if (!route) return;
    closeShortcutsModal();
    goto(route);
  }

  function handleItemClick(s: ShortcutDefinition) {
    if (s.action === 'navigate' && s.route) {
      handleNavigate(s.route);
    } else if (s.key === 'F10') {
      closeShortcutsModal();
      openCreateHeadModal();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      closeShortcutsModal();
    }
  }

  const bookingShortcuts = $derived(SHORTCUTS.filter(s => s.category === 'Bookings'));
  const financialShortcuts = $derived(SHORTCUTS.filter(s => s.category === 'Financials'));
  const generalShortcuts = $derived(SHORTCUTS.filter(s => s.category === 'General'));
</script>

{#if $isShortcutsModalOpen}
  <div 
    class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    onclick={handleBackdropClick}
    onkeydown={(e) => { if (e.key === 'Escape') closeShortcutsModal(); }}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label="Keyboard Shortcuts"
  >
    <div class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Keyboard class="h-5 w-5" />
          </div>
          <div>
            <h3 class="font-bold text-base text-foreground flex items-center gap-2">
              Keyboard Shortcuts
              <span class="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                F1 - F10
              </span>
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              Press any shortcut key anywhere in the app to quickly open booking creation forms.
            </p>
          </div>
        </div>
        <button 
          onclick={closeShortcutsModal} 
          class="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close shortcuts modal"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
        
        <!-- Bookings Section -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <span>Booking Creation Forms</span>
            <span class="h-px flex-1 bg-border"></span>
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {#each bookingShortcuts as s}
              <button
                type="button"
                onclick={() => handleNavigate(s.route)}
                class="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/40 transition-all text-left group cursor-pointer"
              >
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                  <kbd class="min-w-9 px-2 py-1 text-center text-xs font-mono font-bold rounded-md bg-muted text-foreground border border-border/80 shadow-xs group-hover:border-primary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    {s.displayKey}
                  </kbd>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {s.label}
                    </p>
                    <p class="text-[11px] text-muted-foreground truncate">
                      {s.description}
                    </p>
                  </div>
                </div>
                <ArrowRight class="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            {/each}
          </div>
        </div>

        <!-- Financials & Documents Section -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <span>Financials & Documents</span>
            <span class="h-px flex-1 bg-border"></span>
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {#each financialShortcuts as s}
              <button
                type="button"
                onclick={() => handleNavigate(s.route)}
                class="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/40 transition-all text-left group cursor-pointer"
              >
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                  <kbd class="min-w-9 px-2 py-1 text-center text-xs font-mono font-bold rounded-md bg-muted text-foreground border border-border/80 shadow-xs group-hover:border-primary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    {s.displayKey}
                  </kbd>
                  <div class="min-w-0">
                    <p class="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {s.label}
                    </p>
                    <p class="text-[11px] text-muted-foreground truncate">
                      {s.description}
                    </p>
                  </div>
                </div>
                <ArrowRight class="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            {/each}
          </div>
        </div>

        <!-- General Section -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <span>General Controls</span>
            <span class="h-px flex-1 bg-border"></span>
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {#each generalShortcuts as s}
              {#if s.key === 'F10'}
                <button
                  type="button"
                  onclick={() => handleItemClick(s)}
                  class="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-emerald-500/40 transition-all text-left group cursor-pointer"
                >
                  <div class="flex items-center gap-2.5 min-w-0 pr-2">
                    <kbd class="min-w-9 px-2 py-1 text-center text-xs font-mono font-bold rounded-md bg-muted text-foreground border border-border/80 shadow-xs group-hover:border-emerald-500/50 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                      {s.displayKey}
                    </kbd>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {s.label}
                      </p>
                      <p class="text-[11px] text-muted-foreground truncate">
                        {s.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight class="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              {:else}
                <div class="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-left">
                  <div class="flex items-center gap-2.5 min-w-0 pr-2">
                    <kbd class="min-w-9 px-2 py-1 text-center text-xs font-mono font-bold rounded-md bg-muted text-foreground border border-border/80 shadow-xs shrink-0">
                      {s.displayKey}
                    </kbd>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-foreground truncate">
                        {s.label}
                      </p>
                      <p class="text-[11px] text-muted-foreground truncate">
                        {s.description}
                      </p>
                    </div>
                  </div>
                </div>
              {/if}
            {/each}
            <div class="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card text-left">
              <div class="flex items-center gap-2.5 min-w-0 pr-2">
                <kbd class="min-w-9 px-2 py-1 text-center text-xs font-mono font-bold rounded-md bg-muted text-foreground border border-border/80 shadow-xs shrink-0">
                  Esc
                </kbd>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-foreground truncate">
                    Close Modal / Dialog
                  </p>
                  <p class="text-[11px] text-muted-foreground truncate">
                    Closes active modal or dropdown
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3.5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          <strong class="text-foreground font-semibold">Note:</strong> Browser refresh (<kbd class="font-mono text-[11px] px-1 py-0.5 rounded bg-muted border border-border">F5</kbd>) is preserved.
        </span>
        <button
          onclick={closeShortcutsModal}
          class="px-4 py-1.5 rounded-md bg-secondary text-secondary-foreground font-medium text-xs hover:bg-secondary/80 transition-colors"
        >
          Close (<kbd class="font-mono text-[10px]">Esc</kbd>)
        </button>
      </div>

    </div>
  </div>
{/if}
