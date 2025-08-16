import React from 'react';
import { motion, Variants } from 'framer-motion';
import { FireIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface AnimatedTitleProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showIcons?: boolean;
  leftIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  rightIcon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
  iconColor?: string;
  textColor?: string;
}

const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  children,
  size = 'lg',
  showIcons = true,
  leftIcon: LeftIcon = FireIcon,
  rightIcon: RightIcon = SparklesIcon,
  className = '',
  iconColor = '',
  textColor = 'gradient-text'
}) => {
  const sizeClasses = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-3xl md:text-4xl',
    lg: 'text-4xl md:text-5xl',
    xl: 'text-5xl md:text-6xl'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
    xl: 'h-12 w-12'
  };

  const titleVariants: Variants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  const iconLeftVariants: Variants = {
    initial: { rotate: 0, scale: 1 },
    animate: { 
      rotate: 360,
      scale: [1, 1.1, 1],
      transition: {
        rotate: {
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        },
        scale: {
          duration: 4,
          repeat: Infinity,
          ease: [0.4, 0, 0.6, 1]
        }
      }
    }
  };

  const iconRightVariants: Variants = {
    initial: { rotate: 0, scale: 1 },
    animate: { 
      rotate: -360,
      scale: [1, 1.1, 1],
      transition: {
        rotate: {
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        },
        scale: {
          duration: 4,
          repeat: Infinity,
          ease: [0.4, 0, 0.6, 1],
          delay: 2
        }
      }
    }
  };

  const separatorVariants: Variants = {
    initial: { width: 0, opacity: 0 },
    animate: { 
      width: '100%', 
      opacity: 0.6,
      transition: {
        delay: 0.5,
        duration: 1,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  const textVariants: Variants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        delay: 0.3,
        duration: 0.6
      }
    }
  };

  return (
    <motion.div 
      className={`text-center ${className}`}
      variants={titleVariants}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-center justify-center gap-6 mb-6">
        {showIcons && (
          <motion.div 
            variants={iconLeftVariants}
            initial="initial"
            animate="animate"
          >
            <LeftIcon className={`${iconSizes[size]} ${iconColor || 'text-primary'}`} />
          </motion.div>
        )}
        
        <motion.h1 
          className={`${sizeClasses[size]} font-bold ${textColor}`}
          variants={textVariants}
          initial="initial"
          animate="animate"
        >
          {children}
        </motion.h1>
        
        {showIcons && (
          <motion.div 
            variants={iconRightVariants}
            initial="initial"
            animate="animate"
          >
            <RightIcon className={`${iconSizes[size]} ${iconColor || 'text-secondary'}`} />
          </motion.div>
        )}
      </div>
      
      <motion.div 
        className="mx-auto mb-6 h-1 bg-gradient-somnia rounded-full max-w-xs"
        variants={separatorVariants}
        initial="initial"
        animate="animate"
      />
    </motion.div>
  );
};

export default AnimatedTitle; 