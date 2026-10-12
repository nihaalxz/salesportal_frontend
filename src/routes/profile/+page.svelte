<script lang="ts">
  import { formatDate } from '$lib/formatters/date';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import MoneyDisplay from '$lib/components/MoneyDisplay.svelte';
  import { authState } from '$lib/auth/session';
  import { apiFetch, getAvatarUrl } from '$lib/api/client';
  import { getDashboardSummary, getProfileTargetMetrics } from '$lib/features/dashboard/api/dashboard-api';
  import { 
    getProfitByService, 
    fetchSalesmanApplicationProfitList,
    type SalesmanServiceProfitSummary,
    type ApplicationProfitItem 
  } from '$lib/features/profit/api/profit-api';
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import * as Alert from '$lib/components/ui/alert';
  import { 
    User, 
    Mail, 
    Briefcase, 
    Lock, 
    CheckCircle, 
    TrendingUp, 
    Loader2,
    Camera,
    Calendar,
    Filter,
    Search,
    ExternalLink,
    FileText,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    CheckCircle2,
    Clock,
    RefreshCw,
    Target
  } from 'lucide-svelte';

  // Profile image upload state
  let profilePic = $state<string | null>(null);
  let originalPic = $state<string | null>(null);
  let savingPic = $state(false);
  let avatarSuccessMsg = $state('');
  let avatarErrorMsg = $state('');

  // Local state for password change
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let changingPassword = $state(false);
  let passwordSuccessMsg = $state('');
  let passwordErrorMsg = $state('');

  // Targets state
  let currentVolume = $state(0);
  let currentProfit = $state(0);
  let volumeTarget = $state(0);
  let profitTarget = $state(0);

  let serviceProfitSummary = $state<SalesmanServiceProfitSummary | null>(null);

  // Applications & Breakdown state
  let allApplications = $state<ApplicationProfitItem[]>([]);
  let isLoadingApplications = $state(true);
  let isRefreshing = $state(false);

  // Filter state
  type DatePreset = 'all' | 'today' | 'this_month' | 'last_month' | 'this_year' | 'custom';
  let datePreset = $state<DatePreset>('all');
  let customStartDate = $state('');
  let customEndDate = $state('');
  let selectedServiceFilter = $state<string>('All');
  let searchTerm = $state('');
  let currentPage = $state(1);
  const itemsPerPage = 10;

  async function loadData() {
    isLoadingApplications = true;
    try {
      const targetMetrics = await getProfileTargetMetrics();
      currentVolume = (targetMetrics?.monthlyVolume && targetMetrics.monthlyVolume > 0) ? targetMetrics.monthlyVolume : (targetMetrics?.allTimeVolume ?? 0);
      currentProfit = (targetMetrics?.monthlyProfit && targetMetrics.monthlyProfit !== 0) ? targetMetrics.monthlyProfit : (targetMetrics?.allTimeProfit ?? 0);
      if (targetMetrics?.monthlyTarget !== undefined) {
        volumeTarget = targetMetrics.monthlyTarget;
      }
      if (targetMetrics?.profitTarget !== undefined) {
        profitTarget = targetMetrics.profitTarget;
      }
    } catch {
      try {
        const summary = await getDashboardSummary();
        currentVolume = summary?.totalPayableAmount ?? 0;
        currentProfit = summary?.totalProfit ?? 0;
      } catch {
        // Fallback
      }
    }

    try {
      serviceProfitSummary = await getProfitByService();
    } catch {
      // Non-fatal
    }

    try {
      allApplications = await fetchSalesmanApplicationProfitList();
    } catch {
      allApplications = [];
    } finally {
      isLoadingApplications = false;
      isRefreshing = false;
    }
  }

  onMount(() => {
    loadData();
  });

  async function refreshData() {
    isRefreshing = true;
    await loadData();
  }

  const volumePercent = $derived(
    volumeTarget > 0 ? Math.min(100, Math.max(0, (currentVolume / volumeTarget) * 100)) : 0
  );
  const profitPercent = $derived(
    profitTarget > 0 ? Math.min(100, Math.max(0, (currentProfit / profitTarget) * 100)) : 0
  );

  // Derived user details from auth state
  const userName = $derived($authState.user?.name ?? 'John Salesman');
  const userEmail = $derived($authState.user?.email ?? 'john.sales@texastravelsbh.com');
  const userRole = $derived($authState.user?.role ?? 'Salesman');

  // Derive initials
  const userInitials = $derived(
    userName
      .split(' ')
      .map(w => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'JS'
  );

  // Tab navigation state ('account' | 'targets')
  let activeTab = $derived<'account' | 'targets'>(
    ($page.url.searchParams.get('tab') === 'targets' || $page.url.searchParams.get('tab') === 'profit') ? 'targets' : 'account'
  );

  function handleTabChange(tab: 'account' | 'targets') {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('tab', tab);
    goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
  }

  // Initialize profile pic when authState is hydrated
  $effect(() => {
    if ($authState.user && profilePic === null && originalPic === null) {
      const resolved = getAvatarUrl($authState.user.avatar);
      profilePic = resolved;
      originalPic = resolved;
    }
  });

  const hasUnsavedPic = $derived(profilePic !== originalPic);

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        profilePic = event.target?.result as string;
        avatarSuccessMsg = '';
        avatarErrorMsg = '';
      };
      reader.readAsDataURL(file);
    }
  }

  function cancelProfilePicChange() {
    profilePic = originalPic;
    avatarSuccessMsg = '';
    avatarErrorMsg = '';
  }

  async function saveProfilePic() {
    if (!profilePic) return;
    savingPic = true;
    avatarSuccessMsg = '';
    avatarErrorMsg = '';

    try {
      const res = await apiFetch<{ avatar: string }>('/api/auth/me/avatar', {
        method: 'POST',
        body: JSON.stringify({ avatarData: profilePic })
      });

      const resolved = getAvatarUrl(res.avatar);
      originalPic = resolved;
      profilePic = resolved;

      authState.update(state => {
        if (state.user) {
          state.user.avatar = res.avatar;
        }
        return state;
      });

      avatarSuccessMsg = 'Profile picture successfully updated!';
    } catch (err: any) {
      avatarErrorMsg = err?.detail || err?.message || 'Failed to update profile picture.';
      profilePic = originalPic;
    } finally {
      savingPic = false;
    }
  }

  async function handlePasswordUpdate(e: SubmitEvent) {
    e.preventDefault();
    passwordSuccessMsg = '';
    passwordErrorMsg = '';

    if (!currentPassword) {
      passwordErrorMsg = 'Please enter your current password.';
      return;
    }
    if (newPassword.length < 6) {
      passwordErrorMsg = 'New password must be at least 6 characters.';
      return;
    }
    if (newPassword !== confirmPassword) {
      passwordErrorMsg = 'New passwords do not match.';
      return;
    }

    changingPassword = true;
    
    try {
      await apiFetch('/api/auth/me/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      passwordSuccessMsg = 'Password successfully updated!';
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
    } catch (err: any) {
      passwordErrorMsg = err?.detail || err?.message || 'Failed to update password. Please check your current password.';
    } finally {
      changingPassword = false;
    }
  }

  // ─── Filter & Aggregations Logic ──────────────────────────────────────────
  const dateRange = $derived.by(() => {
    const now = new Date();
    if (datePreset === 'all') {
      return { start: null, end: null, label: 'All Time' };
    }
    if (datePreset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end, label: 'Today' };
    }
    if (datePreset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, label: 'This Month' };
    }
    if (datePreset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, label: 'Last Month' };
    }
    if (datePreset === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end, label: 'This Year' };
    }
    if (datePreset === 'custom') {
      const start = customStartDate ? new Date(customStartDate + 'T00:00:00') : null;
      const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : null;
      const label = customStartDate && customEndDate 
        ? `${customStartDate} to ${customEndDate}` 
        : (customStartDate ? `From ${customStartDate}` : (customEndDate ? `Until ${customEndDate}` : 'Custom Range'));
      return { start, end, label };
    }
    return { start: null, end: null, label: 'All Time' };
  });

  const filteredApplications = $derived.by(() => {
    let list = allApplications;
    const { start, end } = dateRange;

    if (start) {
      list = list.filter(item => {
        if (!item.createdAt) return false;
        const d = new Date(item.createdAt);
        return d >= start;
      });
    }

    if (end) {
      list = list.filter(item => {
        if (!item.createdAt) return false;
        const d = new Date(item.createdAt);
        return d <= end;
      });
    }

    if (selectedServiceFilter !== 'All') {
      list = list.filter(item => item.serviceType.toLowerCase() === selectedServiceFilter.toLowerCase());
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(item => 
        item.documentNumber.toLowerCase().includes(term) ||
        item.clientName.toLowerCase().includes(term) ||
        item.serviceType.toLowerCase().includes(term)
      );
    }

    return list;
  });

  const filteredSummary = $derived.by(() => {
    const totalSales = filteredApplications.reduce((sum, item) => sum + item.payableAmount, 0);
    const totalCost = filteredApplications.reduce((sum, item) => sum + item.supplierCost, 0);
    const totalProfit = filteredApplications.reduce((sum, item) => sum + item.profitAmount, 0);
    const settledProfit = filteredApplications.filter(i => i.isSettled).reduce((sum, item) => sum + item.profitAmount, 0);
    const estimatedProfit = filteredApplications.filter(i => !i.isSettled).reduce((sum, item) => sum + item.profitAmount, 0);
    const totalBookings = filteredApplications.length;
    const settledBookings = filteredApplications.filter(i => i.isSettled).length;

    const serviceTypes = ['Visa', 'VFS', 'Flight', 'Hotel', 'Transport', 'Holiday', 'Other'] as const;
    const breakdown = serviceTypes.map(st => {
      const matching = filteredApplications.filter(a => a.serviceType.toLowerCase() === st.toLowerCase());
      return {
        serviceType: st,
        bookingCount: matching.length,
        finalizedCount: matching.filter(m => m.isSettled).length,
        payableAmount: matching.reduce((sum, m) => sum + m.payableAmount, 0),
        supplierCost: matching.reduce((sum, m) => sum + m.supplierCost, 0),
        profitAmount: matching.reduce((sum, m) => sum + m.profitAmount, 0)
      };
    }).filter(b => b.bookingCount > 0);

    return {
      totalSales,
      totalCost,
      totalProfit,
      settledProfit,
      estimatedProfit,
      totalBookings,
      settledBookings,
      breakdown
    };
  });

  const totalPages = $derived(Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage)));

  const paginatedApplications = $derived.by(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredApplications.slice(startIdx, startIdx + itemsPerPage);
  });

  // Reset page to 1 whenever filters change
  $effect(() => {
    datePreset;
    customStartDate;
    customEndDate;
    selectedServiceFilter;
    searchTerm;
    currentPage = 1;
  });

  function getServiceBadgeClass(service: string): string {
    switch (service.toLowerCase()) {
      case 'visa':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'flight':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'hotel':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'vfs':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'transport':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'holiday':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }

</script>

<PageHeader title="Profile Settings" description="View account details, monthly sales targets, and authoritative profit breakdown." />

<div class="w-full space-y-6">
  <!-- Profile Header Card -->
  <Card class="bg-card border-none shadow-md overflow-hidden relative">
    <div class="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"></div>
    <CardContent class="pt-6 relative z-10">
      <div class="flex flex-col sm:flex-row items-center gap-6">
        <div class="relative group h-20 w-20 rounded-full overflow-hidden shrink-0 border border-primary/30 shadow-sm bg-background">
          {#if profilePic}
            <img src={profilePic} alt="Profile" class="h-full w-full object-cover" />
          {:else}
            <div class="h-full w-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl">
              {userInitials}
            </div>
          {/if}
          <!-- Change Hover Overlay -->
          <label class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-semibold">
            <Camera class="h-5 w-5 mb-0.5" />
            <span>Change</span>
            <input type="file" accept="image/*" class="hidden" onchange={handleFileChange} />
          </label>
        </div>
        <div class="flex-1 text-center sm:text-left space-y-1">
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 class="text-xl font-bold text-foreground">{userName}</h2>
            <span class="inline-flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20 self-center">
              Active Account
            </span>
          </div>
          <p class="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
            <Mail class="h-3.5 w-3.5" />
            <span>{userEmail}</span>
          </p>
          <p class="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
            <Briefcase class="h-3.5 w-3.5" />
            <span>{userRole} • sales team member</span>
          </p>

          {#if avatarErrorMsg}
            <p class="text-xs text-destructive pt-1 text-center sm:text-left">{avatarErrorMsg}</p>
          {/if}
          {#if avatarSuccessMsg}
            <p class="text-xs text-success font-medium pt-1 text-center sm:text-left">{avatarSuccessMsg}</p>
          {/if}

          {#if hasUnsavedPic}
            <div class="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <Button size="sm" onclick={saveProfilePic} disabled={savingPic} class="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
                {#if savingPic}
                  <Loader2 class="h-3 w-3 animate-spin mr-1" />
                  Saving...
                {:else}
                  Save Photo
                {/if}
              </Button>
              <Button size="sm" variant="outline" onclick={cancelProfilePicChange} disabled={savingPic} class="h-8 text-xs border-border hover:bg-muted text-foreground">
                Cancel
              </Button>
            </div>
          {/if}
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Profile Navigation Tabs -->
  <div class="border-b border-border">
    <nav class="flex gap-6 -mb-[1px]">
      <button
        onclick={() => activeTab = 'account'}
        class="pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 focus:outline-none cursor-pointer {activeTab === 'account' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
      >
        <User class="h-4 w-4" />
        <span>Account & Security</span>
      </button>
      <button
        onclick={() => activeTab = 'targets'}
        class="pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 focus:outline-none cursor-pointer {activeTab === 'targets' ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}"
      >
        <TrendingUp class="h-4 w-4" />
        <span>Targets & Profit Breakdown</span>
      </button>
    </nav>
  </div>

  {#if activeTab === 'account'}
    <!-- Account Settings Tab Content -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Account Info Details -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <User class="h-4.5 w-4.5 text-indigo-500" />
            <span>Account Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1">
            <span class="text-[10px] uppercase font-bold text-muted-foreground">Full Name</span>
            <p class="text-sm font-medium text-foreground">{userName}</p>
          </div>
          <div class="space-y-1">
            <span class="text-[10px] uppercase font-bold text-muted-foreground">Email Address</span>
            <p class="text-sm font-medium text-foreground">{userEmail}</p>
          </div>
          <div class="space-y-1">
            <span class="text-[10px] uppercase font-bold text-muted-foreground">User Position</span>
            <p class="text-sm font-medium text-foreground">{userRole}</p>
          </div>
          <div class="space-y-1">
            <span class="text-[10px] uppercase font-bold text-muted-foreground">Account Status</span>
            <p class="text-sm font-medium text-success flex items-center gap-1.5">
              <CheckCircle2 class="h-4 w-4 text-success" />
              <span>Active Account</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Password Change Security -->
      <Card class="bg-card">
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <Lock class="h-4.5 w-4.5 text-rose-500" />
            <span>Update Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onsubmit={handlePasswordUpdate} class="space-y-4">
            {#if passwordErrorMsg}
              <div class="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-xs">
                {passwordErrorMsg}
              </div>
            {/if}

            {#if passwordSuccessMsg}
              <div class="p-3 bg-success/10 border border-success/20 rounded text-success text-xs font-medium flex items-center gap-1.5">
                <CheckCircle class="h-4 w-4 shrink-0 text-success" />
                <span>{passwordSuccessMsg}</span>
              </div>
            {/if}

            <div class="space-y-1.5">
              <label for="currentPasswordInput" class="text-xs font-semibold text-muted-foreground">Current Password</label>
              <Input 
                id="currentPasswordInput"
                type="password" 
                placeholder="••••••••" 
                bind:value={currentPassword}
                required
              />
            </div>

            <div class="space-y-1.5">
              <label for="newPasswordInput" class="text-xs font-semibold text-muted-foreground">New Password</label>
              <Input 
                id="newPasswordInput"
                type="password" 
                placeholder="••••••••" 
                bind:value={newPassword}
                required
              />
            </div>

            <div class="space-y-1.5">
              <label for="confirmPasswordInput" class="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
              <Input 
                id="confirmPasswordInput"
                type="password" 
                placeholder="••••••••" 
                bind:value={confirmPassword}
                required
              />
            </div>

            <Button type="submit" class="w-full mt-2" disabled={changingPassword}>
              {#if changingPassword}
                <Loader2 class="h-4 w-4 animate-spin mr-1.5" />
                <span>Saving Credentials...</span>
              {:else}
                <span>Change Password</span>
              {/if}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  {:else if activeTab === 'targets'}
    <!-- Targets & Profit Tab Content -->
    <div class="space-y-6">
      <!-- Target & Progress Summary -->
      <Card class="bg-card border border-border shadow-xs">
        <CardHeader class="pb-3 border-b border-border/50">
          <CardTitle class="text-base flex items-center justify-between">
            <span class="flex items-center gap-2">
              <Target class="h-4.5 w-4.5 text-emerald-500" />
              <span>Monthly Sales Target & Performance</span>
            </span>
            <span class="text-xs font-normal text-muted-foreground">Current month quota metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Monthly Sales Volume Target -->
            <div class="space-y-2 bg-muted/20 p-4 rounded-xl border border-border">
              <div class="flex items-center justify-between text-xs font-semibold">
                <span class="text-muted-foreground uppercase flex items-center gap-1.5">
                  <DollarSign class="h-3.5 w-3.5 text-primary" />
                  Monthly Sales Volume Target
                </span>
                {#if volumeTarget > 0}
                  <span class="font-mono text-foreground font-bold">
                    <MoneyDisplay amount={currentVolume} /> / <MoneyDisplay amount={volumeTarget} />
                  </span>
                {:else}
                  <span class="font-mono text-muted-foreground font-semibold">
                    <MoneyDisplay amount={currentVolume} /> <span class="text-[10px] text-muted-foreground font-normal">(No target set)</span>
                  </span>
                {/if}
              </div>
              {#if volumeTarget > 0}
                <div class="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all duration-500" style="width: {volumePercent}%"></div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Progress toward volume quota</span>
                  <span class="font-bold text-foreground">{volumePercent.toFixed(1)}% achieved</span>
                </div>
              {:else}
                <p class="text-[10px] text-muted-foreground">No monthly volume target assigned by Accounts yet.</p>
              {/if}
            </div>

            <!-- Monthly Profit Target -->
            <div class="space-y-2 bg-muted/20 p-4 rounded-xl border border-border">
              <div class="flex items-center justify-between text-xs font-semibold">
                <span class="text-muted-foreground uppercase flex items-center gap-1.5">
                  <TrendingUp class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Monthly Profit Target
                </span>
                {#if profitTarget > 0}
                  <span class="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    <MoneyDisplay amount={currentProfit} /> / <MoneyDisplay amount={profitTarget} />
                  </span>
                {:else}
                  <span class="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    <MoneyDisplay amount={currentProfit} /> <span class="text-[10px] text-muted-foreground font-normal">(No target set)</span>
                  </span>
                {/if}
              </div>
              {#if profitTarget > 0}
                <div class="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: {profitPercent}%"></div>
                </div>
                <div class="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Progress toward profit quota</span>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">{profitPercent.toFixed(1)}% achieved</span>
                </div>
              {:else}
                <p class="text-[10px] text-muted-foreground">No monthly profit target assigned by Accounts yet.</p>
              {/if}
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- ─── Full-Width Section: Authoritative Profit & Application-Wise Breakdown ─── -->
      <Card class="bg-card shadow-sm border border-border">
        <CardHeader class="pb-4 border-b border-border space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle class="text-lg font-bold flex items-center gap-2 text-foreground">
                <TrendingUp class="h-5 w-5 text-emerald-500" />
                <span>Authoritative Profit & Application Breakdown</span>
              </CardTitle>
              <p class="text-xs text-muted-foreground mt-0.5">
                Detailed application-wise profitability and service aggregates for <strong class="text-foreground">{dateRange.label}</strong>.
              </p>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm" 
                onclick={refreshData} 
                disabled={isRefreshing || isLoadingApplications}
                class="h-8 text-xs gap-1.5"
              >
                <RefreshCw class="h-3.5 w-3.5 {isRefreshing ? 'animate-spin' : ''}" />
                <span>Refresh</span>
              </Button>

              <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <span class="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Filtered Profit:</span>
                <span class="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  <MoneyDisplay amount={filteredSummary.totalProfit} />
                </span>
              </div>
            </div>
          </div>

          <!-- Date Filtering Controls Bar -->
          <div class="pt-2 flex flex-col gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                <Calendar class="h-3.5 w-3.5" />
                <span>Date Range:</span>
              </span>

              <Button 
                variant={datePreset === 'all' ? 'default' : 'outline'} 
                size="sm" 
                class="h-7 text-xs px-2.5 rounded-full" 
                onclick={() => datePreset = 'all'}
              >
                All Time
              </Button>
              <Button 
                variant={datePreset === 'today' ? 'default' : 'outline'} 
                size="sm" 
                class="h-7 text-xs px-2.5 rounded-full" 
                onclick={() => datePreset = 'today'}
              >
                Today
              </Button>
              <Button 
                variant={datePreset === 'this_month' ? 'default' : 'outline'} 
                size="sm" 
                class="h-7 text-xs px-2.5 rounded-full" 
                onclick={() => datePreset = 'this_month'}
              >
                This Month
              </Button>
              <Button 
                variant={datePreset === 'last_month' ? 'default' : 'outline'} 
                size="sm" 
                class="h-7 text-xs px-2.5 rounded-full" 
                onclick={() => datePreset = 'last_month'}
              >
                Last Month
              </Button>
              <Button 
                variant={datePreset === 'this_year' ? 'default' : 'outline'} 
                size="sm" 
                class="h-7 text-xs px-2.5 rounded-full" 
                onclick={() => datePreset = 'this_year'}
              >
                This Year
              </Button>
              <Button 
                variant={datePreset === 'custom' ? 'default' : 'outline'} 
                size="sm" 
                class="h-7 text-xs px-2.5 rounded-full gap-1" 
                onclick={() => datePreset = 'custom'}
              >
                <Filter class="h-3 w-3" />
                <span>Custom Range</span>
              </Button>
            </div>

            {#if datePreset === 'custom'}
              <div class="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border mt-1">
                <div class="flex items-center gap-2">
                  <label for="startDateInput" class="text-xs font-semibold text-muted-foreground whitespace-nowrap">From:</label>
                  <Input 
                    id="startDateInput"
                    type="date" 
                    class="h-8 text-xs w-36 bg-background" 
                    bind:value={customStartDate} 
                  />
                </div>
                <div class="flex items-center gap-2">
                  <label for="endDateInput" class="text-xs font-semibold text-muted-foreground whitespace-nowrap">To:</label>
                  <Input 
                    id="endDateInput"
                    type="date" 
                    class="h-8 text-xs w-36 bg-background" 
                    bind:value={customEndDate} 
                  />
                </div>
                {#if customStartDate || customEndDate}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    class="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onclick={() => { customStartDate = ''; customEndDate = ''; }}
                  >
                    Clear Dates
                  </Button>
                {/if}
              </div>
            {/if}

            <!-- Service filter pills and search bar -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              <div class="flex flex-wrap items-center gap-1.5">
                {#each ['All', 'Visa', 'VFS', 'Flight', 'Hotel', 'Transport', 'Holiday', 'Other'] as s}
                  <Button 
                    variant={selectedServiceFilter === s ? 'secondary' : 'ghost'}
                    size="sm"
                    class="h-7 text-xs px-2.5 {selectedServiceFilter === s ? 'font-bold shadow-xs' : 'text-muted-foreground'}"
                    onclick={() => selectedServiceFilter = s}
                  >
                    {s}
                  </Button>
                {/each}
              </div>

              <div class="relative w-full md:w-64">
                <Search class="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search App # or Client..." 
                  class="h-8 text-xs pl-8 bg-background" 
                  bind:value={searchTerm} 
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-6 pt-6">
          <!-- KPI Metric Chips for the filtered period -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-semibold uppercase text-muted-foreground">Applications</span>
              <p class="text-base font-bold font-mono text-foreground">
                {filteredSummary.totalBookings} <span class="text-xs font-normal text-muted-foreground">({filteredSummary.settledBookings} settled)</span>
              </p>
            </div>

            <div class="p-3 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-semibold uppercase text-muted-foreground">Total Sales</span>
              <p class="text-base font-bold font-mono text-foreground">
                <MoneyDisplay amount={filteredSummary.totalSales} />
              </p>
            </div>

            <div class="p-3 bg-muted/20 border border-border rounded-xl space-y-1">
              <span class="text-[10px] font-semibold uppercase text-muted-foreground">Supplier Cost</span>
              <p class="text-base font-bold font-mono text-muted-foreground">
                <MoneyDisplay amount={filteredSummary.totalCost} />
              </p>
            </div>

            <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
              <span class="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Total Profit</span>
              <p class="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                <MoneyDisplay amount={filteredSummary.totalProfit} />
              </p>
            </div>
          </div>

          <!-- Service-wise Aggregation Table -->
          {#if filteredSummary.breakdown.length > 0}
            <div class="space-y-2">
              <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Service Aggregates ({dateRange.label})</span>
              </h4>

              <div class="border border-border rounded-lg overflow-x-auto">
                <table class="w-full text-xs">
                  <thead class="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                    <tr>
                      <th class="py-2.5 px-3 text-left">Service</th>
                      <th class="py-2.5 px-3 text-center">Applications</th>
                      <th class="py-2.5 px-3 text-right">Sales</th>
                      <th class="py-2.5 px-3 text-right">Cost</th>
                      <th class="py-2.5 px-3 text-right">Profit</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    {#each filteredSummary.breakdown as b}
                      <tr class="hover:bg-muted/20 transition-colors">
                        <td class="py-2.5 px-3 font-medium text-foreground">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border {getServiceBadgeClass(b.serviceType)}">
                            {b.serviceType}
                          </span>
                        </td>
                        <td class="py-2.5 px-3 text-center font-mono text-muted-foreground">
                          {b.bookingCount} <span class="text-[10px] text-muted-foreground/70">({b.finalizedCount} settled)</span>
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          <MoneyDisplay amount={b.payableAmount} />
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          <MoneyDisplay amount={b.supplierCost} />
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <MoneyDisplay amount={b.profitAmount} />
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          {/if}

          <!-- Individual Application-wise Breakdown Table -->
          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <FileText class="h-3.5 w-3.5 text-primary" />
                <span>Individual Application-wise Profit Ledger ({filteredApplications.length})</span>
              </h4>
              <span class="text-[11px] text-muted-foreground font-mono">
                Showing {filteredApplications.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of {filteredApplications.length}
              </span>
            </div>

            {#if isLoadingApplications}
              <div class="py-12 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl bg-muted/10">
                <Loader2 class="h-6 w-6 animate-spin text-primary" />
                <p class="text-xs text-muted-foreground">Loading application profit records...</p>
              </div>
            {:else if paginatedApplications.length === 0}
              <div class="py-12 text-center border border-dashed border-border rounded-xl bg-muted/10 space-y-2">
                <Filter class="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p class="text-sm font-semibold text-foreground">No applications found</p>
                <p class="text-xs text-muted-foreground max-w-sm mx-auto">
                  No application bookings match the selected date range ({dateRange.label}) or service filter.
                </p>
              </div>
            {:else}
              <div class="border border-border rounded-xl overflow-x-auto shadow-xs">
                <table class="w-full text-xs text-left border-collapse">
                  <thead class="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th class="py-3 px-3.5">App / Ref #</th>
                      <th class="py-3 px-3.5">Service</th>
                      <th class="py-3 px-3.5">Client / Details</th>
                      <th class="py-3 px-3.5">Date</th>
                      <th class="py-3 px-3.5 text-right">Selling Price</th>
                      <th class="py-3 px-3.5 text-right">Cost</th>
                      <th class="py-3 px-3.5 text-right">Profit</th>
                      <th class="py-3 px-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    {#each paginatedApplications as app}
                      <tr class="hover:bg-muted/20 transition-colors">
                        <td class="py-3 px-3.5">
                          <a 
                            href={app.detailUrl} 
                            class="font-mono font-bold text-primary hover:underline inline-flex items-center gap-1"
                            title="View details for {app.documentNumber}"
                          >
                            <span>{app.documentNumber}</span>
                            <ExternalLink class="h-2.5 w-2.5 opacity-60" />
                          </a>
                        </td>

                        <td class="py-3 px-3.5">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border {getServiceBadgeClass(app.serviceType)}">
                            {app.serviceType}
                          </span>
                        </td>

                        <td class="py-3 px-3.5 font-medium text-foreground truncate max-w-[180px]">
                          {app.clientName}
                        </td>

                        <td class="py-3 px-3.5 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                          {formatDate(app.createdAt)}
                        </td>

                        <td class="py-3 px-3.5 text-right font-mono font-semibold text-foreground">
                          <MoneyDisplay amount={app.payableAmount} />
                        </td>

                        <td class="py-3 px-3.5 text-right font-mono text-muted-foreground">
                          <MoneyDisplay amount={app.supplierCost} />
                        </td>

                        <td class="py-3 px-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <MoneyDisplay amount={app.profitAmount} />
                        </td>

                        <td class="py-3 px-3.5 text-center">
                          {#if app.costSource === 'Rejection'}
                            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Rejection
                            </span>
                          {:else if app.isSettled}
                            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 class="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                              Settled
                            </span>
                          {:else}
                            <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Clock class="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                              Estimated
                            </span>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>

              <!-- Pagination Footer -->
              {#if totalPages > 1}
                <div class="flex items-center justify-between pt-2">
                  <span class="text-xs text-muted-foreground font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div class="flex items-center gap-1.5">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      class="h-7 text-xs px-2.5 gap-1"
                      disabled={currentPage <= 1}
                      onclick={() => currentPage = Math.max(1, currentPage - 1)}
                    >
                      <ChevronLeft class="h-3 w-3" />
                      <span>Previous</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      class="h-7 text-xs px-2.5 gap-1"
                      disabled={currentPage >= totalPages}
                      onclick={() => currentPage = Math.min(totalPages, currentPage + 1)}
                    >
                      <span>Next</span>
                      <ChevronRight class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              {/if}
            {/if}
          </div>
        </CardContent>
      </Card>
    </div>
  {/if}
</div>
