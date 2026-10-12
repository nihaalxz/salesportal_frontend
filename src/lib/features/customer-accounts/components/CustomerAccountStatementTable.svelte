<script lang="ts">
  import type { AccountTimelineItemResponse } from '../types/customer-account-types';
  import { getTransactionVisualConfig } from '../utils/transaction-type-mapper';
  import EmptyFinancialState from './EmptyFinancialState.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { Search, Filter, ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from 'lucide-svelte';

  interface Props {
    timeline: AccountTimelineItemResponse[];
    pageSize?: number;
  }

  let { timeline, pageSize = 15 }: Props = $props();

  let searchQuery = $state('');
  let typeFilter = $state('all');
  let startDate = $state('');
  let endDate = $state('');
  let datePreset = $state<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'custom'>('all');
  let currentPage = $state(1);

  function formatYmd(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function setDatePreset(preset: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month') {
    datePreset = preset;
    const now = new Date();
    if (preset === 'all') {
      startDate = '';
      endDate = '';
    } else if (preset === 'today') {
      const ymd = formatYmd(now);
      startDate = ymd;
      endDate = ymd;
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const ymd = formatYmd(y);
      startDate = ymd;
      endDate = ymd;
    } else if (preset === 'this_week') {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      startDate = formatYmd(start);
      endDate = formatYmd(now);
    } else if (preset === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate = formatYmd(start);
      endDate = formatYmd(now);
    } else if (preset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = formatYmd(start);
      endDate = formatYmd(end);
    }
    currentPage = 1;
  }

  function clearAllFilters() {
    searchQuery = '';
    typeFilter = 'all';
    startDate = '';
    endDate = '';
    datePreset = 'all';
    currentPage = 1;
  }

  let isFiltered = $derived(
    searchQuery.trim() !== '' ||
    typeFilter !== 'all' ||
    startDate !== '' ||
    endDate !== '' ||
    datePreset !== 'all'
  );

  let filteredTimeline = $derived.by(() => {
    return timeline.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.referenceNumber || '').toLowerCase().includes(q) ||
        (item.eventType && item.eventType.toLowerCase().includes(q));

      const matchesType =
        typeFilter === 'all' ||
        (item.eventType && item.eventType.toLowerCase() === typeFilter.toLowerCase());

      let matchesDate = true;
      if (startDate || endDate) {
        const itemDate = new Date(item.transactionDate);
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (itemDate < s) matchesDate = false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (itemDate > e) matchesDate = false;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });
  });

  let totalPages = $derived.by(() => Math.ceil(filteredTimeline.length / pageSize) || 1);

  let paginatedItems = $derived.by(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTimeline.slice(start, start + pageSize);
  });
</script>

<div class="space-y-4">
  <!-- Controls Bar -->
  <div class="bg-card p-3.5 rounded-lg border border-border space-y-3">
    <!-- Presets Row -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
          <CalendarDays class="h-3.5 w-3.5" />
          <span>Period:</span>
        </span>
        <button
          type="button"
          onclick={() => setDatePreset('all')}
          class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {datePreset === 'all' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          All Time
        </button>
        <button
          type="button"
          onclick={() => setDatePreset('today')}
          class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {datePreset === 'today' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          Today
        </button>
        <button
          type="button"
          onclick={() => setDatePreset('yesterday')}
          class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {datePreset === 'yesterday' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          Yesterday
        </button>
        <button
          type="button"
          onclick={() => setDatePreset('this_week')}
          class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {datePreset === 'this_week' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          This Week
        </button>
        <button
          type="button"
          onclick={() => setDatePreset('this_month')}
          class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {datePreset === 'this_month' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          This Month
        </button>
        <button
          type="button"
          onclick={() => setDatePreset('last_month')}
          class="text-xs px-2.5 py-1 rounded-md font-medium transition-colors {datePreset === 'last_month' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'}"
        >
          Last Month
        </button>
      </div>

      {#if isFiltered}
        <Button
          variant="ghost"
          size="sm"
          onclick={clearAllFilters}
          class="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <RotateCcw class="h-3 w-3" />
          <span>Clear Filters</span>
        </Button>
      {/if}
    </div>

    <!-- Inputs Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
      <div class="space-y-1">
        <label for="stmt-start-date" class="text-[11px] font-medium text-muted-foreground">From Date</label>
        <input
          id="stmt-start-date"
          type="date"
          bind:value={startDate}
          onchange={() => { datePreset = 'custom'; currentPage = 1; }}
          class="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div class="space-y-1">
        <label for="stmt-end-date" class="text-[11px] font-medium text-muted-foreground">To Date</label>
        <input
          id="stmt-end-date"
          type="date"
          bind:value={endDate}
          onchange={() => { datePreset = 'custom'; currentPage = 1; }}
          class="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div class="space-y-1">
        <label for="stmt-type-filter" class="text-[11px] font-medium text-muted-foreground">Event Type</label>
        <select
          id="stmt-type-filter"
          bind:value={typeFilter}
          onchange={() => { currentPage = 1; }}
          class="w-full text-xs bg-background border border-border rounded-md px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="all">All Event Types</option>
          <option value="BookingCharge">Booking Charge</option>
          <option value="Deposit">Deposit</option>
          <option value="ReceiptSettlement">Receipt Settlement</option>
          <option value="Refund">Refund</option>
          <option value="CreditNote">Credit Note</option>
          <option value="ManualAdjustment">Manual Adjustment</option>
        </select>
      </div>

      <div class="space-y-1">
        <label for="stmt-search-box" class="text-[11px] font-medium text-muted-foreground">Search</label>
        <div class="relative">
          <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            id="stmt-search-box"
            type="text"
            placeholder="Reference, description..."
            bind:value={searchQuery}
            oninput={() => { currentPage = 1; }}
            class="pl-8 text-xs h-8"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Table -->
  {#if filteredTimeline.length === 0}
    <EmptyFinancialState
      title="No Statement Entries Found"
      description="No financial transactions match the active filter criteria."
    />
  {:else}
    <div class="border border-border rounded-lg overflow-x-auto bg-card">
      <table class="w-full text-xs text-left">
        <thead class="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
          <tr>
            <th class="p-3">Date</th>
            <th class="p-3">Transaction</th>
            <th class="p-3">Reference</th>
            <th class="p-3">Description</th>
            <th class="p-3 text-right">Debit</th>
            <th class="p-3 text-right">Credit</th>
            <th class="p-3 text-right">Running Balance</th>
            <th class="p-3">Remarks</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          {#each paginatedItems as item}
            {@const visual = getTransactionVisualConfig(item.eventType || item.serviceType)}
            <tr class="hover:bg-muted/30 transition-colors">
              <td class="p-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                {new Date(item.transactionDate).toLocaleDateString()}
              </td>
              <td class="p-3 whitespace-nowrap">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border {visual.badgeClass}">
                  {visual.label}
                </span>
              </td>
              <td class="p-3 whitespace-nowrap font-mono font-bold text-foreground">
                {item.referenceNumber}
              </td>
              <td class="p-3 max-w-xs truncate text-muted-foreground">
                {item.description ? item.description.replace(/\s*\((?:Credit\s+Facility|CreditFacility)\)/gi, '').trim() : '-'}
              </td>
              <td class="p-3 text-right font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                {item.debit > 0 ? `-${item.debit.toFixed(3)} BHD` : '-'}
              </td>
              <td class="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                {item.credit > 0 ? `+${item.credit.toFixed(3)} BHD` : '-'}
              </td>
              <td class="p-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                {item.runningBalance.toFixed(3)} BHD
              </td>
              <td class="p-3 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                {(item.remarks || item.referenceNumber || '-').replace(/\s*\((?:Credit\s+Facility|CreditFacility)\)/gi, '').trim()}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination Bar -->
    <div class="flex items-center justify-between text-xs text-muted-foreground px-1">
      <span>Showing {paginatedItems.length} of {filteredTimeline.length} entries</span>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onclick={() => currentPage--}
          class="h-8 w-8 p-0"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span>Page {currentPage} of {totalPages}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onclick={() => currentPage++}
          class="h-8 w-8 p-0"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  {/if}
</div>
