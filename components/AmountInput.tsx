import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

export interface AmountInputProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  onValueChange?: (numericValue: number) => void;
  placeholder?: string;
  error?: string;
  help?: string;
  disabled?: boolean;
  currency?: string;
  min?: number;
  max?: number;
  decimals?: number;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  showMaxButton?: boolean;
  maxValue?: number;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
}

const AmountInput: React.FC<AmountInputProps> = ({
  label,
  value,
  onChange,
  onValueChange,
  placeholder = "0.00",
  error,
  help,
  disabled = false,
  currency = 'STT',
  min = 0,
  max,
  decimals = 18,
  icon,
  size = 'md',
  variant = 'default',
  showMaxButton = false,
  maxValue,
  className = '',
  autoFocus = false,
  required = false,
}) => {
  const [focused, setFocused] = useState(false);
  const [internalValue, setInternalValue] = useState('');

  // Sync internal value with external value
  useEffect(() => {
    const stringValue = typeof value === 'number' ? value.toString() : value;
    if (stringValue !== internalValue) {
      setInternalValue(stringValue);
    }
  }, [value, internalValue]);

  // Format number with proper decimal handling
  const formatNumber = useCallback((num: string): string => {
    if (!num || num === '') return '';
    
    // Remove any non-numeric characters except decimal point
    let cleaned = num.replace(/[^0-9.]/g, '');
    
    // Handle multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places
    if (parts.length === 2 && parts[1].length > decimals) {
      cleaned = parts[0] + '.' + parts[1].substring(0, decimals);
    }
    
    return cleaned;
  }, [decimals]);

  // Validate amount
  const validateAmount = useCallback((amount: string): string | null => {
    if (!amount || amount === '') {
      return required ? 'Amount is required' : null;
    }
    
    const numericValue = parseFloat(amount);
    
    if (isNaN(numericValue)) {
      return 'Please enter a valid number';
    }
    
    if (numericValue < min) {
      return `Minimum amount is ${min} ${currency}`;
    }
    
    if (max && numericValue > max) {
      return `Maximum amount is ${max} ${currency}`;
    }
    
    return null;
  }, [min, max, currency, required]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatNumber(rawValue);
    
    setInternalValue(formattedValue);
    onChange(formattedValue);
    
    if (onValueChange) {
      const numericValue = parseFloat(formattedValue) || 0;
      onValueChange(numericValue);
    }
  };

  const handleMaxClick = () => {
    if (maxValue !== undefined) {
      const maxString = maxValue.toString();
      setInternalValue(maxString);
      onChange(maxString);
      if (onValueChange) {
        onValueChange(maxValue);
      }
    }
  };

  const handlePredefinedAmount = (amount: number) => {
    const amountString = amount.toString();
    setInternalValue(amountString);
    onChange(amountString);
    if (onValueChange) {
      onValueChange(amount);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      input: 'px-3 py-2 text-sm',
      icon: 'h-4 w-4',
      currency: 'text-xs px-2 py-1',
      button: 'px-2 py-1 text-xs'
    },
    md: {
      input: 'px-4 py-3 text-base',
      icon: 'h-5 w-5',
      currency: 'text-sm px-3 py-1.5',
      button: 'px-3 py-1.5 text-sm'
    },
    lg: {
      input: 'px-5 py-4 text-lg',
      icon: 'h-6 w-6',
      currency: 'text-base px-4 py-2',
      button: 'px-4 py-2 text-base'
    }
  };

  // Variant configurations
  const variantConfig = {
    default: {
      container: 'bg-bg-card border-2 border-border-card focus-within:border-primary',
      input: 'bg-transparent'
    },
    filled: {
      container: 'bg-gray-800 border-2 border-transparent focus-within:border-primary',
      input: 'bg-transparent'
    },
    outlined: {
      container: 'bg-transparent border-2 border-gray-600 focus-within:border-primary',
      input: 'bg-transparent'
    }
  };

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];
  
  const validationError = error || validateAmount(internalValue);
  const hasError = !!validationError;
  const isValid = internalValue && !hasError;

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Main Input Container */}
      <div className={`
        relative rounded-button transition-all duration-200
        ${currentVariant.container}
        ${focused ? 'ring-2 ring-primary/20' : ''}
        ${hasError ? 'border-red-500 ring-2 ring-red-500/20' : ''}
        ${isValid ? 'border-green-500' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        {/* Icon */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted">
            {React.isValidElement(icon)
              ? React.cloneElement(
                  icon as React.ReactElement<Record<string, unknown>, string | React.JSXElementConstructor<unknown>>,
                  {
                    ...(typeof (icon as React.ReactElement).props === 'object' ? (icon as React.ReactElement).props : {}),
                    className: [
                      (icon as React.ReactElement).props?.className,
                      currentSize.icon
                    ].filter(Boolean).join(' ')
                  }
                )
              : icon}
          </div>
        )}

        {/* Input */}
        <input
          type="text"
          inputMode="decimal"
          value={internalValue}
          onChange={handleInputChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full ${currentSize.input} ${currentVariant.input}
            ${icon ? 'pl-10' : ''}
            ${showMaxButton || currency ? 'pr-20' : ''}
            text-text-primary placeholder-text-muted
            focus:outline-none transition-all duration-200
            disabled:cursor-not-allowed
          `}
        />

        {/* Currency Badge and Max Button */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {showMaxButton && maxValue !== undefined && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleMaxClick}
              disabled={disabled}
              className={`
                ${currentSize.button}
                bg-primary/20 text-primary rounded-md font-medium
                hover:bg-primary/30 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              MAX
            </motion.button>
          )}
          
          {currency && (
            <span className={`
              ${currentSize.currency}
              bg-primary/10 text-primary rounded-md font-medium
            `}>
              {currency}
            </span>
          )}
        </div>

        {/* Validation Icon */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {hasError && (
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          )}
          {isValid && (
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
          )}
        </div>
      </div>

      {/* Predefined Amount Buttons */}
      {!disabled && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {[1, 5, 10, 25, 50, 100].map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePredefinedAmount(amount)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md transition-colors"
            >
              {amount}
            </motion.button>
          ))}
        </div>
      )}

      {/* Help Text */}
      {help && !hasError && (
        <div className="mt-2 flex items-start gap-2">
          <InformationCircleIcon className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-text-muted">{help}</p>
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-start gap-2"
        >
          <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">{validationError}</p>
        </motion.div>
      )}

      {/* Valid Feedback */}
      {isValid && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex items-start gap-2"
        >
          <CheckCircleIcon className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-400">
            Amount: {parseFloat(internalValue).toLocaleString()} {currency}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AmountInput; 