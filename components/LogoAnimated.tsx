import React from 'react';
import Image from 'next/image';

interface LogoAnimatedProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

const LogoAnimated: React.FC<LogoAnimatedProps> = ({ 
  size = 'md', 
  className = '', 
  priority = false 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const sizePixels = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 48, height: 48 },
    xl: { width: 64, height: 64 }
  };

  return (
    <div className={`relative ${className}`}>
      <Image 
        src="/logo.png" 
        alt="BitRedict Logo" 
        width={sizePixels[size].width}
        height={sizePixels[size].height}
        className={`${sizeClasses[size]} animate-logo-cycle`}
        priority={priority}
      />
    </div>
  );
};

export default LogoAnimated; 