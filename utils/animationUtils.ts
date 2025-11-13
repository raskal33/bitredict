/**
 * Animation Utilities
 * 
 * Provides animation props that respect user settings
 */

import { useUserSettings } from '@/hooks/useUserSettings';

export function useAnimationProps() {
  const { settings } = useUserSettings();

  const getMotionProps = (defaultProps: {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
  }) => {
    if (!settings.animationsEnabled) {
      // Return minimal props - no animations
      return {
        initial: false,
        animate: false,
        exit: false,
        transition: { duration: 0 },
        whileHover: {},
        whileTap: {},
      };
    }
    return defaultProps;
  };

  const getTransition = (defaultTransition: any) => {
    if (!settings.animationsEnabled) {
      return { duration: 0 };
    }
    return defaultTransition;
  };

  return {
    animationsEnabled: settings.animationsEnabled,
    getMotionProps,
    getTransition,
  };
}

