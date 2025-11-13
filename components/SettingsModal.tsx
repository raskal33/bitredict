/**
 * Settings Modal Component
 * 
 * Allows users to configure sounds, animations, and notification theme
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useUserSettings } from '@/hooks/useUserSettings';
import { 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  SparklesIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, toggleSounds, toggleAnimations, setNotificationTheme } = useUserSettings();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Sound Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {settings.soundsEnabled ? (
                        <SpeakerWaveIcon className="w-5 h-5 text-green-400" />
                      ) : (
                        <SpeakerXMarkIcon className="w-5 h-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="text-sm font-semibold text-white">Sound Effects</h3>
                        <p className="text-xs text-gray-400">Enable audio notifications</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleSounds}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.soundsEnabled ? 'bg-green-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.soundsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Animation Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <SparklesIcon className={`w-5 h-5 ${settings.animationsEnabled ? 'text-purple-400' : 'text-gray-500'}`} />
                      <div>
                        <h3 className="text-sm font-semibold text-white">Animations</h3>
                        <p className="text-xs text-gray-400">Enable smooth transitions</p>
                      </div>
                    </div>
                    <button
                      onClick={toggleAnimations}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.animationsEnabled ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Notification Theme */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <MoonIcon className="w-5 h-5 text-blue-400" />
                      <h3 className="text-sm font-semibold text-white">Notification Theme</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Choose appearance for notifications</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setNotificationTheme('dark')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                          settings.notificationTheme === 'dark'
                            ? 'bg-gray-700 border-blue-500'
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <MoonIcon className={`w-5 h-5 ${settings.notificationTheme === 'dark' ? 'text-blue-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${settings.notificationTheme === 'dark' ? 'text-white font-semibold' : 'text-gray-400'}`}>
                          Dark
                        </span>
                      </button>
                      <button
                        onClick={() => setNotificationTheme('light')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                          settings.notificationTheme === 'light'
                            ? 'bg-gray-700 border-yellow-500'
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <SunIcon className={`w-5 h-5 ${settings.notificationTheme === 'light' ? 'text-yellow-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${settings.notificationTheme === 'light' ? 'text-white font-semibold' : 'text-gray-400'}`}>
                          Light
                        </span>
                      </button>
                      <button
                        onClick={() => setNotificationTheme('auto')}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                          settings.notificationTheme === 'auto'
                            ? 'bg-gray-700 border-green-500'
                            : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        <ComputerDesktopIcon className={`w-5 h-5 ${settings.notificationTheme === 'auto' ? 'text-green-400' : 'text-gray-500'}`} />
                        <span className={`text-xs ${settings.notificationTheme === 'auto' ? 'text-white font-semibold' : 'text-gray-400'}`}>
                          Auto
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-700 bg-gray-800/50">
                <p className="text-xs text-center text-gray-400">
                  Settings are saved automatically
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

