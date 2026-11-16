import { writable, get } from 'svelte/store';

export interface ShortcutDefinition {
  key: string;            // Exact KeyboardEvent.key (e.g. 'F1', 'F2', '?')
  displayKey: string;     // Friendly display string for UI (e.g. 'F1', '?')
  label: string;          // Action label (e.g. 'New Visa Service')
  route?: string;         // Target route to navigate to
  action: 'navigate' | 'modal';
  category: 'Bookings' | 'Financials' | 'General';
  description: string;
}

export interface KeyboardShortcutEvent {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  preventDefault?: () => void;
  stopPropagation?: () => void;
}

export const SHORTCUTS: ShortcutDefinition[] = [
  {
    key: 'F1',
    displayKey: 'F1',
    label: 'New Visa Service',
    route: '/bookings/visas/new',
    action: 'navigate',
    category: 'Bookings',
    description: 'Create a new visa application booking'
  },
  {
    key: 'F2',
    displayKey: 'F2',
    label: 'New Flight Ticket',
    route: '/bookings/flights/new',
    action: 'navigate',
    category: 'Bookings',
    description: 'Create a new flight ticket booking'
  },
  {
    key: 'F3',
    displayKey: 'F3',
    label: 'New Hotel Booking',
    route: '/bookings/hotels/new',
    action: 'navigate',
    category: 'Bookings',
    description: 'Create a new hotel reservation'
  },
  {
    key: 'F4',
    displayKey: 'F4',
    label: 'New VFS Service',
    route: '/bookings/vfs/new',
    action: 'navigate',
    category: 'Bookings',
    description: 'Create a new VFS appointment / service'
  },
  {
    key: 'F6',
    displayKey: 'F6',
    label: 'New Holiday Package',
    route: '/bookings/holidays/new',
    action: 'navigate',
    category: 'Bookings',
    description: 'Create a new holiday package booking'
  },
  {
    key: 'F7',
    displayKey: 'F7',
    label: 'New Transportation',
    route: '/bookings/transport/new',
    action: 'navigate',
    category: 'Bookings',
    description: 'Create a new transportation booking'
  },
  {
    key: 'F8',
    displayKey: 'F8',
    label: 'New Other Service',
    route: '/bookings/other-services/new',
    action: 'navigate',
    category: 'Bookings',
    description: 'Create a miscellaneous / other service booking'
  },
  {
    key: 'F9',
    displayKey: 'F9',
    label: 'New Receipt / Deposit',
    route: '/receipts/new',
    action: 'navigate',
    category: 'Financials',
    description: 'Create a new payment receipt or customer deposit'
  },
  {
    key: 'F10',
    displayKey: 'F10',
    label: 'Create Customer Head',
    action: 'modal',
    category: 'General',
    description: 'Open modal to register a new customer head'
  },
  {
    key: '?',
    displayKey: '?',
    label: 'Keyboard Shortcuts Help',
    action: 'modal',
    category: 'General',
    description: 'Open this keyboard shortcuts cheat sheet'
  }
];

export const isShortcutsModalOpen = writable<boolean>(false);
export const isCreateHeadModalOpen = writable<boolean>(false);

export function openShortcutsModal() {
  isShortcutsModalOpen.set(true);
}

export function closeShortcutsModal() {
  isShortcutsModalOpen.set(false);
}

export function toggleShortcutsModal(force?: boolean) {
  if (typeof force === 'boolean') {
    isShortcutsModalOpen.set(force);
  } else {
    isShortcutsModalOpen.update(v => !v);
  }
}

export function openCreateHeadModal() {
  isCreateHeadModalOpen.set(true);
}

export function closeCreateHeadModal() {
  isCreateHeadModalOpen.set(false);
}

export function toggleCreateHeadModal(force?: boolean) {
  if (typeof force === 'boolean') {
    isCreateHeadModalOpen.set(force);
  } else {
    isCreateHeadModalOpen.update(v => !v);
  }
}

/**
 * Checks whether an element is an interactive input or editable field.
 */
function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  const tagName = element.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }
  if ((element as HTMLElement).isContentEditable) {
    return true;
  }
  return false;
}

/**
 * Global keyboard event handler.
 * Intercepts F1-F10 and '?' to navigate or show the shortcuts/head modal.
 * Preserves browser system shortcuts (e.g. Alt+F4, Ctrl+R, F5, F11, F12).
 *
 * @returns true if the shortcut was handled and consumed, false otherwise.
 */
export function handleGlobalShortcut(
  e: KeyboardShortcutEvent,
  navigate: (route: string) => void
): boolean {
  // Do not intercept if Alt, Ctrl, or Meta (Command/Windows key) are held down
  // to avoid breaking OS-level shortcuts like Alt+F4, Ctrl+F, Ctrl+P, etc.
  if (e.altKey || e.ctrlKey || e.metaKey) {
    return false;
  }

  // Handle Escape to close modals if open
  if (e.key === 'Escape') {
    if (get(isCreateHeadModalOpen)) {
      e.preventDefault?.();
      closeCreateHeadModal();
      return true;
    }
    if (get(isShortcutsModalOpen)) {
      e.preventDefault?.();
      closeShortcutsModal();
      return true;
    }
    return false;
  }

  // Handle 'F10' to open Create Customer Head modal
  if (e.key === 'F10') {
    e.preventDefault?.();
    e.stopPropagation?.();
    closeShortcutsModal();
    openCreateHeadModal();
    return true;
  }

  // Handle '?' or Shift + '/'
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
    if (!isEditableElement(activeEl)) {
      e.preventDefault?.();
      toggleShortcutsModal();
      return true;
    }
    return false;
  }

  // Handle Function keys with navigate action (F1, F2, F3, F4, F6, F7, F8, F9)
  const match = SHORTCUTS.find(s => s.key === e.key && s.action === 'navigate');
  if (match && match.route) {
    e.preventDefault?.();
    e.stopPropagation?.();
    closeShortcutsModal();
    closeCreateHeadModal();
    navigate(match.route);
    return true;
  }

  return false;
}
