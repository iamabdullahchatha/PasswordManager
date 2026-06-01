import { describe, it, expect, afterEach, vi } from 'vitest';
import { toastManager, toast } from '../hooks/useToast';

describe('toastManager', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('adds a toast and returns a string id', () => {
    const id = toastManager.add({ title: 'Hello', type: 'success' });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    toastManager.remove(id);
  });

  it('calling remove does not throw for unknown id', () => {
    expect(() => toastManager.remove('non-existent-id')).not.toThrow();
  });

  it('toast() shorthand calls toastManager.add', () => {
    const spy = vi.spyOn(toastManager, 'add');
    toast('My message', 'error', 'Detail');
    expect(spy).toHaveBeenCalledWith({ title: 'My message', description: 'Detail', type: 'error' });
    spy.mockRestore();
  });

  it('toast() defaults to info type', () => {
    const spy = vi.spyOn(toastManager, 'add');
    toast('Info toast');
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'info' }));
    spy.mockRestore();
  });
});
