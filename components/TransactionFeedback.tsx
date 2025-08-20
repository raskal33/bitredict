import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimesCircle, FaExclamationTriangle, FaSpinner, FaExternalLinkAlt, FaCopy, FaWallet, FaClock, FaCheckDouble } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export interface TransactionStatus {
  type: 'success' | 'error' | 'warning' | 'info' | 'pending' | 'confirming';
  title: string;
  message: string;
  hash?: string;
  action?: string;
  onAction?: () => void;
  progress?: number; // For progress tracking
  estimatedTime?: number; // Estimated completion time in seconds
}

interface TransactionFeedbackProps {
  status: TransactionStatus | null;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
  showProgress?: boolean;
}

export const TransactionFeedback: React.FC<TransactionFeedbackProps> = ({
  status,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
  showProgress = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete before clearing status
  }, [onClose]);

  // Progress simulation for pending transactions
  useEffect(() => {
    if (status?.type === 'pending' || status?.type === 'confirming') {
      setProgress(0);
      setTimeElapsed(0);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Don't go to 100% until confirmed
          return prev + Math.random() * 10;
        });
      }, 1000);

      const timeInterval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);

      return () => {
        clearInterval(progressInterval);
        clearInterval(timeInterval);
      };
    } else if (status?.type === 'success') {
      setProgress(100);
    } else {
      setProgress(0);
      setTimeElapsed(0);
    }
  }, [status?.type]);

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

  // Prevent modal from reappearing by clearing status when closed
  useEffect(() => {
    if (!isVisible && status) {
      const timer = setTimeout(() => {
        onClose();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, status, onClose]);

  const getIcon = () => {
    switch (status?.type) {
      case 'success':
        return <FaCheckDouble className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />;
      case 'error':
        return <FaTimesCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />;
      case 'warning':
        return <FaExclamationTriangle className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />;
      case 'pending':
        return <FaWallet className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />;
      case 'confirming':
        return <FaSpinner className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()} animate-spin`} />;
      default:
        return <FaClock className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />;
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
      case 'pending':
        return 'text-blue-400';
      case 'confirming':
        return 'text-purple-400';
      default:
        return 'text-blue-400';
    }
  };

  const getStatusColor = () => {
    switch (status?.type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'pending':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'confirming':
        return 'bg-purple-500/10 border-purple-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const getProgressColor = () => {
    switch (status?.type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'pending':
        return 'bg-blue-400';
      case 'confirming':
        return 'bg-purple-400';
      default:
        return 'bg-blue-400';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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
            <div className={`px-4 py-3 flex items-center gap-3 ${getStatusColor()}`}>
              <div className={`p-2 rounded-full ${
                status.type === 'success' ? 'bg-green-500/20 text-green-400' :
                status.type === 'error' ? 'bg-red-500/20 text-red-400' :
                status.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                status.type === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                status.type === 'confirming' ? 'bg-purple-500/20 text-purple-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-text-primary">
                  {status.title}
                </h3>
                {(status.type === 'pending' || status.type === 'confirming') && (
                  <p className="text-xs text-text-secondary mt-1">
                    {formatTime(timeElapsed)} elapsed
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-bg-overlay transition-colors"
              >
                <FaTimesCircle className="h-4 w-4 text-text-secondary hover:text-text-primary" />
              </button>
            </div>

            {/* Progress Bar for Pending/Confirming Transactions */}
            {(status.type === 'pending' || status.type === 'confirming') && showProgress && (
              <div className="px-4 py-2 bg-bg-overlay/50">
                <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-bg-card/30 rounded-full h-2">
                  <motion.div 
                    className={`h-2 rounded-full ${getProgressColor()}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

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

  const showPending = (title: string, message: string) => {
    setTransactionStatus({
      type: 'pending',
      title,
      message
    });
  };

  const showConfirming = (title: string, message: string, hash?: string) => {
    setTransactionStatus({
      type: 'confirming',
      title,
      message,
      hash
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
    showPending,
    showConfirming,
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
  }),

  pending: (message: string) => toast(message, {
    duration: 0, // Don't auto-dismiss
    icon: '⏳',
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  }),

  confirming: (message: string) => toast(message, {
    duration: 0, // Don't auto-dismiss
    icon: '🔄',
    style: {
      background: '#8B5CF6',
      color: '#fff',
    },
  })
}; 