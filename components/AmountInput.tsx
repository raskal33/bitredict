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
  allowDecimals?: boolean;
  step?: number;
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
  allowDecimals = true,
  step = 0.01,
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
    
    // Remove any non-numeric characters except decimal point and minus
    let cleaned = num.replace(/[^0-9.-]/g, '');
    
    // Handle multiple decimal points - keep only the first one
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Handle multiple minus signs - keep only the first one at the beginning
    const minusParts = cleaned.split('-');
    if (minusParts.length > 2) {
      cleaned = minusParts[0] + '-' + minusParts.slice(1).join('');
    }
    
    // Limit decimal places if specified
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
    
    if (min !== undefined && numericValue < min) {
      return `Minimum amount is ${min} ${currency}`;
    }
    
    if (max !== undefined && numericValue > max) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, and navigation keys
    if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
      return;
    }
    
    // Allow Ctrl+A (select all), Ctrl+C (copy), Ctrl+V (paste), Ctrl+X (cut)
    if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return;
    }
    
    // Allow Cmd+A, Cmd+C, Cmd+V, Cmd+X (for Mac)
    if (e.metaKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
      return;
    }
    
    // Allow decimal point if decimals are allowed
    if (allowDecimals && e.key === '.') {
      const currentValue = e.currentTarget.value;
      if (currentValue.includes('.')) {
        e.preventDefault();
      }
      return;
    }
    
    // Allow minus sign for negative numbers (if needed)
    if (e.key === '-' && e.currentTarget.selectionStart === 0) {
      return;
    }
    
    // Allow numbers
    if (e.key >= '0' && e.key <= '9') {
      return;
    }
    
    // Prevent other keys
    e.preventDefault();
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
    try {
      const amountString = amount.toString();
      setInternalValue(amountString);
      onChange(amountString);
      if (onValueChange) {
        onValueChange(amount);
      }
    } catch (error) {
      console.error('Error setting predefined amount:', error);
      // Fallback to safe value
      setInternalValue('0');
      onChange('0');
      if (onValueChange) {
        onValueChange(0);
      }
    }
  };

  const handleStepUp = () => {
    const currentValue = parseFloat(internalValue) || 0;
    const newValue = currentValue + step;
    const newValueString = newValue.toString();
    setInternalValue(newValueString);
    onChange(newValueString);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const handleStepDown = () => {
    const currentValue = parseFloat(internalValue) || 0;
    const newValue = Math.max(currentValue - step, min);
    const newValueString = newValue.toString();
    setInternalValue(newValueString);
    onChange(newValueString);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      input: 'px-3 py-2 text-sm',
      icon: 'h-4 w-4',
      currency: 'text-xs px-2 py-1',
      button: 'px-2 py-1 text-xs',
      stepButton: 'px-1 py-1 text-xs'
    },
    md: {
      input: 'px-4 py-3 text-base',
      icon: 'h-5 w-5',
      currency: 'text-sm px-3 py-1.5',
      button: 'px-3 py-1.5 text-sm',
      stepButton: 'px-2 py-1 text-sm'
    },
    lg: {
      input: 'px-5 py-4 text-lg',
      icon: 'h-6 w-6',
      currency: 'text-base px-4 py-2',
      button: 'px-4 py-2 text-base',
      stepButton: 'px-3 py-2 text-base'
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
                  icon as React.ReactElement<Record<string, unknown>>,
                  {
                    ...(React.isValidElement(icon) && icon.props && typeof icon.props === 'object' ? icon.props as Record<string, unknown> : {}),
                    className: [
                      (React.isValidElement(icon) && icon.props && typeof icon.props === 'object' && 'className' in icon.props
                        ? (icon.props as Record<string, unknown>).className
                        : ''),
                      currentSize.icon
                    ].filter(Boolean).join(' ')
                  })
              : icon}
          </div>
        )}

        {/* Step Up Button */}
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 flex flex-col">
          <button
            type="button"
            onClick={handleStepUp}
            disabled={disabled}
            className={`
              ${currentSize.stepButton}
              text-primary hover:text-primary/80 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            ▲
          </button>
        </div>

        {/* Input */}
        <input
          type="text"
          inputMode="decimal"
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full ${currentSize.input} ${currentVariant.input}
            ${icon ? 'pl-10' : 'pl-8'}
            ${showMaxButton || currency ? 'pr-20' : 'pr-8'}
            text-text-primary placeholder-text-muted
            focus:outline-none transition-all duration-200
            disabled:cursor-not-allowed
          `}
        />

        {/* Step Down Button */}
        <div className="absolute left-1 bottom-1/2 transform translate-y-1/2 flex flex-col">
          <button
            type="button"
            onClick={handleStepDown}
            disabled={disabled}
            className={`
              ${currentSize.stepButton}
              text-primary hover:text-primary/80 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            ▼
          </button>
        </div>

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