import { create } from 'zustand';
import type { UserRole } from '@/lib/types';

const SESSION_STORAGE_KEY = 'omnicold-role';

function getPersistedRole(): UserRole {
  if (typeof window === 'undefined') return 'shipper';
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored === 'shipper' || stored === 'provider' || stored === 'oracle') {
      return stored;
    }
  } catch {
    // sessionStorage unavailable (e.g., private browsing restrictions)
  }
  return 'shipper';
}

interface UIState {
  activeRole: UserRole;
  reducedMotion: boolean;
  setActiveRole: (role: UserRole) => void;
  setReducedMotion: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeRole: getPersistedRole(),
  reducedMotion: false,

  setActiveRole: (role) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, role);
    } catch {
      // sessionStorage unavailable
    }
    set({ activeRole: role });
  },

  setReducedMotion: (value) => {
    set({ reducedMotion: value });
  },
}));
