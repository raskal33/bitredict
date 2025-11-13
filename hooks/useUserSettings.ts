/**
 * User Settings Hook
 * 
 * Manages user preferences for sounds, animations, and theme
 * Persists to localStorage
 */

import { useState, useEffect, useCallback } from 'react';

export interface UserSettings {
  soundsEnabled: boolean;
  animationsEnabled: boolean;
  notificationTheme: 'dark' | 'light' | 'auto';
}

const DEFAULT_SETTINGS: UserSettings = {
  soundsEnabled: true,
  animationsEnabled: true,
  notificationTheme: 'dark',
};

const STORAGE_KEY = 'bitredict_user_settings';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserSettings>;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load user settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save user settings:', error);
      }
    }
  }, [settings, isLoaded]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleSounds = useCallback(() => {
    setSettings(prev => ({ ...prev, soundsEnabled: !prev.soundsEnabled }));
  }, []);

  const toggleAnimations = useCallback(() => {
    setSettings(prev => ({ ...prev, animationsEnabled: !prev.animationsEnabled }));
  }, []);

  const setNotificationTheme = useCallback((theme: 'dark' | 'light' | 'auto') => {
    setSettings(prev => ({ ...prev, notificationTheme: theme }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    isLoaded,
    updateSettings,
    toggleSounds,
    toggleAnimations,
    setNotificationTheme,
    resetSettings,
  };
}

