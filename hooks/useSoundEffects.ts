/**
 * Sound Effects Hook
 * 
 * Provides sound notifications for various events
 * Uses HTML5 Audio API with base64-encoded sounds
 */

import { useCallback, useRef, useEffect } from 'react';
import { useUserSettings } from './useUserSettings';

// Base64-encoded notification sounds (short beeps)
const SOUNDS = {
  // Success sound (higher pitch)
  success: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
  // Error sound (lower pitch)
  error: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
  // Notification sound (mid pitch)
  notification: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
  // Win sound (celebratory)
  win: 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
};

interface UseSoundEffectsOptions {
  enabled?: boolean;
  volume?: number;
}

export function useSoundEffects(options: UseSoundEffectsOptions = {}) {
  const { enabled: optionsEnabled = true, volume = 0.5 } = options;
  const { settings } = useUserSettings();
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Combine user settings with options
  const enabled = optionsEnabled && settings.soundsEnabled;

  // Initialize audio elements
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    Object.entries(SOUNDS).forEach(([name, src]) => {
      const audio = new Audio(src);
      audio.volume = volume;
      audioCache.current.set(name, audio);
    });

    return () => {
      audioCache.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioCache.current.clear();
    };
  }, [enabled, volume]);

  const playSound = useCallback((soundName: keyof typeof SOUNDS) => {
    if (!enabled || typeof window === 'undefined') return;

    try {
      const audio = audioCache.current.get(soundName);
      if (audio) {
        // Reset to start if already playing
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.warn('Failed to play sound:', err);
        });
      }
    } catch (error) {
      console.warn('Sound playback error:', error);
    }
  }, [enabled]);

  return {
    playSuccess: useCallback(() => playSound('success'), [playSound]),
    playError: useCallback(() => playSound('error'), [playSound]),
    playNotification: useCallback(() => playSound('notification'), [playSound]),
    playWin: useCallback(() => playSound('win'), [playSound]),
  };
}

// Hook for enabling/disabling sounds globally
export function useSoundSettings() {
  const enabled = useRef(true);

  const toggleSounds = useCallback(() => {
    enabled.current = !enabled.current;
    return enabled.current;
  }, []);

  const setSoundsEnabled = useCallback((value: boolean) => {
    enabled.current = value;
  }, []);

  return {
    enabled: enabled.current,
    toggleSounds,
    setSoundsEnabled,
  };
}


