import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  handleGlobalShortcut, 
  SHORTCUTS, 
  isShortcutsModalOpen, 
  openShortcutsModal, 
  closeShortcutsModal, 
  toggleShortcutsModal,
  isCreateHeadModalOpen,
  openCreateHeadModal,
  closeCreateHeadModal,
  toggleCreateHeadModal,
  type KeyboardShortcutEvent
} from './shortcuts';
import { get } from 'svelte/store';

function createMockKeyEvent(init: Partial<KeyboardShortcutEvent>): KeyboardShortcutEvent {
  return {
    key: init.key ?? '',
    altKey: init.altKey ?? false,
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
    shiftKey: init.shiftKey ?? false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...init
  };
}

describe('shortcuts service', () => {
  beforeEach(() => {
    isShortcutsModalOpen.set(false);
    isCreateHeadModalOpen.set(false);
  });

  it('contains expected shortcut mappings', () => {
    expect(SHORTCUTS.find(s => s.key === 'F1')?.route).toBe('/bookings/visas/new');
    expect(SHORTCUTS.find(s => s.key === 'F2')?.route).toBe('/bookings/flights/new');
    expect(SHORTCUTS.find(s => s.key === 'F3')?.route).toBe('/bookings/hotels/new');
    expect(SHORTCUTS.find(s => s.key === 'F4')?.route).toBe('/bookings/vfs/new');
    expect(SHORTCUTS.find(s => s.key === 'F6')?.route).toBe('/bookings/holidays/new');
    expect(SHORTCUTS.find(s => s.key === 'F7')?.route).toBe('/bookings/transport/new');
    expect(SHORTCUTS.find(s => s.key === 'F8')?.route).toBe('/bookings/other-services/new');
    expect(SHORTCUTS.find(s => s.key === 'F9')?.route).toBe('/receipts/new');
    
    // F10 is for Create Customer Head modal, NOT /quotations/new
    const f10 = SHORTCUTS.find(s => s.key === 'F10');
    expect(f10?.action).toBe('modal');
    expect(f10?.label).toBe('Create Customer Head');
    expect(f10?.route).toBeUndefined();

    // F5 should NOT be in shortcuts to preserve browser page refresh
    expect(SHORTCUTS.find(s => s.key === 'F5')).toBeUndefined();
  });

  it('triggers navigation and prevents default for F1', () => {
    const navigate = vi.fn();
    const event = createMockKeyEvent({ key: 'F1' });

    const handled = handleGlobalShortcut(event, navigate);

    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/bookings/visas/new');
  });

  it('triggers navigation for F2', () => {
    const navigate = vi.fn();
    const event = createMockKeyEvent({ key: 'F2' });

    const handled = handleGlobalShortcut(event, navigate);

    expect(handled).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/bookings/flights/new');
  });

  it('triggers navigation for F9 (Receipts)', () => {
    const navigate = vi.fn();
    
    const event = createMockKeyEvent({ key: 'F9' });
    expect(handleGlobalShortcut(event, navigate)).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/receipts/new');
  });

  it('triggers Create Customer Head modal on F10 and does NOT navigate to quotations', () => {
    const navigate = vi.fn();
    const event = createMockKeyEvent({ key: 'F10' });

    expect(get(isCreateHeadModalOpen)).toBe(false);
    const handled = handleGlobalShortcut(event, navigate);

    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(get(isCreateHeadModalOpen)).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not intercept F5 (browser reload) or F11/F12', () => {
    const navigate = vi.fn();
    
    const f5Event = createMockKeyEvent({ key: 'F5' });
    expect(handleGlobalShortcut(f5Event, navigate)).toBe(false);
    expect(f5Event.preventDefault).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    const f12Event = createMockKeyEvent({ key: 'F12' });
    expect(handleGlobalShortcut(f12Event, navigate)).toBe(false);
  });

  it('does not intercept when Alt, Ctrl, or Meta is pressed (e.g. Alt+F4)', () => {
    const navigate = vi.fn();
    const event = createMockKeyEvent({ key: 'F4', altKey: true });

    const handled = handleGlobalShortcut(event, navigate);

    expect(handled).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('toggles shortcuts help modal on ? when not typing in an input', () => {
    const navigate = vi.fn();
    const event = createMockKeyEvent({ key: '?' });

    expect(get(isShortcutsModalOpen)).toBe(false);
    const handled = handleGlobalShortcut(event, navigate);

    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(get(isShortcutsModalOpen)).toBe(true);
  });

  it('closes modals on Escape key in priority', () => {
    // When Create Head modal is open, Esc closes it
    openCreateHeadModal();
    expect(get(isCreateHeadModalOpen)).toBe(true);

    const navigate = vi.fn();
    let event = createMockKeyEvent({ key: 'Escape' });

    let handled = handleGlobalShortcut(event, navigate);
    expect(handled).toBe(true);
    expect(get(isCreateHeadModalOpen)).toBe(false);

    // When Shortcuts help modal is open, Esc closes it
    openShortcutsModal();
    expect(get(isShortcutsModalOpen)).toBe(true);

    event = createMockKeyEvent({ key: 'Escape' });
    handled = handleGlobalShortcut(event, navigate);
    expect(handled).toBe(true);
    expect(get(isShortcutsModalOpen)).toBe(false);
  });

  it('modal helpers work properly', () => {
    closeShortcutsModal();
    expect(get(isShortcutsModalOpen)).toBe(false);
    openShortcutsModal();
    expect(get(isShortcutsModalOpen)).toBe(true);
    toggleShortcutsModal();
    expect(get(isShortcutsModalOpen)).toBe(false);
    toggleShortcutsModal(true);
    expect(get(isShortcutsModalOpen)).toBe(true);

    closeCreateHeadModal();
    expect(get(isCreateHeadModalOpen)).toBe(false);
    openCreateHeadModal();
    expect(get(isCreateHeadModalOpen)).toBe(true);
    toggleCreateHeadModal();
    expect(get(isCreateHeadModalOpen)).toBe(false);
    toggleCreateHeadModal(true);
    expect(get(isCreateHeadModalOpen)).toBe(true);
  });
});
