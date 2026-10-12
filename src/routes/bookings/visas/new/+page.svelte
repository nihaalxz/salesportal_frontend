<script lang="ts">
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import HeadSelect from '$lib/components/HeadSelect.svelte';
  import CustomerAccountWidget from '$lib/features/customer-accounts/components/CustomerAccountWidget.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import {
    createVisaBooking,
    getVisaCountries,
    getVisaPackages,
    type VisaCountryMaster,
    type VisaPackageMaster,
    type HeadLookup
  } from '$lib/features/visas/api/visas-api';
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
    FileText
  } from 'lucide-svelte';
  import { onMount } from 'svelte';

  interface ApplicantInput {
    prefix: string;
    fName: string;
    lName: string;
    dob: string;
    nationality: string;
    contactNo: string;
    emailId: string;
    passportNo: string;
    iqamaHotelNo: string;
    amount: number;
    expectedSupplierCost: number;
    isInhouse: boolean;
    passportFile?: File | null;
    bankStatementFile?: File | null;
    iqamaHotelFile?: File | null;
  }

  // Form State
  let clientType = $state('customer');
  let headId = $state<number | null>(null);
  let agent = $state('');
  let agentId = $state<number | null>(null);
  
  let countryId = $state<number | null>(null);
  let visaPackId = $state<number | null>(null);
  
  let countries = $state<VisaCountryMaster[]>([]);
  let allVisaPackages = $state<VisaPackageMaster[]>([]);
  let loadingVisaMaster = $state(false);

  let availableVisaPackages = $derived.by(() => {
    if (!countryId) return allVisaPackages;
    return allVisaPackages.filter(vp => vp.countryId === countryId);
  });
  
  let paymentMethod = $state('credit');
  let bankId = $state<number | null>(null);
  let bankName = $state('');
  let supplierId = $state<number | null>(null);


  // Dynamic applicants state
  let applicants = $state<ApplicantInput[]>([
    {
      prefix: 'Mr.',
      fName: '',
      lName: '',
      dob: '',
      nationality: '',
      contactNo: '',
      emailId: '',
      passportNo: '',
      iqamaHotelNo: '',
      amount: 0,
      expectedSupplierCost: 0,
      isInhouse: true,
      passportFile: null,
      bankStatementFile: null,
      iqamaHotelFile: null
    }
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
      const filtered = res.filter(s => s.categories && s.categories.some(c => c.toLowerCase().includes('visa')));
      suppliers = (filtered.length > 0 ? filtered : res).map(s => ({ id: s.id, name: s.name }));
    }).catch(err => {
      console.error('Failed to load suppliers:', err);
    });

    loadingVisaMaster = true;
    try {
      const [cList, pList] = await Promise.all([
        getVisaCountries(),
        getVisaPackages()
      ]);
      countries = cList || [];
      allVisaPackages = pList || [];
      if (countries.length > 0) {
        countryId = countries[0].id;
        const matchingPacks = allVisaPackages.filter(p => p.countryId === countries[0].id);
        if (matchingPacks.length > 0) {
          visaPackId = matchingPacks[0].id;
        }
      }
    } catch (err) {
      console.error('Failed to load visa master records from API:', err);
    } finally {
      loadingVisaMaster = false;
    }
  });

  // Generate unique idempotency key for this form session
  function getFreshIdempotencyKey() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'idemp-' + Math.random().toString(36).substring(2) + '-' + Date.now();
  }

  // Reactive calculations
  let totalAmount = $derived(applicants.reduce((sum, a) => sum + a.amount, 0));
  let totalSupplierCost = $derived(applicants.reduce((sum, a) => sum + (a.isInhouse ? 0 : a.expectedSupplierCost), 0));
  let totalProfit = $derived(applicants.reduce((sum, a) => sum + (a.isInhouse ? 0 : Math.max(0, a.amount - a.expectedSupplierCost)), 0));
  let anyExternal = $derived(applicants.some(a => !a.isInhouse));

  function selectHead(head: HeadLookup) {
    headId = head.id ?? null;
  }

  function addApplicant() {
    applicants = [...applicants, {
      prefix: 'Mr.',
      fName: '',
      lName: '',
      dob: '',
      nationality: '',
      contactNo: '',
      emailId: '',
      passportNo: '',
      iqamaHotelNo: '',
      amount: 0,
      expectedSupplierCost: 0,
      isInhouse: true,
      passportFile: null,
      bankStatementFile: null,
      iqamaHotelFile: null
    }];
  }

  function removeApplicant(index: number) {
    if (applicants.length > 1) {
      applicants = applicants.filter((_, i) => i !== index);
    }
  }

  // Predefined options
  const prefixes = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
  
  let suppliers = $state<{ id: number; name: string }[]>([]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitting = true;
    errorMsg = '';
    successMsg = '';
    validationErrors = {};

    // Basic frontend checks
    const errors: Record<string, string[]> = {};
    
    if (!countryId) errors.countryId = ['Target country is required.'];
    if (!visaPackId) errors.visaPackId = ['Visa package type is required.'];

    if (clientType === 'customer' && !headId) {
      errors.headId = ['Customer account head is required.'];
    }
    if (clientType === 'agent') {
      if (!agentId) {
        errors.agentId = ['Agent selection is required.'];
      }
    }

    if (anyExternal && !supplierId) {
      errors.supplierId = ['Supplier is required when external applicants are present.'];
    }

    // Applicants validation
    if (applicants.length === 0) {
      errors.applicants = ['At least one applicant is required.'];
    } else {
      applicants.forEach((a, i) => {
        if (a.contactNo.trim() && !/^\d+$/.test(a.contactNo.trim())) {
          errors[`applicants_${i}_contactNo`] = [`Contact number for Applicant ${i + 1} must contain digits only (0-9).`];
        }
        if (a.amount <= 0) {
          errors[`applicants_${i}_amount`] = [`Amount for Applicant ${i + 1} must be positive.`];
        }
        if (!a.passportFile) {
          errors[`applicants_${i}_passportFile`] = [`Passport file for Applicant ${i + 1} is required.`];
        }
        if (!a.isInhouse) {
          if (a.expectedSupplierCost < 0) {
            errors[`applicants_${i}_cost`] = [`Supplier cost for Applicant ${i + 1} must be non-negative.`];
          }
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      validationErrors = errors;
      submitting = false;
      return;
    }

    const visaPackName = allVisaPackages.find(vp => vp.id === visaPackId)?.name ?? '';

    const processedApplicants = await Promise.all(
      applicants.map(async a => ({
        prefix: a.prefix,
        fName: a.fName.trim() || null,
        lName: a.lName.trim() || null,
        dob: a.dob ? new Date(a.dob).toISOString() : null,
        nationality: a.nationality.trim() || null,
        careOf: null,
        contactNo: a.contactNo?.trim() || null,
        emailId: a.emailId?.trim() || null,
        passportNo: a.passportNo.trim() || null,
        passportCopy: a.passportFile ? await fileToBase64(a.passportFile) : null,
        iqamaHotelNo: a.iqamaHotelFile ? await fileToBase64(a.iqamaHotelFile) : (a.iqamaHotelNo || null),
        bankDoc: a.bankStatementFile ? await fileToBase64(a.bankStatementFile) : null,
        amount: a.amount,
        expectedSupplierCost: a.isInhouse ? 0 : a.expectedSupplierCost,
        isInhouse: a.isInhouse
      }))
    );

    // Prepare Request Body
    const request = {
      clientType,
      headId: clientType === 'customer' ? headId : null,
      agent: clientType === 'agent' ? agent : null,
      agentId: clientType === 'agent' ? agentId : null,
      countryId: countryId!,
      visaPackId: visaPackId!,
      visaPackName,
      paymentMethod,
      bankId: paymentMethod === 'online' ? bankId : null,
      bankName: paymentMethod === 'online' ? (realBanks.find(b => b.id === bankId)?.bankName ?? '') : null,
      paymentProof: null,
      paymentReference: null,
      supplierId: anyExternal ? supplierId : null,
      isInhouse: !anyExternal,
      applicants: processedApplicants
    };

    try {
      const response = await createVisaBooking(request, getFreshIdempotencyKey());
      const docNo = response.documentNumber;
      successMsg = `Visa application ${docNo} successfully created!`;
      setTimeout(() => {
        goto('/bookings/visas');
      }, 1000);
    } catch (err: any) {
      if (err.status === 422 || err.status === 400) {
        if (err.errors) {
          const mapped: Record<string, string[]> = { ...err.errors };
          Object.keys(err.errors).forEach(key => {
            const match = key.match(/^applicants\[(\d+)\]\.(.+)$/);
            if (match) {
              const idx = match[1];
              const field = match[2];
              if (field === 'passportCopy') {
                mapped[`applicants_${idx}_passportFile`] = err.errors[key];
              } else {
                mapped[`applicants_${idx}_${field}`] = err.errors[key];
              }
            }
          });
          validationErrors = mapped;
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

<PageHeader title="New Visa Booking" description="Record a new embassy/consulate visa application.">
  <Button onclick={() => goto('/bookings/visas')} variant="outline" size="sm" class="gap-1.5">
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
    <!-- Main Form Fields -->
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

      <!-- Visa Destination Card -->
      <Card class="bg-card !overflow-visible relative z-20">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Visa Package Details</CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="countrySelect" class="text-xs font-semibold text-muted-foreground">Destination Country *</label>
            <select 
              id="countrySelect"
              class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              value={countryId ?? ''}
              onchange={(e) => {
                const val = Number(e.currentTarget.value) || null;
                countryId = val;
                const matchingPacks = allVisaPackages.filter(p => p.countryId === val);
                if (matchingPacks.length > 0) {
                  visaPackId = matchingPacks[0].id;
                } else {
                  visaPackId = null;
                }
              }}
            >
              {#if loadingVisaMaster}
                <option value="">Loading countries...</option>
              {:else if countries.length === 0}
                <option value="">-- No Countries Configured in Master Accounts --</option>
              {:else}
                <option value="">-- Select Destination Country --</option>
                {#each countries as c}
                  <option value={c.id}>{c.name}</option>
                {/each}
              {/if}
            </select>
            {#if validationErrors.countryId}
              <p class="text-xs text-destructive">{validationErrors.countryId[0]}</p>
            {/if}
          </div>
          <div class="space-y-1.5">
            <label for="visaPackSelect" class="text-xs font-semibold text-muted-foreground">Visa Package *</label>
            <select 
              id="visaPackSelect"
              class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              bind:value={visaPackId}
            >
              {#if loadingVisaMaster}
                <option value="">Loading packages...</option>
              {:else if availableVisaPackages.length === 0}
                <option value="">-- No Visa Packages Available --</option>
              {:else}
                <option value="">-- Select Visa Package --</option>
                {#each availableVisaPackages as vp}
                  <option value={vp.id}>{vp.name}</option>
                {/each}
              {/if}
            </select>
            {#if validationErrors.visaPackId}
              <p class="text-xs text-destructive">{validationErrors.visaPackId[0]}</p>
            {/if}
          </div>
        </CardContent>
      </Card>

      <!-- Applicants List Card -->
      <Card class="bg-card">
        <CardHeader class="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle class="text-base">Visa Applicants</CardTitle>
            <CardDescription>Enter traveler personal info and selling amounts.</CardDescription>
          </div>
          <Button onclick={addApplicant} type="button" variant="outline" size="sm" class="hidden gap-1">
            <Plus class="h-3.5 w-3.5" />
            <span>Add Applicant</span>
          </Button>
        </CardHeader>
        <CardContent class="space-y-6 divide-y divide-border">
          {#each applicants as applicant, index}
            <div class="pt-4 first:pt-0 space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-primary">Applicant #{index + 1}</span>
                {#if applicants.length > 1}
                  <Button onclick={() => removeApplicant(index)} type="button" variant="ghost" size="icon" class="h-7 w-7 text-destructive hover:bg-destructive/10">
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                {/if}
              </div>

              <div class="grid grid-cols-12 gap-3">
                <div class="col-span-3 sm:col-span-2 space-y-1.5">
                  <label for="prefix_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Prefix</label>
                  <select 
                    id="prefix_{index}"
                    class="w-full text-xs bg-background border border-border rounded px-2 py-1.5 text-foreground focus:outline-none"
                    bind:value={applicant.prefix}
                  >
                    {#each prefixes as pref}
                      <option value={pref}>{pref}</option>
                    {/each}
                  </select>
                </div>

                <div class="col-span-9 sm:col-span-5 space-y-1.5">
                  <label for="fName_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">First Name (Optional)</label>
                  <Input 
                    id="fName_{index}"
                    placeholder="Given names" 
                    bind:value={applicant.fName}
                  />
                  {#if validationErrors[`applicants_${index}_fName`]}
                    <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_fName`][0]}</p>
                  {/if}
                </div>

                <div class="col-span-12 sm:col-span-5 space-y-1.5">
                  <label for="lName_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Last Name (Optional)</label>
                  <Input 
                    id="lName_{index}"
                    placeholder="Surname" 
                    bind:value={applicant.lName}
                  />
                  {#if validationErrors[`applicants_${index}_lName`]}
                    <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_lName`][0]}</p>
                  {/if}
                </div>

                <!-- Personal parameters -->
                <div class="col-span-6 sm:col-span-3 space-y-1.5">
                  <label for="dob_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Date of Birth</label>
                  <Input 
                    id="dob_{index}"
                    type="date"
                    bind:value={applicant.dob}
                  />
                </div>

                <div class="col-span-6 sm:col-span-3 space-y-1.5">
                  <label for="nationality_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Nationality (Optional)</label>
                  <Input 
                    id="nationality_{index}"
                    placeholder="e.g. Bahraini"
                    bind:value={applicant.nationality}
                  />
                  {#if validationErrors[`applicants_${index}_nationality`]}
                    <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_nationality`][0]}</p>
                  {/if}
                </div>

                <div class="col-span-6 sm:col-span-3 space-y-1.5">
                  <label for="passport_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Passport No (Optional)</label>
                  <Input 
                    id="passport_{index}"
                    placeholder="Enter passport number"
                    bind:value={applicant.passportNo}
                  />
                  {#if validationErrors[`applicants_${index}_passportNo`]}
                    <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_passportNo`][0]}</p>
                  {/if}
                </div>

                <div class="col-span-6 sm:col-span-3 space-y-1.5">
                  <label for="iqama_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <FileText class="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Iqama / Hotel File (Optional)</span>
                  </label>
                  <input
                    id="iqama_{index}"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    class="w-full text-xs bg-background border border-border rounded px-3 py-1.5 text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                    onchange={(e) => {
                      const files = e.currentTarget.files;
                      if (files && files.length > 0) {
                        applicant.iqamaHotelFile = files[0];
                      } else {
                        applicant.iqamaHotelFile = null;
                      }
                    }}
                  />
                </div>

                <!-- Contact details -->
                <div class="col-span-6 space-y-1.5">
                  <label for="contact_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Contact Number (Optional)</label>
                  <Input 
                    id="contact_{index}"
                    type="text"
                    inputmode="numeric"
                    placeholder="e.g. 97333333"
                    value={applicant.contactNo}
                    oninput={(e) => applicant.contactNo = e.currentTarget.value.replace(/[^0-9]/g, '')}
                  />
                  {#if validationErrors[`applicants_${index}_contactNo`]}
                    <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_contactNo`][0]}</p>
                  {/if}
                </div>

                <div class="col-span-6 space-y-1.5">
                  <label for="email_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase">Email Address (Optional)</label>
                  <Input 
                    id="email_{index}"
                    type="email"
                    placeholder="traveler@email.com"
                    bind:value={applicant.emailId}
                  />
                  {#if validationErrors[`applicants_${index}_emailId`]}
                    <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_emailId`][0]}</p>
                  {/if}
                </div>

                <!-- Pricing -->
                <div class="col-span-12 space-y-1.5">
                  <label for="amount_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase font-bold">Selling Price (BHD) *</label>
                  <Input 
                    id="amount_{index}"
                    type="number"
                    step="0.001"
                    min="0"
                    bind:value={applicant.amount}
                    required
                  />
                  {#if validationErrors[`applicants_${index}_amount`]}
                    <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_amount`][0]}</p>
                  {/if}
                </div>

                <!-- Passport File Uploads -->
                <div class="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                  <div class="space-y-1.5">
                    <label for="passFile_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <FileText class="h-3.5 w-3.5 text-primary" />
                      <span>Passport File *</span>
                    </label>
                    <input
                      id="passFile_{index}"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      class="w-full text-xs bg-background border border-border rounded px-3 py-1.5 text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                      onchange={(e) => {
                        const files = e.currentTarget.files;
                        if (files && files.length > 0) {
                          applicant.passportFile = files[0];
                        } else {
                          applicant.passportFile = null;
                        }
                      }}
                      required
                    />
                    {#if validationErrors[`applicants_${index}_passportFile`]}
                      <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_passportFile`][0]}</p>
                    {/if}
                  </div>

                  <div class="space-y-1.5">
                    <label for="bankStatement_{index}" class="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <FileText class="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Bank Statement (Optional)</span>
                    </label>
                    <input
                      id="bankStatement_{index}"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      class="w-full text-xs bg-background border border-border rounded px-3 py-1.5 text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer"
                      onchange={(e) => {
                        const files = e.currentTarget.files;
                        if (files && files.length > 0) {
                          applicant.bankStatementFile = files[0];
                        } else {
                          applicant.bankStatementFile = null;
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-4 bg-muted/20 p-3 rounded">
                <label class="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input type="checkbox" bind:checked={applicant.isInhouse} class="accent-primary" />
                  <span>In-house Sourced</span>
                </label>

                {#if !applicant.isInhouse}
                  <div class="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div class="w-full space-y-1">
                      <Input 
                        id="cost_{index}"
                        type="number"
                        step="0.001"
                        placeholder="Expected supplier cost (BHD)"
                        bind:value={applicant.expectedSupplierCost}
                        required
                      />
                      {#if validationErrors[`applicants_${index}_cost`]}
                        <p class="text-[10px] text-destructive">{validationErrors[`applicants_${index}_cost`][0]}</p>
                      {/if}
                    </div>
                  </div>

                  <div class="text-xs text-green-600 font-bold ml-auto">
                    Profit: BHD {(applicant.amount - applicant.expectedSupplierCost).toFixed(3)}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </CardContent>
      </Card>
    </div>

    <!-- Right Column (Financial & Payment Panel) -->
    <div class="space-y-6">
      
      <!-- Settlement Panel -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">Payment & Settlement</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Supplier Selection at Booking Level -->
          {#if anyExternal}
            <div class="space-y-1.5">
              <label for="supplierSelect" class="text-xs font-semibold text-muted-foreground">Visa Supplier *</label>
              <select 
                id="supplierSelect"
                class="w-full text-xs bg-background border border-border rounded px-3 py-2 text-foreground focus:outline-none cursor-pointer"
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
          {/if}

          <div>
            <CustomerAccountWidget headId={clientType === 'customer' ? headId : agentId} headType={clientType === 'agent' ? 'Agent' : 'Customer'} />
          </div>


          <!-- Form submit button -->
          <Button 

            id="submitVisaBookingBtn"
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
