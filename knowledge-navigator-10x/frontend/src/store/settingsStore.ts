import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types';
import { getSystemTheme } from '../utils/helpers';

interface SettingsState extends AppSettings {
  setTheme: (theme: AppSettings['theme']) => void;
  setLanguage: (language: string) => void;
  setNotifications: (enabled: boolean) => void;
  setVoiceInput: (enabled: boolean) => void;
  setAutoSuggest: (enabled: boolean) => void;
  setFontSize: (size: AppSettings['fontSize']) => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  language: 'en',
  notifications: true,
  voiceInput: true,
  autoSuggest: true,
  fontSize: 'medium',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => {
        set({ theme });
        const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;
        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
      },

      setLanguage: (language) => set({ language }),
      setNotifications: (notifications) => set({ notifications }),
      setVoiceInput: (voiceInput) => set({ voiceInput }),
      setAutoSuggest: (autoSuggest) => set({ autoSuggest }),
      setFontSize: (fontSize) => set({ fontSize }),
      resetSettings: () => set(defaultSettings),
    }),
    { name: 'kn10x_settings' }
  )
);
