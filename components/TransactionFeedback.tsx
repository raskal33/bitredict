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
  boostTier?: string; // For boost-related transactions
  totalCost?: string; // Total cost including boost
  poolId?: string; // Pool ID for successful creation
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
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return; // Prevent multiple close attempts
    
    setIsClosing(true);
    setIsVisible(false);
    
    // Small delay to allow animation to complete before calling onClose
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setProgress(0);
      setTimeElapsed(0);
    }, 150);
  }, [onClose, isClosing]);

  // Progress simulation for pending transactions
  useEffect(() => {
    if (status?.type === 'pending' || status?.type === 'confirming') {
      setProgress(0);
      setTimeElapsed(0);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Don't go to 100% until confirmed
          const increment = Math.random() * 10;
          const newProgress = Math.min(prev + increment, 90);
          return newProgress;
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
    if (status && !isClosing) {
      setIsVisible(true);
      
      // Auto-close for success/error messages (but not for pending transactions)
      if (autoClose && (status.type === 'success' || status.type === 'error')) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDelay);
        
        return () => clearTimeout(timer);
      }
    } else if (!status) {
      // Immediately hide when status is cleared to prevent persistence
      setIsVisible(false);
      setIsClosing(false); // Reset closing state when status is cleared
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, autoClose, autoCloseDelay, isClosing]);

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
            <div className={`px-6 py-4 flex items-center gap-4 ${getStatusColor()} border-b border-border-card/30`}>
              <div className={`p-3 rounded-full shadow-lg ${
                status.type === 'success' ? 'bg-green-500/20 text-green-400 shadow-green-500/20' :
                status.type === 'error' ? 'bg-red-500/20 text-red-400 shadow-red-500/20' :
                status.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400 shadow-yellow-500/20' :
                status.type === 'pending' ? 'bg-blue-500/20 text-blue-400 shadow-blue-500/20' :
                status.type === 'confirming' ? 'bg-purple-500/20 text-purple-400 shadow-purple-500/20' :
                'bg-blue-500/20 text-blue-400 shadow-blue-500/20'
              }`}>
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                  {status.title}
                </h3>
                {(status.type === 'pending' || status.type === 'confirming') && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                    <p className="text-xs text-text-secondary">
                      {formatTime(timeElapsed)} elapsed
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-bg-overlay/50 transition-all duration-200 hover:scale-110"
              >
                <FaTimesCircle className="h-5 w-5 text-text-secondary hover:text-text-primary" />
              </button>
            </div>

            {/* Progress Bar for Pending/Confirming Transactions */}
            {(status.type === 'pending' || status.type === 'confirming') && showProgress && (
              <div className="px-6 py-4 bg-gradient-to-r from-bg-overlay/30 to-bg-overlay/10">
                <div className="flex items-center justify-between text-sm text-text-secondary mb-3">
                  <span className="font-medium">Transaction Progress</span>
                  <span className="font-bold text-white">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-bg-card/30 rounded-full h-3 shadow-inner">
                  <motion.div 
                    className={`h-3 rounded-full ${getProgressColor()} shadow-lg`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted mt-2">
                  <span>Processing blockchain transaction...</span>
                  <span>{status.type === 'pending' ? 'Waiting for confirmation' : 'Confirming on network'}</span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                {status.message}
              </p>

              {/* Boost Information */}
              {status.boostTier && status.boostTier !== 'NONE' && (
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        Boost Applied: {status.boostTier}
                      </h4>
                      <p className="text-xs text-gray-400">
                        Your pool will have enhanced visibility and priority placement
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {status.boostTier === 'BRONZE' && '🥉'}
                        {status.boostTier === 'SILVER' && '🥈'}
                        {status.boostTier === 'GOLD' && '🥇'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Total Cost Information */}
              {status.totalCost && (
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">Total Cost:</span>
                    <span className="text-sm font-bold text-white">{status.totalCost}</span>
                  </div>
                </div>
              )}

              {/* Pool ID */}
              {status.poolId && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-400">Pool ID:</span>
                    <span className="text-sm font-bold text-white font-mono">{status.poolId}</span>
                  </div>
                </div>
              )}

              {/* Transaction Hash */}
              {status.hash && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-primary">Transaction Hash</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(status.hash!);
                        toast.success('Hash copied to clipboard!');
                      }}
                      className="flex items-center gap-2 px-3 py-1 text-xs text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all duration-200"
                    >
                      <FaCopy className="h-3 w-3" />
                      Copy Hash
                    </button>
                  </div>
                  <div className="bg-bg-overlay/50 rounded-lg p-3 border border-border-card/30">
                    <code className="text-xs text-text-secondary break-all font-mono leading-relaxed">
                      {status.hash}
                    </code>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {status.action && status.onAction && (
                <button
                  onClick={status.onAction}
                  className="w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <FaExternalLinkAlt className="h-4 w-4" />
                  {status.action}
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border-card/30 bg-bg-overlay/20 space-y-2">
              {status.hash && status.type === 'success' && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${status.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl block"
                >
                  <FaExternalLinkAlt className="h-4 w-4" />
                  View on Etherscan
                </a>
              )}
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 text-sm font-medium text-text-primary bg-bg-overlay/50 hover:bg-bg-overlay/70 rounded-lg transition-all duration-200 border border-border-card/30 hover:border-border-card/50"
              >
                {status.type === 'pending' || status.type === 'confirming' ? 'Minimize' : 'Close'}
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

  const showSuccess = (title: string, message: string, hash?: string, boostTier?: string, totalCost?: string, poolId?: string) => {
    setTransactionStatus({
      type: 'success',
      title,
      message,
      hash,
      boostTier,
      totalCost,
      poolId
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