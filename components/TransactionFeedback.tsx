import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (status) {
      setIsVisible(true);
      
      // Auto-close for success/error messages (but not for pending transactions)
      if (autoClose && (status.type === 'success' || status.type === 'error')) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for exit animation
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [status, autoClose, autoCloseDelay, onClose]);

  const getIcon = () => {
    switch (status?.type) {
      case 'success':
        return <FaCheckCircle className={`h-6 w-6 ${getIconColor()}`} />;
      case 'error':
        return <FaTimesCircle className={`h-6 w-6 ${getIconColor()}`} />;
      case 'warning':
        return <FaExclamationTriangle className={`h-6 w-6 ${getIconColor()}`} />;
      default:
        return <FaSpinner className={`h-6 w-6 ${getIconColor()} animate-spin`} />;
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
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl ${getBackgroundColor()} backdrop-blur-lg rounded-2xl p-4 sm:p-6 border shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Close button - positioned absolutely */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-3 sm:gap-4 pr-8 sm:pr-10">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1 pr-4">
                  {status.title}
                </h3>
                <p className="text-gray-300 text-sm mb-3 leading-relaxed pr-4">
                  {status.message}
                </p>
                
                {status.hash && (
                  <div className="mb-4 p-3 bg-black/20 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-xs font-medium">Transaction Hash:</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(status.hash!)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="Copy to clipboard"
                        >
                          <FaCopy className="h-3 w-3" />
                        </button>
                        <a
                          href={getExplorerUrl(status.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                          title="View on explorer"
                        >
                          <FaExternalLinkAlt className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <code className="text-xs text-blue-300 break-all font-mono bg-black/30 px-2 py-1 rounded block">
                      {status.hash}
                    </code>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {status.action && status.onAction && (
                    <button
                      onClick={status.onAction}
                      className="px-3 py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      {status.action}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      setTimeout(onClose, 300);
                    }}
                    className="px-3 py-2 text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 hover:scale-105"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
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