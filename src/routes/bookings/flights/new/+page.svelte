<script lang="ts">
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import HeadSelect from '$lib/components/HeadSelect.svelte';
  import CustomerAccountWidget from '$lib/features/customer-accounts/components/CustomerAccountWidget.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { createFlightBooking, type HeadLookup } from '$lib/features/flights/api/flights-api';
  import { lookupHeads as lookupHeadsApi } from '$lib/features/heads/api/heads-api';
  import { getBanks, getSuppliers, type BankResponse } from '$lib/features/receipts/api/receipts-api';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    ChevronLeft, 
    Save, 
    Loader2, 
    AlertCircle, 
    Search,
    UserCheck,
    Plus,
    Trash2,
    Plane,
    ArrowRightLeft,
    ArrowRight
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  interface PassengerInput {
    prefix: string;
    passengerName: string;
    ticketPnr: string;
  }

  // Trip Type Definition
  type TripType = 'one_way' | 'round_trip' | 'connecting';
  let tripType = $state<TripType>('one_way');

  // Form State - Base / One Way
  let clientType = $state('customer');
  let headId = $state<number | null>(null);
  let agent = $state('');
  let agentId = $state<number | null>(null);
  let fromLocation = $state('');
  let toLocation = $state('');
  let travelDate = $state('');
  let airlineCompany = $state('');
  let paymentMethod = $state('credit');
  let bankId = $state<number | null>(null);
  let bankName = $state('');

  // Round Trip specific state
  let returnDate = $state('');
  let returnAirline = $state('');
  let returnTicketPnr = $state('');

  // Connecting Flight specific state
  interface FlightLeg {
    id: string;
    fromLocation: string;
    toLocation: string;
    travelDate: string;
    airlineCompany: string;
    ticketPnr: string;
  }

  let connectionLegs = $state<FlightLeg[]>([
    { id: 'leg-1', fromLocation: '', toLocation: '', travelDate: '', airlineCompany: '', ticketPnr: '' },
    { id: 'leg-2', fromLocation: '', toLocation: '', travelDate: '', airlineCompany: '', ticketPnr: '' }
  ]);

  function addLeg() {
    const lastLeg = connectionLegs[connectionLegs.length - 1];
    connectionLegs = [
      ...connectionLegs,
      {
        id: 'leg-' + (connectionLegs.length + 1) + '-' + Date.now(),
        fromLocation: lastLeg ? lastLeg.toLocation : '',
        toLocation: '',
        travelDate: lastLeg ? lastLeg.travelDate : '',
        airlineCompany: lastLeg ? lastLeg.airlineCompany : '',
        ticketPnr: ''
      }
    ];
  }

  function removeLeg(index: number) {
    if (connectionLegs.length > 2) {
      connectionLegs = connectionLegs.filter((_, i) => i !== index);
    }
  }

  function handleLegToChange(index: number, val: string) {
    connectionLegs[index].toLocation = val;
    // Auto-populate next leg departure if empty or previously identical to this leg's old origin
    if (index + 1 < connectionLegs.length) {
      if (!connectionLegs[index + 1].fromLocation || connectionLegs[index + 1].fromLocation === connectionLegs[index].fromLocation) {
        connectionLegs[index + 1].fromLocation = val;
      }
    }
  }

  // Reactive Route Summary for the itinerary
  let routeSummary = $derived.by(() => {
    if (tripType === 'one_way') {
      if (!fromLocation.trim() && !toLocation.trim()) return '';
      return `${fromLocation.trim().toUpperCase() || '???'} → ${toLocation.trim().toUpperCase() || '???'}`;
    } else if (tripType === 'round_trip') {
      if (!fromLocation.trim() && !toLocation.trim()) return '';
      const retDatePart = returnDate ? ` (Return: ${returnDate})` : ' (Round Trip)';
      return `${fromLocation.trim().toUpperCase() || '???'} ⇄ ${toLocation.trim().toUpperCase() || '???'}${retDatePart}`;
    } else {
      const stops = connectionLegs.map(l => l.fromLocation.trim().toUpperCase()).filter(Boolean);
      const lastStop = connectionLegs[connectionLegs.length - 1]?.toLocation.trim().toUpperCase();
      if (lastStop) stops.push(lastStop);
      return stops.length > 1 ? `${stops.join(' → ')} (${connectionLegs.length} Legs)` : '';
    }
  });

  // Common Financial & Supplier State (for the whole booking)
  let amount = $state(0);
  let isInhouse = $state(true);
  let supplierId = $state<number | null>(null);
  let expectedSupplierCost = $state(0);

  // Dynamic passengers state - Prefix, Passenger Name, Ticket PNR
  let passengers = $state<PassengerInput[]>([
    { prefix: 'Mr.', passengerName: '', ticketPnr: '' }
  ]);

  // Interactive UI state (Dropdown list)
  let headsList = $state<HeadLookup[]>([]);
  let agentsList = $state<any[]>([]);
  let loadingHeads = $state(false);
  let loadingAgents = $state(false);
  let realBanks = $state<BankResponse[]>([]);

  let submitting = $state(false);
  let successMsg = $state('');
  let errorMsg = $state('');
  let validationErrors = $state<Record<string, string[]>>({});

  onMount(async () => {
    loadingHeads = true;
    try {
      headsList = await lookupHeadsApi('', 100, 'customer');
    } catch (err) {
      console.error('Failed to load active customer heads:', err);
    } finally {
      loadingHeads = false;
    }

    loadingAgents = true;
    try {
      agentsList = await lookupHeadsApi('', 100, 'agent');
    } catch (err) {
      console.error('Failed to load active agents:', err);
    } finally {
      loadingAgents = false;
    }

    getBanks().then(res => {
      realBanks = res;
    }).catch(err => {
      console.error('Failed to load banks:', err);
    });

    getSuppliers().then(res => {
      const filtered = res.filter(s => s.categories && s.categories.some(c => c.toLowerCase().includes('fligh')));
      suppliers = (filtered.length > 0 ? filtered : res).map(s => ({ id: s.id, name: s.name }));
    }).catch(err => {
      console.error('Failed to load suppliers:', err);
    });
  });

  // Generate unique idempotency key for this form session, safe for SSR
  function getFreshIdempotencyKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'idemp-' + Math.random().toString(36).substring(2) + '-' + Date.now();
  }

  // Reactive calculations
  let totalSupplierCost = $derived(isInhouse ? 0 : expectedSupplierCost);

  function selectHead(head: HeadLookup) {
    headId = head.id ?? null;
  }

  function addPassenger() {
    passengers = [...passengers, {
      prefix: 'Mr.',
      passengerName: '',
      ticketPnr: ''
    }];
  }

  function removePassenger(index: number) {
    if (passengers.length > 1) {
      passengers = passengers.filter((_, i) => i !== index);
    }
  }

  // Predefined options
  const prefixes = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
  let suppliers = $state<{ id: number; name: string }[]>([]);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    errorMsg = '';
    successMsg = '';
    validationErrors = {};

    // Basic frontend checks based on selected trip type
    const errors: Record<string, string[]> = {};

    if (tripType === 'one_way') {
      if (!fromLocation.trim()) errors.fromLocation = ['From location is required.'];
      if (!toLocation.trim()) errors.toLocation = ['To location is required.'];
      if (!travelDate) errors.travelDate = ['Travel date is required.'];
      if (!airlineCompany.trim()) errors.airlineCompany = ['Airline company is required.'];
    } else if (tripType === 'round_trip') {
      if (!fromLocation.trim()) errors.fromLocation = ['From location is required.'];
      if (!toLocation.trim()) errors.toLocation = ['To location is required.'];
      if (!travelDate) errors.travelDate = ['Departure date is required.'];
      if (!airlineCompany.trim()) errors.airlineCompany = ['Outbound airline company is required.'];
      if (!returnDate) {
        errors.returnDate = ['Return date is required for round trips.'];
      } else if (travelDate && new Date(returnDate) < new Date(travelDate)) {
        errors.returnDate = ['Return date cannot be earlier than departure date.'];
      }
    } else if (tripType === 'connecting') {
      if (connectionLegs.length < 2) {
        errors.connecting = ['At least 2 flight legs are required for connecting flights.'];
      }
      connectionLegs.forEach((leg, i) => {
        if (!leg.fromLocation.trim()) errors[`leg_${i}_from`] = [`Leg ${i + 1} departure is required.`];
        if (!leg.toLocation.trim()) errors[`leg_${i}_to`] = [`Leg ${i + 1} destination is required.`];
        if (!leg.travelDate) errors[`leg_${i}_date`] = [`Leg ${i + 1} date is required.`];
        if (!leg.airlineCompany.trim()) errors[`leg_${i}_airline`] = [`Leg ${i + 1} airline is required.`];
        if (i > 0 && leg.travelDate && connectionLegs[i - 1].travelDate) {
          if (new Date(leg.travelDate) < new Date(connectionLegs[i - 1].travelDate)) {
            errors[`leg_${i}_date`] = [`Leg ${i + 1} date cannot be before Leg ${i} date.`];
          }
        }
      });
    }
    
    if (clientType === 'customer' && !headId) {
      errors.headId = ['Customer account head is required.'];
    }
    if (clientType === 'agent') {
      if (!agentId) {
        errors.agentId = ['Agent selection is required.'];
      }
    }

    if (amount <= 0) {
      errors.amount = ['Total Ticket Price must be greater than zero.'];
    }

    if (!isInhouse) {
      if (!supplierId) {
        errors.supplierId = ['Supplier partner is required.'];
      }
      if (expectedSupplierCost < 0) {
        errors.expectedSupplierCost = ['Supplier cost must be non-negative.'];
      }
    }

    // Passengers validation
    if (passengers.length === 0) {
      errors.passengers = ['At least one passenger is required.'];
    } else {
      passengers.forEach((p, i) => {
        if (!p.passengerName.trim()) {
          errors[`passengers_${i}_name`] = [`Passenger ${i + 1} name is required.`];
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      validationErrors = errors;
      submitting = false;
      return;
    }

    const numPassengers = passengers.length || 1;
    const perPassengerAmount = amount / numPassengers;
    const perPassengerSupplierCost = (isInhouse ? 0 : expectedSupplierCost) / numPassengers;

    // Build serialized route and flight data
    let finalFromLocation = '';
    let finalToLocation = '';
    let finalTravelDate: string | null = null;
    let finalAirlineCompany = '';
    let finalCombinedPnr: string | null = null;

    if (tripType === 'one_way') {
      finalFromLocation = fromLocation.trim();
      finalToLocation = toLocation.trim();
      finalTravelDate = travelDate ? new Date(travelDate).toISOString() : null;
      finalAirlineCompany = airlineCompany.trim();
      finalCombinedPnr = passengers.map(p => p.ticketPnr?.trim()).filter(Boolean).join(', ') || null;
    } else if (tripType === 'round_trip') {
      finalFromLocation = fromLocation.trim();
      finalToLocation = `${toLocation.trim()} (Round Trip - Return: ${returnDate})`;
      finalTravelDate = travelDate ? new Date(travelDate).toISOString() : null;
      const effReturnAirline = returnAirline.trim() || airlineCompany.trim();
      finalAirlineCompany = (effReturnAirline && effReturnAirline.toLowerCase() !== airlineCompany.trim().toLowerCase())
        ? `${airlineCompany.trim()} / ${effReturnAirline}`
        : airlineCompany.trim();

      const paxPnrs = passengers.map(p => p.ticketPnr?.trim()).filter(Boolean);
      if (returnTicketPnr.trim()) {
        paxPnrs.push(`Ret: ${returnTicketPnr.trim()}`);
      }
      finalCombinedPnr = paxPnrs.join(', ') || null;
    } else {
      // Connecting
      finalFromLocation = connectionLegs[0].fromLocation.trim();
      const transitDests = connectionLegs.map(l => l.toLocation.trim()).filter(Boolean).join(' → ');
      finalToLocation = `${transitDests} (Connecting)`;
      finalTravelDate = connectionLegs[0].travelDate ? new Date(connectionLegs[0].travelDate).toISOString() : null;

      const uniqueAirlines = Array.from(new Set(connectionLegs.map(l => l.airlineCompany.trim()).filter(Boolean)));
      finalAirlineCompany = uniqueAirlines.join(' / ');

      const legPnrs = connectionLegs.map((l, i) => l.ticketPnr.trim() ? `L${i + 1}: ${l.ticketPnr.trim()}` : null).filter(Boolean);
      const paxPnrs = passengers.map(p => p.ticketPnr?.trim()).filter(Boolean);
      finalCombinedPnr = [...paxPnrs, ...legPnrs].join(', ') || null;
    }

    // Prepare Request Body
    const request = {
      clientType,
      headId: clientType === 'customer' ? headId : null,
      agent: clientType === 'agent' ? agent : null,
      agentId: clientType === 'agent' ? agentId : null,
      careOf: null,
      fromLocation: finalFromLocation,
      toLocation: finalToLocation,
      travelDate: finalTravelDate,
      airlineCompany: finalAirlineCompany,
      ticketPnr: finalCombinedPnr,
      isInhouse,
      supplierId: isInhouse ? null : supplierId,
      supplierName: isInhouse ? null : suppliers.find(s => s.id === supplierId)?.name,
      expectedSupplierCost: isInhouse ? 0 : expectedSupplierCost,
      paymentMethod,
      bankId: paymentMethod === 'online' ? bankId : null,
      bankName: paymentMethod === 'online' ? (realBanks.find(b => b.id === bankId)?.bankName ?? '') : null,
      paymentProof: null,
      passengers: passengers.map(p => ({
        prefix: p.prefix,
        passengerName: p.passengerName.trim(),
        expectedSupplierCost: perPassengerSupplierCost,
        amount: perPassengerAmount,
        isInhouse,
        supplierId: isInhouse ? null : supplierId,
        ticketPnr: p.ticketPnr?.trim() || null
      }))
    };

    try {
      const response = await createFlightBooking(request, getFreshIdempotencyKey());
      successMsg = `Flight booking ${response.documentNumber} successfully created!`;
      setTimeout(() => {
        goto('/bookings/flights');
      }, 1000);
    } catch (err: any) {
      if (err.status === 422 || err.status === 400) {
        if (err.errors) {
          validationErrors = err.errors;
        } else {
          errorMsg = err.detail || err.message || 'Validation failed. Please correct the fields.';
        }
      } else {
        errorMsg = err.detail || err.message || 'An unexpected connection failure occurred.';
      }
    } finally {
      submitting = false;
    }
  }
</script>

<PageHeader title="New Flight Booking" description="Record a new passenger flight ticket booking.">
  <Button onclick={() => goto('/bookings/flights')} variant="outline" size="sm" class="gap-1.5">
    <ChevronLeft class="h-4 w-4" />
    <span>Back to List</span>
  </Button>
</PageHeader>

<form onsubmit={handleSubmit} class="w-full space-y-6">
  
  {#if errorMsg}
    <Alert.Root variant="destructive">
      <AlertCircle class="h-5 w-5" />
      <Alert.Title>Submission Error</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{errorMsg}</Alert.Description>
    </Alert.Root>
  {/if}

  {#if successMsg}
    <Alert.Root class="border-success/30 bg-success/10 text-success dark:border-success/20 dark:bg-success/5 dark:text-success-foreground">
      <UserCheck class="h-5 w-5 text-success" />
      <Alert.Title>Success</Alert.Title>
      <Alert.Description class="mt-2 text-sm">{successMsg}</Alert.Description>
    </Alert.Root>
  {/if}

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- Main Form Fields (Left Column) -->
    <div class="md:col-span-2 space-y-6">
      
      <!-- Client Segment Card -->
      <Card class="bg-card !overflow-visible relative z-30">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Client Segment</CardTitle>
          <CardDescription>Select whether booking for a customer or an external agent.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Client Type Selection -->
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="radio" value="customer" bind:group={clientType} class="text-primary accent-primary" />
              <span>Customer</span>
            </label>
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input type="radio" value="agent" bind:group={clientType} class="text-primary accent-primary" />
              <span>Agent</span>
            </label>
          </div>

          <!-- Customer Head Selection Dropdown -->
          {#if clientType === 'customer'}
            <div class="space-y-1.5">
              <label for="customerHeadSelect" class="text-xs font-semibold text-muted-foreground">Select Customer Head *</label>
              <HeadSelect
                id="customerHeadSelect"
                value={headId ?? 0}
                heads={headsList}
                clientType="customer"
                loading={loadingHeads}
                required
                onchange={(val, selectedHead) => {
                  headId = val || null;
                  if (selectedHead) {
                    selectHead(selectedHead);
                  }
                }}
              />
              {#if validationErrors.headId}
                <p class="text-xs text-destructive">{validationErrors.headId[0]}</p>
              {/if}
            </div>
          {:else}
            <!-- Agent Select -->
            <div class="space-y-1.5">
              <label for="agentHeadSelect" class="text-xs font-semibold text-muted-foreground">Select Agent *</label>
              <HeadSelect
                id="agentHeadSelect"
                value={agentId ?? 0}
                heads={agentsList}
                clientType="agent"
                loading={loadingAgents}
                required
                onchange={(val, selectedAgent) => {
                  agentId = val || null;
                  if (selectedAgent) {
                    agent = `${selectedAgent.firstName || ''} ${selectedAgent.lastName || ''}`.trim();
                  } else {
                    agent = '';
                  }
                }}
              />
              {#if validationErrors.agentId}
                <p class="text-xs text-destructive">{validationErrors.agentId[0]}</p>
              {/if}
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Flight & Route Details Card -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle class="text-base">Flight & Route Details</CardTitle>
              <CardDescription>Sector route, schedule dates, and airline details.</CardDescription>
            </div>
            
            <!-- Trip Type Selector Buttons -->
            <div class="inline-flex rounded-lg bg-muted/60 p-1 border border-border/60 self-start sm:self-auto shadow-inner">
              <button
                type="button"
                id="btn-trip-oneway"
                onclick={() => tripType = 'one_way'}
                class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 {tripType === 'one_way' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
              >
                <Plane class="h-3.5 w-3.5" />
                <span>One Way</span>
              </button>
              <button
                type="button"
                id="btn-trip-roundtrip"
                onclick={() => tripType = 'round_trip'}
                class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 {tripType === 'round_trip' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
              >
                <ArrowRightLeft class="h-3.5 w-3.5" />
                <span>Round Trip</span>
              </button>
              <button
                type="button"
                id="btn-trip-connecting"
                onclick={() => tripType = 'connecting'}
                class="px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 {tripType === 'connecting' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
              >
                <div class="flex items-center -space-x-1">
                  <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                  <ArrowRight class="h-3 w-3" />
                  <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                </div>
                <span>Connection</span>
              </button>
            </div>
          </div>

          {#if routeSummary}
            <div class="mt-3 bg-primary/5 border border-primary/20 rounded-md px-3 py-2 flex items-center justify-between text-xs flex-wrap gap-2">
              <div class="flex items-center gap-2 font-mono">
                <span class="text-muted-foreground font-sans font-medium text-[11px] uppercase tracking-wider">Itinerary:</span>
                <span class="font-bold text-primary">{routeSummary}</span>
              </div>
              <span class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                {tripType === 'one_way' ? 'One Way' : tripType === 'round_trip' ? 'Round Trip' : 'Connecting Flight'}
              </span>
            </div>
          {/if}
        </CardHeader>

        <CardContent class="space-y-4">
          <!-- ONE WAY MODE -->
          {#if tripType === 'one_way'}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="fromLocationInput" class="text-xs font-semibold text-muted-foreground">Departure (From) *</label>
                <Input 
                  id="fromLocationInput"
                  placeholder="e.g. BAH" 
                  bind:value={fromLocation} 
                  required
                />
                {#if validationErrors.fromLocation}
                  <p class="text-xs text-destructive">{validationErrors.fromLocation[0]}</p>
                {/if}
              </div>
              <div class="space-y-1.5">
                <label for="toLocationInput" class="text-xs font-semibold text-muted-foreground">Destination (To) *</label>
                <Input 
                  id="toLocationInput"
                  placeholder="e.g. DXB" 
                  bind:value={toLocation} 
                  required
                />
                {#if validationErrors.toLocation}
                  <p class="text-xs text-destructive">{validationErrors.toLocation[0]}</p>
                {/if}
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label for="travelDateInput" class="text-xs font-semibold text-muted-foreground">Travel Date *</label>
                <Input 
                  id="travelDateInput"
                  type="date" 
                  bind:value={travelDate} 
                  required
                />
                {#if validationErrors.travelDate}
                  <p class="text-xs text-destructive">{validationErrors.travelDate[0]}</p>
                {/if}
              </div>
              <div class="space-y-1.5">
                <label for="airlineCompanyInput" class="text-xs font-semibold text-muted-foreground">Airline Company *</label>
                <Input 
                  id="airlineCompanyInput"
                  placeholder="e.g. Gulf Air, Emirates" 
                  bind:value={airlineCompany} 
                  required
                />
                {#if validationErrors.airlineCompany}
                  <p class="text-xs text-destructive">{validationErrors.airlineCompany[0]}</p>
                {/if}
              </div>
            </div>

          <!-- ROUND TRIP MODE -->
          {:else if tripType === 'round_trip'}
            <!-- Outbound Segment -->
            <div class="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-3">
              <div class="flex items-center justify-between border-b border-border/60 pb-2">
                <span class="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Plane class="h-3.5 w-3.5 text-primary" />
                  Outbound Flight (Departure)
                </span>
                <span class="text-[10px] uppercase font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">Outbound Leg</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label for="rtFromInput" class="text-xs font-semibold text-muted-foreground">Departure (From) *</label>
                  <Input 
                    id="rtFromInput"
                    placeholder="e.g. BAH" 
                    bind:value={fromLocation} 
                    required
                  />
                  {#if validationErrors.fromLocation}
                    <p class="text-xs text-destructive">{validationErrors.fromLocation[0]}</p>
                  {/if}
                </div>
                <div class="space-y-1.5">
                  <label for="rtToInput" class="text-xs font-semibold text-muted-foreground">Destination (To) *</label>
                  <Input 
                    id="rtToInput"
                    placeholder="e.g. DXB" 
                    bind:value={toLocation} 
                    required
                  />
                  {#if validationErrors.toLocation}
                    <p class="text-xs text-destructive">{validationErrors.toLocation[0]}</p>
                  {/if}
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label for="rtDepartureDateInput" class="text-xs font-semibold text-muted-foreground">Departure Date *</label>
                  <Input 
                    id="rtDepartureDateInput"
                    type="date" 
                    bind:value={travelDate} 
                    required
                  />
                  {#if validationErrors.travelDate}
                    <p class="text-xs text-destructive">{validationErrors.travelDate[0]}</p>
                  {/if}
                </div>
                <div class="space-y-1.5">
                  <label for="rtAirlineInput" class="text-xs font-semibold text-muted-foreground">Outbound Airline *</label>
                  <Input 
                    id="rtAirlineInput"
                    placeholder="e.g. Gulf Air" 
                    bind:value={airlineCompany} 
                    required
                  />
                  {#if validationErrors.airlineCompany}
                    <p class="text-xs text-destructive">{validationErrors.airlineCompany[0]}</p>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Return Segment -->
            <div class="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-3">
              <div class="flex items-center justify-between border-b border-border/60 pb-2">
                <span class="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ArrowRightLeft class="h-3.5 w-3.5 text-primary" />
                  Return Flight ({toLocation ? toLocation.toUpperCase() : 'Destination'} → {fromLocation ? fromLocation.toUpperCase() : 'Origin'})
                </span>
                <span class="text-[10px] uppercase font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10">Return Leg</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="space-y-1.5">
                  <label for="rtReturnDateInput" class="text-xs font-semibold text-muted-foreground">Return Date *</label>
                  <Input 
                    id="rtReturnDateInput"
                    type="date" 
                    min={travelDate || undefined}
                    bind:value={returnDate} 
                    required
                  />
                  {#if validationErrors.returnDate}
                    <p class="text-xs text-destructive">{validationErrors.returnDate[0]}</p>
                  {/if}
                </div>
                <div class="space-y-1.5">
                  <label for="rtReturnAirlineInput" class="text-xs font-semibold text-muted-foreground">Return Airline (Optional)</label>
                  <Input 
                    id="rtReturnAirlineInput"
                    placeholder={airlineCompany ? `Same as outbound (${airlineCompany})` : 'e.g. Emirates'} 
                    bind:value={returnAirline} 
                  />
                </div>
                <div class="space-y-1.5">
                  <label for="rtReturnPnrInput" class="text-xs font-semibold text-muted-foreground">Return PNR (Optional)</label>
                  <Input 
                    id="rtReturnPnrInput"
                    placeholder="e.g. RET123" 
                    bind:value={returnTicketPnr} 
                  />
                </div>
              </div>
            </div>

          <!-- CONNECTING FLIGHT MODE -->
          {:else if tripType === 'connecting'}
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Flight Legs ({connectionLegs.length})</span>
                <Button 
                  type="button" 
                  onclick={addLeg} 
                  variant="outline" 
                  size="sm" 
                  class="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Plus class="h-3.5 w-3.5" />
                  <span>Add Connection Leg</span>
                </Button>
              </div>

              {#if validationErrors.connecting}
                <p class="text-xs text-destructive">{validationErrors.connecting[0]}</p>
              {/if}

              {#each connectionLegs as leg, index (leg.id)}
                <div class="p-3.5 rounded-lg border border-border/80 bg-muted/20 space-y-3 relative">
                  <div class="flex items-center justify-between border-b border-border/60 pb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-foreground">Leg #{index + 1}</span>
                      <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {leg.fromLocation ? leg.fromLocation.toUpperCase() : '???'} → {leg.toLocation ? leg.toLocation.toUpperCase() : '???'}
                      </span>
                    </div>
                    {#if connectionLegs.length > 2}
                      <Button 
                        type="button" 
                        onclick={() => removeLeg(index)} 
                        variant="ghost" 
                        size="sm" 
                        class="h-7 px-2 text-destructive hover:bg-destructive/10 text-xs gap-1"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                        <span>Remove Leg</span>
                      </Button>
                    {/if}
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="space-y-1.5">
                      <label for="leg_{index}_from" class="text-xs font-semibold text-muted-foreground">Departure (From) *</label>
                      <Input 
                        id="leg_{index}_from"
                        placeholder="e.g. BAH" 
                        bind:value={leg.fromLocation} 
                        required
                      />
                      {#if validationErrors[`leg_${index}_from`]}
                        <p class="text-xs text-destructive">{validationErrors[`leg_${index}_from`][0]}</p>
                      {/if}
                    </div>

                    <div class="space-y-1.5">
                      <label for="leg_{index}_to" class="text-xs font-semibold text-muted-foreground">Destination (To) *</label>
                      <Input 
                        id="leg_{index}_to"
                        placeholder="e.g. DOH" 
                        value={leg.toLocation}
                        oninput={(e) => handleLegToChange(index, e.currentTarget.value)}
                        required
                      />
                      {#if validationErrors[`leg_${index}_to`]}
                        <p class="text-xs text-destructive">{validationErrors[`leg_${index}_to`][0]}</p>
                      {/if}
                    </div>

                    <div class="space-y-1.5">
                      <label for="leg_{index}_date" class="text-xs font-semibold text-muted-foreground">Travel Date *</label>
                      <Input 
                        id="leg_{index}_date"
                        type="date" 
                        bind:value={leg.travelDate} 
                        required
                      />
                      {#if validationErrors[`leg_${index}_date`]}
                        <p class="text-xs text-destructive">{validationErrors[`leg_${index}_date`][0]}</p>
                      {/if}
                    </div>

                    <div class="space-y-1.5">
                      <label for="leg_{index}_airline" class="text-xs font-semibold text-muted-foreground">Airline *</label>
                      <Input 
                        id="leg_{index}_airline"
                        placeholder="e.g. Qatar Airways" 
                        bind:value={leg.airlineCompany} 
                        required
                      />
                      {#if validationErrors[`leg_${index}_airline`]}
                        <p class="text-xs text-destructive">{validationErrors[`leg_${index}_airline`][0]}</p>
                      {/if}
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div class="space-y-1.5">
                      <label for="leg_{index}_pnr" class="text-xs font-semibold text-muted-foreground">Leg Ticket PNR (Optional)</label>
                      <Input 
                        id="leg_{index}_pnr"
                        placeholder="e.g. PNR-LEG1" 
                        bind:value={leg.ticketPnr} 
                      />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </CardContent>
      </Card>

      <!-- Passengers List Card -->
      <Card class="bg-card">
        <CardHeader class="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle class="text-base">Passengers List ({passengers.length})</CardTitle>
            <CardDescription>Enter prefix, passenger name, and ticket PNR number.</CardDescription>
          </div>
          <Button onclick={addPassenger} type="button" variant="outline" size="sm" class="gap-1.5 shadow-sm border-primary/30 text-primary hover:bg-primary/10">
            <Plus class="h-3.5 w-3.5" />
            <span>Add Passenger</span>
          </Button>
        </CardHeader>
        <CardContent class="space-y-4 divide-y divide-border">
          {#each passengers as passenger, index}
            <div class="pt-4 first:pt-0 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-primary">Passenger #{index + 1}</span>
                {#if passengers.length > 1}
                  <Button onclick={() => removePassenger(index)} type="button" variant="ghost" size="sm" class="h-7 px-2 text-destructive hover:bg-destructive/10 gap-1 text-xs">
                    <Trash2 class="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                {/if}
              </div>

              <div class="grid grid-cols-12 gap-3">
                <div class="col-span-3 sm:col-span-2 space-y-1.5">
                  <label for="prefix_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Prefix</label>
                  <select 
                    id="prefix_{index}"
                    class="w-full text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground focus:outline-none"
                    bind:value={passenger.prefix}
                  >
                    {#each prefixes as pref}
                      <option value={pref}>{pref}</option>
                    {/each}
                  </select>
                </div>

                <div class="col-span-9 sm:col-span-6 space-y-1.5">
                  <label for="name_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Passenger Name *</label>
                  <Input 
                    id="name_{index}"
                    placeholder="Full name as in passport" 
                    bind:value={passenger.passengerName}
                    required
                  />
                  {#if validationErrors[`passengers_${index}_name`] || validationErrors[`passengers[${index}].passengerName`] || validationErrors[`passengers[${index}].PassengerName`]}
                    <p class="text-[10px] text-destructive">{(validationErrors[`passengers_${index}_name`] || validationErrors[`passengers[${index}].passengerName`] || validationErrors[`passengers[${index}].PassengerName`])[0]}</p>
                  {/if}
                </div>

                <div class="col-span-12 sm:col-span-4 space-y-1.5">
                  <label for="pnr_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Ticket PNR Number</label>
                  <Input 
                    id="pnr_{index}"
                    placeholder="e.g. ABC123DEF (Optional)" 
                    bind:value={passenger.ticketPnr}
                  />
                  {#if validationErrors[`passengers_${index}_pnr`] || validationErrors[`passengers[${index}].ticketPnr`]}
                    <p class="text-[10px] text-destructive">{(validationErrors[`passengers_${index}_pnr`] || validationErrors[`passengers[${index}].ticketPnr`])[0]}</p>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </CardContent>
      </Card>
    </div>

    <!-- Right Column (Pricing, Supplier & Payment Panel) -->
    <div class="space-y-6">
      <!-- Pricing & Supplier Details Card (Common for the whole booking) -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Pricing & Supplier Details</CardTitle>
          <CardDescription>Booking fare and supplier selection.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-1.5">
            <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer mb-2">
              <input type="checkbox" bind:checked={isInhouse} class="accent-primary" />
              <span>In-house Booking</span>
            </label>
          </div>

          <div class="space-y-1.5">
            <label for="amountInput" class="text-xs font-semibold text-muted-foreground">Total Ticket Price (BHD) *</label>
            <div class="relative">
              <span class="absolute left-3 top-2.5 text-xs text-muted-foreground">BHD</span>
              <Input
                id="amountInput"
                type="number"
                step="0.001"
                min="0"
                class="pl-11 font-mono"
                value={amount}
                oninput={(e) => amount = Number(e.currentTarget.value) || 0}
                required
              />
            </div>
            {#if validationErrors.amount}
              <p class="text-xs text-destructive">{validationErrors.amount[0]}</p>
            {/if}
          </div>

          {#if !isInhouse}
            <div class="space-y-3.5 border-t border-border pt-4">
              <div class="space-y-1.5">
                <label for="supplierSelect" class="text-xs font-semibold text-muted-foreground">Supplier Partner *</label>
                <select
                  id="supplierSelect"
                  class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none cursor-pointer font-semibold"
                  value={supplierId === null ? '' : supplierId}
                  onchange={(e) => supplierId = Number(e.currentTarget.value) || null}
                  required
                >
                  <option value="">Select Supplier</option>
                  {#each suppliers as sup}
                    <option value={sup.id}>{sup.name}</option>
                  {/each}
                </select>
                {#if validationErrors.supplierId}
                  <p class="text-xs text-destructive">{validationErrors.supplierId[0]}</p>
                {/if}
              </div>

              <div class="space-y-1.5">
                <label for="supplierCostInput" class="text-xs font-semibold text-muted-foreground">Supplier Net Cost (BHD) *</label>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-xs text-muted-foreground">BHD</span>
                  <Input
                    id="supplierCostInput"
                    type="number"
                    step="0.001"
                    min="0"
                    class="pl-11 font-mono"
                    value={expectedSupplierCost}
                    oninput={(e) => expectedSupplierCost = Number(e.currentTarget.value) || 0}
                    required
                  />
                </div>
                {#if validationErrors.expectedSupplierCost}
                  <p class="text-xs text-destructive">{validationErrors.expectedSupplierCost[0]}</p>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Live Summary Breakdown -->
          <div class="border-t border-border pt-3 space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Travelers:</span>
              <span class="font-semibold text-foreground">{passengers.length} {passengers.length === 1 ? 'Passenger' : 'Passengers'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Selling Price:</span>
              <span class="font-mono font-semibold text-foreground">BHD {amount.toFixed(3)}</span>
            </div>
            {#if !isInhouse}
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Supplier Cost:</span>
                <span class="font-mono text-muted-foreground">BHD {expectedSupplierCost.toFixed(3)}</span>
              </div>
            {/if}
          </div>
        </CardContent>
      </Card>

      <!-- Payment & Settlement Card -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Payment Method</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <CustomerAccountWidget headId={clientType === 'customer' ? headId : agentId} headType={clientType === 'agent' ? 'Agent' : 'Customer'} />
          </div>

          <!-- Form submit button -->
          <Button 
            id="submitFlightBookingBtn"
            type="submit" 
            class="w-full mt-4 gap-1.5" 
            disabled={submitting || (clientType === 'customer' && !headId)}
          >
            {#if submitting}
              <Loader2 class="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            {:else}
              <Save class="h-4 w-4" />
              <span>Save Booking</span>
            {/if}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</form>
