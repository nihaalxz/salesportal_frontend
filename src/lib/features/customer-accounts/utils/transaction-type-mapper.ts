export interface TransactionVisualConfig {
  label: string;
  badgeClass: string;
  textClass: string;
  iconName: string;
}

const TRANSACTION_VISUAL_MAP: Record<string, TransactionVisualConfig> = {
  bookingcharge: {
    label: 'Booking Charge',
    badgeClass: 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50',
    textClass: 'text-red-600 dark:text-red-400',
    iconName: 'ShoppingCart'
  },
  deposit: {
    label: 'Balance Deposit',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    iconName: 'ArrowDownLeft'
  },
  receiptsettlement: {
    label: 'Receipt Settlement',
    badgeClass: 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50',
    textClass: 'text-blue-600 dark:text-blue-400',
    iconName: 'CheckCircle2'
  },
  refund: {
    label: 'Refund',
    badgeClass: 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/50',
    textClass: 'text-purple-600 dark:text-purple-400',
    iconName: 'RotateCcw'
  },
  creditnote: {
    label: 'Credit Note',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50',
    textClass: 'text-amber-600 dark:text-amber-400',
    iconName: 'FileText'
  },
  manualadjustment: {
    label: 'Manual Adjustment',
    badgeClass: 'bg-zinc-500/10 text-zinc-600 border-zinc-200 dark:border-zinc-800',
    textClass: 'text-zinc-600 dark:text-zinc-400',
    iconName: 'Sliders'
  },
  openingbalance: {
    label: 'Opening Balance',
    badgeClass: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-900/50',
    textClass: 'text-sky-600 dark:text-sky-400',
    iconName: 'Sparkles'
  },
  writeoff: {
    label: 'Bad Debt Write-Off',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50',
    textClass: 'text-rose-600 dark:text-rose-400',
    iconName: 'XCircle'
  },
  transfer: {
    label: 'Account Transfer',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:border-indigo-900/50',
    textClass: 'text-indigo-600 dark:text-indigo-400',
    iconName: 'ArrowRightLeft'
  },
  journalentry: {
    label: 'Journal Entry',
    badgeClass: 'bg-slate-500/10 text-slate-600 border-slate-200 dark:border-slate-800',
    textClass: 'text-slate-600 dark:text-slate-400',
    iconName: 'BookOpen'
  },
  salesreturn: {
    label: 'Sales Return',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50',
    textClass: 'text-rose-600 dark:text-rose-400',
    iconName: 'RotateCcw'
  },
  salesrefund: {
    label: 'Sales Return',
    badgeClass: 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-900/50',
    textClass: 'text-rose-600 dark:text-rose-400',
    iconName: 'RotateCcw'
  },
  journalreversal: {
    label: 'Journal Reversal',
    badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50',
    textClass: 'text-amber-600 dark:text-amber-400',
    iconName: 'Undo'
  }
};

const GENERIC_FINANCIAL_TRANSACTION: TransactionVisualConfig = {
  label: 'Financial Transaction',
  badgeClass: 'bg-gray-500/10 text-gray-600 border-gray-200 dark:border-gray-800',
  textClass: 'text-gray-600 dark:text-gray-400',
  iconName: 'Receipt'
};

export function getTransactionVisualConfig(transactionType: string): TransactionVisualConfig {
  if (!transactionType) return GENERIC_FINANCIAL_TRANSACTION;
  const key = transactionType.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (TRANSACTION_VISUAL_MAP[key]) {
    return TRANSACTION_VISUAL_MAP[key];
  }
  const formattedLabel = transactionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return {
    ...GENERIC_FINANCIAL_TRANSACTION,
    label: formattedLabel
  };
}
