import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaSpinner, FaExternalLinkAlt, FaCopy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export interface TransactionStatus {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  hash?: string;
  action?: string;
  onAction?: () => void;
}

interface TransactionFeedbackProps {
  status: TransactionStatus | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const TransactionFeedback: React.FC<TransactionFeedbackProps> = ({
  status,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (status) {
      setIsVisible(true);
      
      // Auto-close for success/error messages (but not for pending transactions)
      if (autoClose && (status.type === 'success' || status.type === 'error')) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [status, autoClose, autoCloseDelay, handleClose]);

  const getIcon = () => {
    switch (status?.type) {
      case 'success':
        return <FaCheckCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />;
      case 'error':
        return <FaTimesCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />;
      case 'warning':
        return <FaExclamationTriangle className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />;
      default:
        return <FaSpinner className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()} animate-spin`} />;
    }
  };

  const getBackgroundColor = () => {
    switch (status?.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500/15 to-emerald-500/15 border-green-500/30';
      case 'error':
        return 'bg-gradient-to-r from-red-500/15 to-rose-500/15 border-red-500/30';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500/15 to-orange-500/15 border-yellow-500/30';
      default:
        return 'bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border-blue-500/30';
    }
  };

  const getIconColor = () => {
    switch (status?.type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Transaction hash copied to clipboard!');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getExplorerUrl = (hash: string) => {
    return `https://somnia-testnet.explorer.caldera.xyz/tx/${hash}`;
  };

  if (!status) return null;

  return (
    <AnimatePresence>
      {isVisible && status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md mx-auto bg-bg-card border border-border-card rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-4 py-3 flex items-center gap-3 ${
              status.type === 'success' ? 'bg-green-500/10 border-b border-green-500/20' :
              status.type === 'error' ? 'bg-red-500/10 border-b border-red-500/20' :
              status.type === 'warning' ? 'bg-yellow-500/10 border-b border-yellow-500/20' :
              'bg-blue-500/10 border-b border-blue-500/20'
            }`}>
              <div className={`p-2 rounded-full ${
                status.type === 'success' ? 'bg-green-500/20 text-green-400' :
                status.type === 'error' ? 'bg-red-500/20 text-red-400' :
                status.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                  {status.title}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-bg-overlay transition-colors"
              >
                <FaTimesCircle className="h-4 w-4 text-text-secondary hover:text-text-primary" />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 py-4 space-y-3">
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {status.message}
              </p>

              {/* Transaction Hash */}
              {status.hash && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-text-secondary">Transaction Hash:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(status.hash!);
                        toast.success('Hash copied to clipboard!');
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <FaCopy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                  <div className="bg-bg-overlay rounded-lg p-2">
                    <code className="text-xs text-text-secondary break-all font-mono">
                      {status.hash}
                    </code>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {status.action && status.onAction && (
                <button
                  onClick={status.onAction}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FaExternalLinkAlt className="h-3 w-3" />
                  {status.action}
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border-card">
              <button
                onClick={handleClose}
                className="w-full px-3 py-2 text-xs sm:text-sm font-medium text-text-primary bg-bg-overlay hover:bg-bg-overlay/80 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for managing transaction feedback
export const useTransactionFeedback = () => {
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);

  const showSuccess = (title: string, message: string, hash?: string) => {
    setTransactionStatus({
      type: 'success',
      title,
      message,
      hash
    });
  };

  const showError = (title: string, message: string, hash?: string) => {
    setTransactionStatus({
      type: 'error',
      title,
      message,
      hash
    });
  };

  const showWarning = (title: string, message: string) => {
    setTransactionStatus({
      type: 'warning',
      title,
      message
    });
  };

  const showInfo = (title: string, message: string) => {
    setTransactionStatus({
      type: 'info',
      title,
      message
    });
  };

  const clearStatus = () => {
    setTransactionStatus(null);
  };

  return {
    transactionStatus,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearStatus
  };
};

// Toast wrapper for quick notifications
export const showTransactionToast = {
  success: (message: string) => toast.success(message, {
    duration: 4000,
    style: {
      background: '#10B981',
      color: '#fff',
    },
  }),
  
  error: (message: string) => toast.error(message, {
    duration: 6000,
    style: {
      background: '#EF4444',
      color: '#fff',
    },
  }),
  
  warning: (message: string) => toast(message, {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
    },
  }),
  
  info: (message: string) => toast(message, {
    duration: 3000,
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  })
}; 