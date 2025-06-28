import React from 'react';
import { motion } from 'motion/react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const logoVariants = {
    initial: { 
      scale: 1,
      filter: 'hue-rotate(0deg) brightness(1)'
    },
    animate: {
      scale: [1, 1.05, 1],
      filter: [
        'hue-rotate(0deg) brightness(1)',
        'hue-rotate(120deg) brightness(1.1)', 
        'hue-rotate(240deg) brightness(1.2)',
        'hue-rotate(360deg) brightness(1)'
      ],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className} relative`}
      variants={logoVariants}
      initial="initial"
      animate="animate"
    >
      <motion.svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="100%" 
        height="100%" 
        fill="none"
        viewBox="0 0 32 32"
        className="drop-shadow-lg"
      >
        <rect width="32" height="32" fill="#000" rx="12" />
        <motion.path
          fill="currentColor"
          d="M16.004 2 11.63 6.375l4.375 4.375 4.375-4.375L16.004 2zm0 19.25-4.375 4.375L16.004 30l4.375-4.375-4.375-4.375zm6.148-13.851L28.13 9l-1.602 5.976-5.976-1.601 1.601-5.976zM11.458 18.625 5.48 17.024 3.88 23l5.976 1.601 1.602-5.976zm-5.977-3.649L3.88 9l5.976-1.601 1.602 5.976-5.977 1.601zm15.07 3.649 1.601 5.976L28.13 23l-1.602-5.976-5.976 1.601z"
          className="text-somnia-cyan"
          animate={{
            color: [
              '#22C7FF', // cyan
              '#FF0080', // magenta  
              '#8C00FF', // violet
              '#22C7FF'  // back to cyan
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Glow effect */}
        <motion.circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.6"
          className="text-somnia-cyan"
          animate={{
            stroke: [
              '#22C7FF', // cyan
              '#FF0080', // magenta  
              '#8C00FF', // violet
              '#22C7FF'  // back to cyan
            ],
            opacity: [0.3, 0.8, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.svg>
      
      {/* Additional glow overlay */}
      <motion.div
        className="absolute inset-0 rounded-full blur-sm opacity-30"
        animate={{
          background: [
            'radial-gradient(circle, #22C7FF 0%, transparent 70%)',
            'radial-gradient(circle, #FF0080 0%, transparent 70%)', 
            'radial-gradient(circle, #8C00FF 0%, transparent 70%)',
            'radial-gradient(circle, #22C7FF 0%, transparent 70%)'
          ]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export default AnimatedLogo; 