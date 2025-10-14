'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { 
  PlusIcon, 
  TrashIcon, 
  CubeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Button from '@/components/button';
import AmountInput from '@/components/AmountInput';
import Textarea from '@/components/textarea';
import { useComboPools } from '@/hooks/useComboPools';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useReputationStore } from '@/stores/useReputationStore';

interface ComboCondition {
  id: string;
  marketId: string;
  expectedOutcome: string;
  description: string;
  odds: number;
  category: 'football' | 'crypto' | 'other';
  league?: string;
  eventStartTime: Date;
  eventEndTime: Date;
}

interface ComboPoolFormData {
  title: string;
  description: string;
  creatorStake: number;
  combinedOdds: number;
  maxBetPerUser: number;
  useBitr: boolean;
  isPrivate: boolean;
  conditions: ComboCondition[];
  eventStartTime: Date;
  eventEndTime: Date;
  bettingEndTime: Date;
  category?: string;
}

const INITIAL_CONDITION: Omit<ComboCondition, 'id'> = {
  marketId: '',
  expectedOutcome: '',
  description: '',
  odds: 2.0,
  category: 'football',
  league: '',
  eventStartTime: new Date(),
  eventEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
};

export default function ComboPoolCreationForm({ onSuccess, onClose }: {
  onSuccess?: (poolId: string) => void;
  onClose?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { connectWallet } = useWalletConnection();
  const { createComboPool } = useComboPools();
  const { getUserReputation, canCreateMarket } = useReputationStore();

  const [formData, setFormData] = useState<ComboPoolFormData>({
    title: '',
    description: '',
    creatorStake: 100,
    combinedOdds: 2.0,
    maxBetPerUser: 1000,
    useBitr: false,
    isPrivate: false,
    conditions: [],
    eventStartTime: new Date(),
    eventEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    bettingEndTime: new Date(Date.now() + 23 * 60 * 60 * 1000)
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const userReputation = address ? getUserReputation(address) : null;
  const canCreate = address ? canCreateMarket(address) : false;

  // Calculate potential winnings
  const potentialWinnings = formData.creatorStake * (formData.combinedOdds - 1);

  const addCondition = useCallback(() => {
    if (formData.conditions.length >= 5) {
      toast.error('Maximum 5 conditions allowed for combo pools');
      return;
    }
    
    const newCondition: ComboCondition = {
      ...INITIAL_CONDITION,
      id: Date.now().toString(),
      eventStartTime: new Date(),
      eventEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  }, [formData.conditions.length]);

  const removeCondition = useCallback((conditionId: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== conditionId)
    }));
  }, []);

  const updateCondition = useCallback((conditionId: string, field: keyof ComboCondition, value: string | number | Date) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => 
        c.id === conditionId ? { ...c, [field]: value } : c
      )
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Pool title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Pool description is required';
    }

    if (formData.conditions.length < 2) {
      newErrors.conditions = 'At least 2 conditions are required for combo pools';
    }

    if (formData.conditions.length > 5) {
      newErrors.conditions = 'Maximum 5 conditions allowed for combo pools';
    }

    formData.conditions.forEach((condition, index) => {
      if (!condition.expectedOutcome.trim()) {
        newErrors[`condition_${index}_outcome`] = 'Expected outcome is required';
      }
      if (!condition.description.trim()) {
        newErrors[`condition_${index}_description`] = 'Description is required';
      }
    });

    if (formData.creatorStake < 50) {
      newErrors.creatorStake = 'Minimum creator stake is 50 tokens';
    }

    if (formData.combinedOdds < 1.01 || formData.combinedOdds > 500) {
      newErrors.combinedOdds = 'Combined odds must be between 1.01 and 500';
    }

    if (formData.maxBetPerUser < 1) {
      newErrors.maxBetPerUser = 'Max bet per user must be at least 1 token';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      try {
        await connectWallet();
      } catch {
        toast.error('Failed to connect wallet');
      }
      return;
    }

    if (!canCreate) {
      toast.error('Insufficient reputation to create combo pools');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare combo pool data to match contract signature
      const comboPoolData = {
        conditions: formData.conditions.map(condition => ({
          marketId: condition.marketId,
          expectedOutcome: condition.expectedOutcome,
          description: condition.description || `${condition.marketId} prediction`,
          odds: 1.0 // Not used in contract, but required by interface
        })),
        combinedOdds: formData.combinedOdds, // Use form input
        creatorStake: BigInt(Math.floor(formData.creatorStake * 1e18)),
        earliestEventStart: BigInt(Math.floor(formData.eventStartTime.getTime() / 1000)),
        latestEventEnd: BigInt(Math.floor(formData.eventEndTime.getTime() / 1000)),
        category: formData.category || "football",
        maxBetPerUser: BigInt(Math.floor(formData.maxBetPerUser * 1e18)),
        useBitr: formData.useBitr
      };

      const txHash = await createComboPool(comboPoolData);
      
      toast.success('Combo pool creation transaction submitted!');
      
      if (onSuccess) {
        onSuccess(txHash);
      }
      
      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error creating combo pool:', error);
      toast.error('Failed to create combo pool');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, canCreate, validateForm, createComboPool, formData, onSuccess, onClose, connectWallet]);

  const renderConditionForm = (condition: ComboCondition, index: number) => (
    <motion.div
      key={condition.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-card p-6 border border-border-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <CubeIcon className="h-5 w-5 text-primary" />
          Condition {index + 1}
        </h3>
        {formData.conditions.length > 2 && (
          <button
            onClick={() => removeCondition(condition.id)}
            className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Expected Outcome */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Expected Outcome *
          </label>
          <input
            type="text"
            value={condition.expectedOutcome}
            onChange={(e) => updateCondition(condition.id, 'expectedOutcome', e.target.value)}
            placeholder="e.g., Manchester United wins, Bitcoin reaches $100k"
            className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          {errors[`condition_${index}_outcome`] && (
            <p className="text-error text-sm mt-1">{errors[`condition_${index}_outcome`]}</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Description *
          </label>
          <Textarea
            value={condition.description}
            onChange={(e) => updateCondition(condition.id, 'description', e.target.value)}
            placeholder="Describe this condition in detail..."
            rows={2}
            error={errors[`condition_${index}_description`]}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Category
          </label>
          <select
            value={condition.category}
            onChange={(e) => updateCondition(condition.id, 'category', e.target.value)}
            className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          >
            <option value="football">Football</option>
            <option value="crypto">Cryptocurrency</option>
            <option value="other">Other</option>
          </select>
        </div>


        {/* Event Times */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Event Start Time
          </label>
          <input
            type="datetime-local"
            value={condition.eventStartTime.toISOString().slice(0, 16)}
            onChange={(e) => updateCondition(condition.id, 'eventStartTime', new Date(e.target.value))}
            className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Event End Time
          </label>
          <input
            type="datetime-local"
            value={condition.eventEndTime.toISOString().slice(0, 16)}
            onChange={(e) => updateCondition(condition.id, 'eventEndTime', new Date(e.target.value))}
            className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderPoolSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
        <ChartBarIcon className="h-6 w-6 text-primary" />
        Pool Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pool Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Pool Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Premier League Champions + Bitcoin Bull Run"
            className="w-full px-4 py-3 bg-bg-card border border-border-input rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
          {errors.title && (
            <p className="text-error text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Textarea
            label="Pool Description *"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your combo pool and the conditions..."
            rows={4}
            error={errors.description}
          />
        </div>

        {/* Creator Stake */}
        <div>
          <AmountInput
            label="Creator Stake *"
            value={formData.creatorStake.toString()}
            onChange={(value) => setFormData(prev => ({ ...prev, creatorStake: parseFloat(value || '0') }))}
            placeholder="100.0"
            min={50}
            max={1000000}
            step={0.1}
            allowDecimals={true}
            currency={formData.useBitr ? 'BITR' : 'STT'}
            help="Your stake that acts as liquidity for the pool"
            error={errors.creatorStake}
          />
        </div>

        {/* Combined Odds */}
        <div>
          <AmountInput
            label="Combined Odds *"
            value={formData.combinedOdds.toString()}
            onChange={(value) => setFormData(prev => ({ ...prev, combinedOdds: parseFloat(value || '0') }))}
            placeholder="2.00"
            min={1.01}
            max={500}
            step={0.01}
            allowDecimals={true}
            currency="x"
            help="Total odds for all conditions combined (1.01x - 500x)"
            error={errors.combinedOdds}
          />
        </div>

        {/* Max Bet Per User */}
        <div>
          <AmountInput
            label="Max Bet Per User"
            value={formData.maxBetPerUser.toString()}
            onChange={(value) => setFormData(prev => ({ ...prev, maxBetPerUser: parseFloat(value || '0') }))}
            placeholder="1000.0"
            min={1}
            max={1000000}
            step={0.1}
            allowDecimals={true}
            currency={formData.useBitr ? 'BITR' : 'STT'}
            help="Maximum bet amount per user (0 = unlimited)"
            error={errors.maxBetPerUser}
          />
        </div>

        {/* Payment Token */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Payment Token
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData(prev => ({ ...prev, useBitr: false }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                !formData.useBitr
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-primary/50'
              }`}
            >
              <div className="font-semibold">STT</div>
              <div className="text-xs mt-1">Somnia Network</div>
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, useBitr: true }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                formData.useBitr
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-primary/50'
              }`}
            >
              <div className="font-semibold">BITR</div>
              <div className="text-xs mt-1">Reduced fees</div>
            </button>
          </div>
        </div>

        {/* Privacy */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Pool Privacy
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                !formData.isPrivate
                  ? 'border-success bg-success/10 text-success'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-success/50'
              }`}
            >
              <div className="font-semibold">Public</div>
              <div className="text-xs mt-1">Anyone can bet</div>
            </button>
            <button
              onClick={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
              className={`p-3 rounded-xl border text-center transition-all ${
                formData.isPrivate
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border-input bg-bg-card text-text-secondary hover:border-accent/50'
              }`}
            >
              <div className="font-semibold">Private</div>
              <div className="text-xs mt-1">Whitelist only</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummary = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-text-primary flex items-center gap-2">
        <CheckCircleIcon className="h-6 w-6 text-success" />
        Pool Summary
      </h3>

      <div className="glass-card p-6 border border-primary/20">
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-text-primary mb-2">{formData.title}</h4>
            <p className="text-text-secondary">{formData.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-text-muted text-sm">Conditions</label>
              <p className="text-text-primary font-semibold">{formData.conditions.length}</p>
            </div>
            <div>
              <label className="text-text-muted text-sm">Combined Odds</label>
              <p className="text-primary font-bold text-xl">{formData.combinedOdds.toFixed(2)}x</p>
            </div>
            <div>
              <label className="text-text-muted text-sm">Creator Stake</label>
              <p className="text-text-primary font-semibold">
                {formData.creatorStake} {formData.useBitr ? 'BITR' : 'STT'}
              </p>
            </div>
            <div>
              <label className="text-text-muted text-sm">Potential Win</label>
              <p className="text-success font-bold text-xl">
                {potentialWinnings.toFixed(2)} {formData.useBitr ? 'BITR' : 'STT'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border-card">
            <h5 className="font-semibold text-text-primary mb-3">Conditions:</h5>
            <div className="space-y-2">
              {formData.conditions.map((condition) => (
                <div key={condition.id} className="flex items-center justify-between p-3 bg-bg-card/50 rounded-lg">
                  <div>
                    <p className="text-text-primary font-medium">{condition.expectedOutcome}</p>
                    <p className="text-text-muted text-sm">{condition.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary font-semibold">{condition.odds}x</p>
                    <p className="text-text-muted text-xs">{condition.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-warning mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">Wallet Not Connected</h2>
        <p className="text-text-secondary mb-6">Please connect your wallet to create combo pools.</p>
        <Button onClick={connectWallet} variant="primary">
          Connect Wallet
        </Button>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">Insufficient Reputation</h2>
        <p className="text-text-secondary mb-6">
          You need higher reputation to create combo pools. Participate in existing markets to build your reputation.
        </p>
        {userReputation && (
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg">
              <span className="text-sm font-medium">Current Reputation: {userReputation?.score || 0}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((stepNumber) => (
          <React.Fragment key={stepNumber}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= stepNumber 
                ? 'bg-primary text-white' 
                : 'bg-bg-card text-text-muted'
            }`}>
              {stepNumber}
            </div>
            {stepNumber < 3 && (
              <div className={`h-1 w-16 ${
                step > stepNumber ? 'bg-primary' : 'bg-bg-card'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="conditions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary">Define Conditions</h2>
              <Button
                onClick={addCondition}
                variant="outline"
                className="flex items-center gap-2"
                disabled={formData.conditions.length >= 5}
              >
                <PlusIcon className="h-4 w-4" />
                Add Condition {formData.conditions.length >= 5 ? '(Max 5)' : ''}
              </Button>
            </div>

            <AnimatePresence>
              {formData.conditions.map((condition, index) => renderConditionForm(condition, index))}
            </AnimatePresence>

            {formData.conditions.length === 0 && (
              <div className="text-center py-12 glass-card">
                <CubeIcon className="h-12 w-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Conditions Added</h3>
                <p className="text-text-secondary mb-6">
                  Add at least 2 conditions to create a combo pool. Each condition must be met for the pool to be won.
                </p>
                <Button onClick={addCondition} variant="primary">
                  Add First Condition
                </Button>
              </div>
            )}

            {errors.conditions && (
              <div className="text-center">
                <p className="text-error">{errors.conditions}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={formData.conditions.length < 2}
                variant="primary"
              >
                Next: Pool Settings
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {renderPoolSettings()}

            <div className="flex justify-between">
              <Button onClick={() => setStep(1)} variant="outline">
                Back: Conditions
              </Button>
              <Button onClick={() => setStep(3)} variant="primary">
                Next: Review
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {renderSummary()}

            <div className="flex justify-between">
              <Button onClick={() => setStep(2)} variant="outline">
                Back: Settings
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
                variant="primary"
                className="min-w-[200px]"
              >
                {isLoading ? 'Creating Pool...' : 'Create Combo Pool'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
