"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCreateMarket } from "@/store/useCreatePrediction";
import { 
  InformationCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ScaleIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/button";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { toast } from "react-hot-toast";

const CATEGORIES = [
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "crypto", label: "Cryptocurrency", emoji: "₿" },
  { value: "politics", label: "Politics", emoji: "🏛️" },
  { value: "entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "technology", label: "Technology", emoji: "💻" },
  { value: "finance", label: "Finance", emoji: "📈" },
  { value: "weather", label: "Weather", emoji: "🌤️" },
  { value: "other", label: "Other", emoji: "📊" }
];

const STEP_TITLES = [
  "Basic Information",
  "Market Configuration", 
  "Event Timing",
  "Advanced Settings",
  "Review & Deploy"
];

// Contract ABI for createPool function
const BITREDICT_POOL_ABI = [
  {
    name: "createPool",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_predictedOutcome", type: "bytes32" },
      { name: "_odds", type: "uint256" },
      { name: "_creatorStake", type: "uint256" },
      { name: "_eventStartTime", type: "uint256" },
      { name: "_eventEndTime", type: "uint256" },
      { name: "_league", type: "string" },
      { name: "_category", type: "string" },
      { name: "_region", type: "string" },
      { name: "_isPrivate", type: "bool" },
      { name: "_maxBetPerUser", type: "uint256" },
      { name: "_useBitr", type: "bool" }
    ],
    outputs: []
  }
] as const;

const CONTRACT_ADDRESS = "0x742d35Cc6635C0532925a3b8D84e4123a4b37A12"; // Replace with actual contract address

export default function CreateMarketPage() {
  const { isConnected } = useAccount();
  const {
    data,
    errors,
    step,
    setData,
    setStep,
    validateStep,
    calculateMaxBettorStake,
    calculateCreationFee,
    reset,
    setLoading,
    isLoading
  } = useCreateMarket();

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Removed unused showAdvanced state
  const [deploymentHash, setDeploymentHash] = useState<string>('');

  useEffect(() => {
    if (!isConnected) {
      reset();
    }
  }, [isConnected, reset]);

  useEffect(() => {
    if (writeError) {
      toast.error(writeError.message || 'Transaction failed');
      setLoading(false);
    }
  }, [writeError, setLoading]);

  useEffect(() => {
    if (isSuccess && hash) {
      toast.success('Market created successfully!');
      setDeploymentHash(hash);
      setLoading(false);
    }
  }, [isSuccess, hash, setLoading]);

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 5) {
        setStep(step + 1);
      } else {
        handleDeploy();
      }
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleDeploy = async () => {
    if (!validateStep(5) || !isConnected) return;

    try {
      setLoading(true);

      // Convert data to contract parameters
      const predictedOutcomeBytes32 = `0x${Buffer.from(data.predictedOutcome || '', 'utf8').toString('hex').padEnd(64, '0')}`;
      const eventStartTime = Math.floor((data.eventStartTime?.getTime() || 0) / 1000);
      const eventEndTime = Math.floor((data.eventEndTime?.getTime() || 0) / 1000);
      const creatorStakeWei = parseEther((data.creatorStake || 0).toString());
      const maxBetPerUserWei = data.maxBetPerUser ? parseEther(data.maxBetPerUser.toString()) : BigInt(0);

      await writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: BITREDICT_POOL_ABI,
        functionName: "createPool",
        args: [
          predictedOutcomeBytes32 as `0x${string}`,
          BigInt(data.odds || 200),
          creatorStakeWei,
          BigInt(eventStartTime),
          BigInt(eventEndTime),
          data.league || "",
          data.category || "",
          data.region || "",
          data.isPrivate || false,
          maxBetPerUserWei,
          data.usesBitr || false
        ]
      });

    } catch (error) {
      console.error('Error deploying market:', error);
      toast.error('Failed to deploy market');
      setLoading(false);
    }
  };

  const formatOdds = (odds: number) => {
    return (odds / 100).toFixed(2) + "x";
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString();
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-bg-card rounded-full flex items-center justify-center">
            <CurrencyDollarIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary">Connect Your Wallet</h3>
          <p className="text-text-secondary max-w-md">
            You need to connect your wallet to create prediction markets. 
            Make sure you&apos;re on the Somnia network.
          </p>
        </div>
      </div>
    );
  }

  if (isSuccess && deploymentHash) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Market Created Successfully!
          </h2>
          
          <p className="text-text-secondary mb-6">
            Your prediction market has been deployed to the blockchain.
          </p>

          <div className="bg-bg-card rounded-button p-4 mb-6 text-left">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Transaction Hash:</span>
                <a 
                  href={`https://explorer.somnia.network/tx/${deploymentHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-secondary flex items-center gap-1"
                >
                  {deploymentHash.slice(0, 10)}...{deploymentHash.slice(-8)}
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Market Title:</span>
                <span className="font-medium">{data.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Your Stake:</span>
                <span className="font-medium">{data.creatorStake} {data.usesBitr ? 'BITR' : 'STT'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.href = '/'}>
              View Markets
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                reset();
                setDeploymentHash('');
              }}
            >
              Create Another
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-text-primary">Create Prediction Market</h1>
          <div className="text-sm text-text-secondary">
            Step {step} of 5
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {STEP_TITLES.map((title, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                ${step > index + 1 ? 'bg-green-500 text-black' : 
                  step === index + 1 ? 'bg-primary text-black' : 
                  'bg-bg-card border border-border-card text-text-muted'}
              `}>
                {step > index + 1 ? <CheckCircleIcon className="w-4 h-4" /> : index + 1}
              </div>
              {index < STEP_TITLES.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step > index + 1 ? 'bg-green-500' : 'bg-border-card'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-2 text-sm text-text-secondary">
          {STEP_TITLES[step - 1]}
        </div>
      </div>

      {/* Main Form */}
      <motion.div
        key={step}
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -50, opacity: 0 }}
        className="glass-card p-8"
      >
        <AnimatePresence mode="wait">
          {step === 1 && <BasicInformation />}
          {step === 2 && <MarketConfiguration />}
          {step === 3 && <EventTiming />}
          {step === 4 && <AdvancedSettings />}
          {step === 5 && <ReviewAndDeploy />}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-card">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1 || isLoading}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-3">
            {Object.keys(errors).length > 0 && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <ExclamationTriangleIcon className="w-4 h-4" />
                Please fix errors above
              </div>
            )}
            
            <Button
              onClick={handleNext}
              disabled={Object.keys(errors).length > 0 || isLoading}
              className="flex items-center gap-2"
              loading={isPending || isConfirming}
            >
              {step === 5 ? 
                (isPending ? 'Deploying...' : 
                 isConfirming ? 'Confirming...' : 
                 'Deploy Market') 
                : 'Next'}
              {step < 5 && <ChevronRightIcon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  // Step 1: Basic Information
  function BasicInformation() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <InformationCircleIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Market Details</h3>
          </div>

          {/* Predicted Outcome */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              What do you predict WON&apos;T happen?
              <span className="text-red-400 ml-1">*</span>
            </label>
            <textarea
              value={data.predictedOutcome || ''}
              onChange={(e) => setData({ predictedOutcome: e.target.value })}
              placeholder="e.g., Bitcoin will NOT reach $100,000 by December 31st, 2024"
              className={`w-full px-4 py-3 rounded-button bg-bg-input border transition-colors resize-none h-20 ${
                errors.predictedOutcome ? 'border-red-500' : 'border-border-input focus:border-primary'
              }`}
            />
            {errors.predictedOutcome && (
              <p className="text-red-400 text-sm">{errors.predictedOutcome}</p>
            )}
            <p className="text-text-muted text-xs">
              You&apos;re betting that this outcome will NOT happen. Others can bet that it WILL happen.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Market Title
              <span className="text-red-400 ml-1">*</span>
            </label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => setData({ title: e.target.value })}
              placeholder="e.g., Bitcoin $100K by End of 2024"
              className={`w-full px-4 py-3 rounded-button bg-bg-input border transition-colors ${
                errors.title ? 'border-red-500' : 'border-border-input focus:border-primary'
              }`}
            />
            {errors.title && (
              <p className="text-red-400 text-sm">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Category
              <span className="text-red-400 ml-1">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setData({ category: category.value })}
                  className={`p-3 rounded-button border-2 transition-all text-left ${
                    data.category === category.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border-card hover:border-border-input'
                  }`}
                >
                  <div className="text-lg mb-1">{category.emoji}</div>
                  <div className="text-sm font-medium">{category.label}</div>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="text-red-400 text-sm">{errors.category}</p>
            )}
          </div>

          {/* Optional Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                League/Competition
              </label>
              <input
                type="text"
                value={data.league || ''}
                onChange={(e) => setData({ league: e.target.value })}
                placeholder="e.g., NFL, Premier League"
                className="w-full px-4 py-3 rounded-button bg-bg-input border border-border-input focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-primary">
                Region
              </label>
              <input
                type="text"
                value={data.region || ''}
                onChange={(e) => setData({ region: e.target.value })}
                placeholder="e.g., Global, USA, Europe"
                className="w-full px-4 py-3 rounded-button bg-bg-input border border-border-input focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              Description (Optional)
            </label>
            <textarea
              value={data.description || ''}
              onChange={(e) => setData({ description: e.target.value })}
              placeholder="Provide additional context, rules, or information about your prediction..."
              className="w-full px-4 py-3 rounded-button bg-bg-input border border-border-input focus:border-primary transition-colors resize-none h-24"
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Step 2: Market Configuration
  function MarketConfiguration() {
    const maxBettorStake = calculateMaxBettorStake();
    const creationFee = calculateCreationFee();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <ScaleIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Market Economics</h3>
        </div>

        {/* Token Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Payment Token
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setData({ usesBitr: false })}
              className={`flex-1 p-4 rounded-button border-2 transition-all ${
                !data.usesBitr
                  ? 'border-primary bg-primary/10'
                  : 'border-border-card hover:border-border-input'
              }`}
            >
              <div className="font-semibold">STT Token</div>
              <div className="text-sm text-text-muted">Native Somnia token</div>
            </button>
            <button
              onClick={() => setData({ usesBitr: true })}
              className={`flex-1 p-4 rounded-button border-2 transition-all ${
                data.usesBitr
                  ? 'border-primary bg-primary/10'
                  : 'border-border-card hover:border-border-input'
              }`}
            >
              <div className="font-semibold">BITR Token</div>
              <div className="text-sm text-text-muted">Platform token (fee discounts)</div>
            </button>
          </div>
        </div>

        {/* Odds Configuration */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Odds Multiplier
            <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                min="1.01"
                max="100"
                step="0.01"
                value={data.odds ? data.odds / 100 : ''}
                onChange={(e) => setData({ odds: Math.round(parseFloat(e.target.value) * 100) })}
                placeholder="2.00"
                className={`w-full px-4 py-3 rounded-button bg-bg-input border transition-colors ${
                  errors.odds ? 'border-red-500' : 'border-border-input focus:border-primary'
                }`}
              />
              {errors.odds && (
                <p className="text-red-400 text-sm mt-1">{errors.odds}</p>
              )}
            </div>
            <div className="flex items-center px-4 py-3 bg-bg-card rounded-button border border-border-card">
              <div className="text-lg font-semibold text-primary">
                {data.odds ? formatOdds(data.odds) : '2.00x'}
              </div>
            </div>
          </div>
          <p className="text-text-muted text-xs">
            If someone bets 100 tokens that your prediction WILL happen, they&apos;ll win {data.odds ? (data.odds / 100 * 100).toFixed(0) : '200'} tokens if they&apos;re right.
          </p>
        </div>

        {/* Creator Stake */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Your Stake (Creator Liquidity)
            <span className="text-red-400 ml-1">*</span>
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <input
                type="number"
                min="20"
                max="1000000"
                value={data.creatorStake || ''}
                onChange={(e) => setData({ creatorStake: parseFloat(e.target.value) })}
                placeholder="100"
                className={`w-full px-4 py-3 rounded-button bg-bg-input border transition-colors ${
                  errors.creatorStake ? 'border-red-500' : 'border-border-input focus:border-primary'
                }`}
              />
              {errors.creatorStake && (
                <p className="text-red-400 text-sm mt-1">{errors.creatorStake}</p>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-sm text-text-secondary">Maximum opposing bets:</div>
              <div className="text-lg font-semibold text-primary">
                {maxBettorStake ? maxBettorStake.toFixed(2) : '0'} {data.usesBitr ? 'BITR' : 'STT'}
              </div>
            </div>
          </div>
          <p className="text-text-muted text-xs">
            Your stake backs your prediction. Others can bet against you up to the calculated maximum.
          </p>
        </div>

        {/* Summary */}
        <div className="bg-bg-card rounded-button p-4 border border-border-card">
          <h4 className="font-semibold text-text-primary mb-3">Market Summary</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-text-muted">Creation Fee:</div>
              <div className="font-semibold">{creationFee} {data.usesBitr ? 'BITR' : 'STT'}</div>
            </div>
            <div>
              <div className="text-text-muted">Your Stake:</div>
              <div className="font-semibold">{data.creatorStake || 0} {data.usesBitr ? 'BITR' : 'STT'}</div>
            </div>
            <div>
              <div className="text-text-muted">Total Required:</div>
              <div className="font-semibold text-primary">
                {(creationFee + (data.creatorStake || 0)).toFixed(2)} {data.usesBitr ? 'BITR' : 'STT'}
              </div>
            </div>
            <div>
              <div className="text-text-muted">Max Opposing Bets:</div>
              <div className="font-semibold">{maxBettorStake ? maxBettorStake.toFixed(2) : '0'} {data.usesBitr ? 'BITR' : 'STT'}</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Step 3: Event Timing
  function EventTiming() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Event Schedule</h3>
        </div>

        {/* Event Start Time */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Event Start Time
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="datetime-local"
            value={data.eventStartTime ? data.eventStartTime.toISOString().slice(0, 16) : ''}
            onChange={(e) => setData({ eventStartTime: new Date(e.target.value) })}
            min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            className={`w-full px-4 py-3 rounded-button bg-bg-input border transition-colors ${
              errors.eventStartTime ? 'border-red-500' : 'border-border-input focus:border-primary'
            }`}
          />
          {errors.eventStartTime && (
            <p className="text-red-400 text-sm">{errors.eventStartTime}</p>
          )}
          <p className="text-text-muted text-xs">
            Betting will close 60 seconds before this time.
          </p>
        </div>

        {/* Event End Time */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-text-primary">
            Event End Time
            <span className="text-red-400 ml-1">*</span>
          </label>
          <input
            type="datetime-local"
            value={data.eventEndTime ? data.eventEndTime.toISOString().slice(0, 16) : ''}
            onChange={(e) => setData({ eventEndTime: new Date(e.target.value) })}
            min={data.eventStartTime ? data.eventStartTime.toISOString().slice(0, 16) : ''}
            className={`w-full px-4 py-3 rounded-button bg-bg-input border transition-colors ${
              errors.eventEndTime ? 'border-red-500' : 'border-border-input focus:border-primary'
            }`}
          />
          {errors.eventEndTime && (
            <p className="text-red-400 text-sm">{errors.eventEndTime}</p>
          )}
          <p className="text-text-muted text-xs">
            Results can be submitted after this time. Arbitration timeout is 24 hours after this.
          </p>
        </div>

        {/* Timeline Preview */}
        {data.eventStartTime && data.eventEndTime && (
          <div className="bg-bg-card rounded-button p-4 border border-border-card">
            <h4 className="font-semibold text-text-primary mb-3">Timeline Preview</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-4 h-4 text-primary" />
                <div>
                  <div className="text-sm font-medium">Betting Closes</div>
                  <div className="text-xs text-text-muted">
                    {formatDateTime(new Date(data.eventStartTime.getTime() - 60000))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-4 h-4 text-secondary" />
                <div>
                  <div className="text-sm font-medium">Event Starts</div>
                  <div className="text-xs text-text-muted">
                    {formatDateTime(data.eventStartTime)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-4 h-4 text-accent" />
                <div>
                  <div className="text-sm font-medium">Event Ends</div>
                  <div className="text-xs text-text-muted">
                    {formatDateTime(data.eventEndTime)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-4 h-4 text-text-muted" />
                <div>
                  <div className="text-sm font-medium">Arbitration Deadline</div>
                  <div className="text-xs text-text-muted">
                    {formatDateTime(new Date(data.eventEndTime.getTime() + 24 * 60 * 60 * 1000))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Step 4: Advanced Settings
  function AdvancedSettings() {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <UserGroupIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Access Control</h3>
        </div>

        {/* Privacy Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bg-card rounded-button border border-border-card">
            <div>
              <div className="font-medium text-text-primary">Private Market</div>
              <div className="text-sm text-text-muted">Only whitelisted addresses can participate</div>
            </div>
            <button
              onClick={() => setData({ isPrivate: !data.isPrivate })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                data.isPrivate ? 'bg-primary' : 'bg-border-card'
              }`}
            >
              <div className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-transform top-0.5 ${
                data.isPrivate ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {data.isPrivate && (
            <>
              {/* Max Bet Per User */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">
                  Maximum Bet Per User (0 = no limit)
                </label>
                <input
                  type="number"
                  min="0"
                  value={data.maxBetPerUser || ''}
                  onChange={(e) => setData({ maxBetPerUser: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className={`w-full px-4 py-3 rounded-button bg-bg-input border transition-colors ${
                    errors.maxBetPerUser ? 'border-red-500' : 'border-border-input focus:border-primary'
                  }`}
                />
                {errors.maxBetPerUser && (
                  <p className="text-red-400 text-sm">{errors.maxBetPerUser}</p>
                )}
              </div>

              {/* Whitelist Addresses */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-primary">
                  Whitelisted Addresses (one per line)
                </label>
                <textarea
                  value={data.whitelistAddresses?.join('\n') || ''}
                  onChange={(e) => setData({ 
                    whitelistAddresses: e.target.value.split('\n').filter(addr => addr.trim())
                  })}
                  placeholder="0x742d35Cc6635C0532925a3b8D84e4123a4b37A12&#10;0x8a7c2d3e4f5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d"
                  className={`w-full px-4 py-3 rounded-button bg-bg-input border transition-colors resize-none h-32 ${
                    errors.whitelistAddresses ? 'border-red-500' : 'border-border-input focus:border-primary'
                  }`}
                />
                {errors.whitelistAddresses && (
                  <p className="text-red-400 text-sm">{errors.whitelistAddresses}</p>
                )}
                <p className="text-text-muted text-xs">
                  Only these addresses will be able to bet on your market.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Gas Estimation */}
        <div className="bg-bg-card rounded-button p-4 border border-border-card">
          <h4 className="font-semibold text-text-primary mb-2">Gas Estimation</h4>
          <div className="text-sm text-text-muted">
            Estimated gas cost: ~0.001 ETH
          </div>
        </div>
      </motion.div>
    );
  }

  // Step 5: Review and Deploy
  function ReviewAndDeploy() {
    const maxBettorStake = calculateMaxBettorStake();
    const creationFee = calculateCreationFee();

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <CheckCircleIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-text-primary">Review Your Market</h3>
        </div>

        <div className="space-y-6">
          {/* Market Overview */}
          <div className="bg-bg-card rounded-button p-6 border border-border-card">
            <h4 className="font-semibold text-text-primary mb-4">Market Overview</h4>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-text-muted">Prediction:</div>
                <div className="font-medium">{data.predictedOutcome}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Title:</div>
                <div className="font-medium">{data.title}</div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-text-muted">Category:</div>
                  <div className="font-medium capitalize">{data.category}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">League:</div>
                  <div className="font-medium">{data.league || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-text-muted">Region:</div>
                  <div className="font-medium">{data.region || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Economics */}
          <div className="bg-bg-card rounded-button p-6 border border-border-card">
            <h4 className="font-semibold text-text-primary mb-4">Market Economics</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-text-muted">Token:</div>
                <div className="font-medium">{data.usesBitr ? 'BITR' : 'STT'}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Odds:</div>
                <div className="font-medium">{data.odds ? formatOdds(data.odds) : 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Your Stake:</div>
                <div className="font-medium">{data.creatorStake} {data.usesBitr ? 'BITR' : 'STT'}</div>
              </div>
              <div>
                <div className="text-sm text-text-muted">Max Opposing Bets:</div>
                <div className="font-medium">{maxBettorStake ? maxBettorStake.toFixed(2) : '0'} {data.usesBitr ? 'BITR' : 'STT'}</div>
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="bg-bg-card rounded-button p-6 border border-border-card">
            <h4 className="font-semibold text-text-primary mb-4">Schedule</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Betting Closes:</span>
                <span>{data.eventStartTime ? formatDateTime(new Date(data.eventStartTime.getTime() - 60000)) : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Event Period:</span>
                <span>
                  {data.eventStartTime && data.eventEndTime 
                    ? `${formatDateTime(data.eventStartTime)} - ${formatDateTime(data.eventEndTime)}`
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          {data.isPrivate && (
            <div className="bg-bg-card rounded-button p-6 border border-border-card">
              <h4 className="font-semibold text-text-primary mb-4">Access Control</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Market Type:</span>
                  <span className="text-primary">Private</span>
                </div>
                {data.maxBetPerUser && data.maxBetPerUser > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Max Bet Per User:</span>
                    <span>{data.maxBetPerUser} {data.usesBitr ? 'BITR' : 'STT'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Whitelisted Addresses:</span>
                  <span>{data.whitelistAddresses?.length || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Total Cost */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-button p-6 border border-primary/20">
            <h4 className="font-semibold text-text-primary mb-4">Total Cost</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Creation Fee:</span>
                <span>{creationFee} {data.usesBitr ? 'BITR' : 'STT'}</span>
              </div>
              <div className="flex justify-between">
                <span>Your Stake:</span>
                <span>{data.creatorStake || 0} {data.usesBitr ? 'BITR' : 'STT'}</span>
              </div>
              <div className="border-t border-border-card pt-2">
                <div className="flex justify-between text-lg font-semibold text-primary">
                  <span>Total Required:</span>
                  <span>{(creationFee + (data.creatorStake || 0)).toFixed(2)} {data.usesBitr ? 'BITR' : 'STT'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-button p-4">
            <div className="flex gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-200">
                <div className="font-medium mb-1">Important Notice</div>
                <p>
                  Once deployed, your market cannot be modified. Make sure all details are correct.
                  Your stake will be locked until the market is settled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
}
