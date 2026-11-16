<script lang="ts">
  import { goto } from '$app/navigation';
  import { 
    isCreateHeadModalOpen, 
    closeCreateHeadModal 
  } from '$lib/services/shortcuts';
  import { createHead } from '$lib/features/heads/api/heads-api';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import PhoneCodeSelect from '$lib/components/PhoneCodeSelect.svelte';
  import NationalitySelect from '$lib/components/NationalitySelect.svelte';
  import { UserPlus, X, Loader2 } from 'lucide-svelte';

  let firstName = $state('');
  let lastName = $state('');
  let countryCode = $state('+973');
  let phoneNo = $state('');
  let email = $state('');
  let nationality = $state('Bahraini');
  let address = $state('');

  let submitting = $state(false);
  let errorMessage = $state<string | null>(null);

  function resetForm() {
    firstName = '';
    lastName = '';
    countryCode = '+973';
    phoneNo = '';
    email = '';
    nationality = 'Bahraini';
    address = '';
    errorMessage = null;
    submitting = false;
  }

  function handleClose() {
    resetForm();
    closeCreateHeadModal();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;

    submitting = true;
    errorMessage = null;

    try {
      const fullMobile = `${countryCode}${phoneNo}`.trim();
      const createdHead = await createHead({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        type: 'customer',
        mobileNo: fullMobile,
        email: email.trim(),
        nationality: nationality.trim(),
        address: address.trim()
      });

      // Dispatch global window event so any active page (Heads, Flights, Visas, etc.) can update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('head-created', { detail: createdHead }));
      }

      handleClose();
      await goto('/heads?type=customer');
    } catch (err: any) {
      if (err.errors && typeof err.errors === 'object') {
        const messages = Object.values(err.errors).flat().join(' ');
        errorMessage = messages || err.detail || err.message || 'Failed to create customer head.';
      } else {
        errorMessage = err.detail || err.message || 'Failed to create customer head.';
      }
    } finally {
      submitting = false;
    }
  }
</script>

{#if $isCreateHeadModalOpen}
  <div 
    class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    onclick={handleBackdropClick}
    onkeydown={(e) => { if (e.key === 'Escape') handleClose(); }}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label="Create Customer Head"
  >
    <div class="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserPlus class="h-5 w-5" />
          </div>
          <div>
            <h3 class="font-bold text-base text-foreground flex items-center gap-2">
              Create Customer Head
              <span class="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                F10
              </span>
            </h3>
            <p class="text-xs text-muted-foreground mt-0.5">
              Register a new customer account to create bookings or receipts.
            </p>
          </div>
        </div>
        <button 
          onclick={handleClose} 
          class="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Close modal"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Form Body -->
      <form onsubmit={handleSubmit} class="p-6 space-y-4">
        {#if errorMessage}
          <div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs">
            {errorMessage}
          </div>
        {/if}

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="modalFirstName" class="text-xs font-semibold text-muted-foreground">First Name *</label>
            <Input id="modalFirstName" bind:value={firstName} placeholder="First Name" required />
          </div>
          <div class="space-y-1.5">
            <label for="modalLastName" class="text-xs font-semibold text-muted-foreground">
              Last Name <span class="text-muted-foreground/70 font-normal">(Optional)</span>
            </label>
            <Input id="modalLastName" bind:value={lastName} placeholder="Last Name (Optional)" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="modalEmail" class="text-xs font-semibold text-muted-foreground">Email *</label>
          <Input id="modalEmail" type="email" bind:value={email} placeholder="email@example.com" required />
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1.5">
            <label for="modalCountryCode" class="text-xs font-semibold text-muted-foreground">Code *</label>
            <PhoneCodeSelect id="modalCountryCode" bind:value={countryCode} />
          </div>
          <div class="col-span-2 space-y-1.5">
            <label for="modalPhoneNo" class="text-xs font-semibold text-muted-foreground">Mobile No *</label>
            <Input id="modalPhoneNo" bind:value={phoneNo} placeholder="Mobile Phone" required />
          </div>
        </div>

        <div class="space-y-1.5">
          <label for="modalNationalitySelect" class="text-xs font-semibold text-muted-foreground">Nationality *</label>
          <NationalitySelect id="modalNationalitySelect" bind:value={nationality} />
        </div>

        <div class="space-y-1.5">
          <label for="modalAddress" class="text-xs font-semibold text-muted-foreground">Address *</label>
          <Input id="modalAddress" bind:value={address} placeholder="Address details" required />
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-between pt-4 border-t border-border mt-6">
          <span class="text-xs text-muted-foreground">
            Press <kbd class="font-mono text-[10px] px-1 py-0.5 rounded bg-muted border border-border">Esc</kbd> to cancel
          </span>
          <div class="flex gap-2">
            <Button variant="outline" type="button" onclick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" disabled={submitting}>
              {#if submitting}
                <Loader2 class="h-4 w-4 animate-spin" />
                Saving...
              {:else}
                Save Customer
              {/if}
            </Button>
          </div>
        </div>
      </form>

    </div>
  </div>
{/if}

