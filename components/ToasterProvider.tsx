/**
 * Toaster Provider Component
 * 
 * Provides toast notifications with theme support from user settings
 */

'use client';

import { Toaster } from 'react-hot-toast';
import { useUserSettings } from '@/hooks/useUserSettings';

export function ToasterProvider() {
  const { settings, isLoaded } = useUserSettings();

  // Determine theme based on user setting
  const getTheme = (): 'dark' | 'light' => {
    if (settings.notificationTheme === 'auto') {
      // Check system preference
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return settings.notificationTheme;
  };

  const theme = isLoaded ? getTheme() : 'dark';

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme === 'dark' 
            ? 'rgba(17, 24, 39, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          color: theme === 'dark' ? '#fff' : '#000',
          backdropFilter: 'blur(20px)',
          border: theme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: theme === 'dark' ? '#fff' : '#000',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: theme === 'dark' ? '#fff' : '#000',
          },
        },
      }}
    />
  );
}

