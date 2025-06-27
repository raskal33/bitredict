"use client";

import { useState, useEffect, ChangeEvent } from "react";
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
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  TagIcon
} from "@heroicons/react/24/outline";
import Button from "@/components/button";
import Input from "@/components/input";
import Textarea from "@/components/textarea";
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
      const predictedOutcomeBytes32 = `0x${Buffer.from(data.predictedOutcome || '', 'utf8').toString('hex').padEnd(64, '0')}`;
      const eventStartTime = Math.floor((data.eventStartTime?.getTime() || 0) / 1000);
      const eventEndTime = Math.floor((data.eventEndTime?.getTime() || 0) / 1000);
      const creatorStakeWei = parseEther((data.creatorStake || 0).toString());
      const maxBetPerUserWei = data.maxBetPerUser ? parseEther(data.maxBetPerUser.toString()) : BigInt(0);

      writeContract({
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
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number | boolean = value;

    if (type === 'number') {
      finalValue = value === '' ? '' : parseFloat(value);
    }
    if (name === 'odds' && typeof finalValue === 'number') {
      finalValue = Math.floor(finalValue * 100);
    }
    setData({ [name]: finalValue });
  };
  
  const handleDateChange = (name: 'eventStartTime' | 'eventEndTime', value: string) => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      setData({ [name]: date });
    }
  };

  const formatOdds = (odds: number) => (odds / 100).toFixed(2) + "x";
  const formatDateTime = (date: Date) => date.toLocaleString();
  const formatDateTimeForInput = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
    return <DeploymentSuccess data={data} hash={deploymentHash} onReset={() => { reset(); setDeploymentHash(''); }} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="glass-card p-6 md:p-8 rounded-2xl">
        {/* Header and Progress Bar */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{STEP_TITLES[step - 1]}</h1>
          <p className="text-text-secondary">Follow the steps to create your prediction market.</p>
          <div className="mt-4 w-full bg-bg-overlay rounded-full h-2">
            <motion.div 
              className="bg-gradient-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((step -1) / (STEP_TITLES.length -1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 1 && <BasicInformation data={data} errors={errors} onInputChange={handleInputChange} onCategoryChange={(c) => setData({ category: c })} />}
            {step === 2 && <MarketConfiguration data={data} errors={errors} onInputChange={handleInputChange} onOddsChange={(o) => setData({ odds: o})} onStakeChange={(s) => setData({ creatorStake: s })} onToggleBitr={() => setData({ usesBitr: !data.usesBitr })} />}
            {step === 3 && <EventTiming data={data} errors={errors} onDateChange={handleDateChange} />}
            {step === 4 && <AdvancedSettings data={data} errors={errors} onInputChange={handleInputChange} onTogglePrivate={() => setData({ isPrivate: !data.isPrivate })} />}
            {step === 5 && <ReviewAndDeploy data={data} calculations={{ maxBettorStake: calculateMaxBettorStake(), creationFee: calculateCreationFee() }} formatters={{ formatOdds, formatDateTime }} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button variant="outline" onClick={handlePrevious} disabled={step === 1 || isLoading} icon={<ChevronLeftIcon className="w-4 h-4"/>}>
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">{`Step ${step} of ${STEP_TITLES.length}`}</span>
          </div>

          <Button variant="primary" onClick={handleNext} disabled={isLoading || isPending || isConfirming} loading={isLoading || isPending || isConfirming}>
            {step === STEP_TITLES.length ? 'Deploy Market' : 'Next Step'}
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sub-components for each step, now using Input and Textarea

function BasicInformation({ data, errors, onInputChange, onCategoryChange }: any) {
  return (
    <div className="space-y-6">
      <Input
        label="Market Title"
        name="title"
        value={data.title || ''}
        onChange={onInputChange}
        placeholder="e.g., Bitcoin to hit $100k by March 2025"
        error={errors.title}
        maxLength={100}
        icon={<PencilIcon className="w-4 h-4 text-text-muted" />}
      />
      <Textarea
        label="Description (Optional)"
        name="description"
        value={data.description || ''}
        onChange={onInputChange}
        placeholder="Provide details about the market, resolution sources, etc."
        rows={4}
      />
      <Input
        label="Predicted Outcome"
        name="predictedOutcome"
        value={data.predictedOutcome || ''}
        onChange={onInputChange}
        placeholder="The specific outcome you are predicting"
        error={errors.predictedOutcome}
        maxLength={64}
        icon={<ClipboardDocumentIcon className="w-4 h-4 text-text-muted" />}
      />
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Category</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value)}
              className={`flex items-center justify-center gap-2 p-3 rounded-button border-2 transition-all ${
                data.category === cat.value
                  ? 'bg-primary border-primary text-black shadow-lg'
                  : 'bg-bg-card border-border-card hover:border-primary/50'
              }`}
            >
              <span className="text-lg">{cat.emoji}</span>
              <span className="text-sm font-semibold">{cat.label}</span>
            </button>
          ))}
        </div>
        {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
      </div>
    </div>
  );
}

function MarketConfiguration({ data, errors, onInputChange, onOddsChange, onStakeChange, onToggleBitr }: any) {
  const maxBettorStake = data.creatorStake && data.odds && data.odds > 100 
    ? ((data.creatorStake * 100) / (data.odds - 100)).toFixed(2)
    : '0.00';
    
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="Creator's Stake"
          name="creatorStake"
          type="number"
          value={data.creatorStake || ''}
          onChange={(e) => onStakeChange(parseFloat(e.target.value) || 0)}
          error={errors.creatorStake}
          min="20"
          max="1000000"
          icon={<CurrencyDollarIcon className="w-4 h-4 text-text-muted" />}
        />
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Odds</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="101"
              max="10000"
              step="1"
              value={data.odds || 200}
              onChange={(e) => onOddsChange(parseInt(e.target.value))}
              className="w-full h-2 bg-bg-overlay rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="font-bold text-lg text-primary w-24 text-center">
              {(data.odds / 100).toFixed(2)}x
            </span>
          </div>
          {errors.odds && <p className="mt-1 text-sm text-red-500">{errors.odds}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-button bg-bg-overlay">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleBitr}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              data.usesBitr ? 'bg-primary' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                data.usesBitr ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="font-medium">Use BITR for stake and bets</span>
        </div>
        <span className="font-mono text-sm px-2 py-1 rounded-md bg-bg-card text-primary">
          {data.usesBitr ? 'BITR' : 'STT'}
        </span>
      </div>
      
      <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-r-lg">
        <h4 className="font-semibold text-text-primary">Market Dynamics</h4>
        <p className="text-sm text-text-secondary mt-1">
          Based on your stake of <span className="font-bold text-primary">{data.creatorStake || 0} {data.usesBitr ? 'BITR' : 'STT'}</span> and odds of <span className="font-bold text-primary">{(data.odds / 100).toFixed(2)}x</span>, the maximum potential stake from bettors is <span className="font-bold text-primary">{maxBettorStake} {data.usesBitr ? 'BITR' : 'STT'}</span>.
        </p>
      </div>
    </div>
  );
}

function EventTiming({ data, errors, onDateChange }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Input
        label="Event Start Time"
        type="datetime-local"
        name="eventStartTime"
        value={data.eventStartTime ? formatDateTimeForInput(data.eventStartTime) : ''}
        onChange={(e) => onDateChange('eventStartTime', e.target.value)}
        error={errors.eventStartTime}
        icon={<CalendarIcon className="w-4 h-4 text-text-muted" />}
      />
      <Input
        label="Event End Time"
        type="datetime-local"
        name="eventEndTime"
        value={data.eventEndTime ? formatDateTimeForInput(data.eventEndTime) : ''}
        onChange={(e) => onDateChange('eventEndTime', e.target.value)}
        error={errors.eventEndTime}
        icon={<ClockIcon className="w-4 h-4 text-text-muted" />}
      />
    </div>
  );
}

function AdvancedSettings({ data, errors, onInputChange, onTogglePrivate }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-button bg-bg-overlay">
        <label htmlFor="isPrivate" className="font-medium text-text-primary">Make this a private market</label>
        <button
          id="isPrivate"
          type="button"
          onClick={onTogglePrivate}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            data.isPrivate ? 'bg-primary' : 'bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              data.isPrivate ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {data.isPrivate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            <Input
              label="Max Bet Per User (Optional)"
              name="maxBetPerUser"
              type="number"
              value={data.maxBetPerUser || ''}
              onChange={onInputChange}
              error={errors.maxBetPerUser}
              placeholder="0 for no limit"
              icon={<ScaleIcon className="w-4 h-4 text-text-muted" />}
            />
            <Textarea
              label="Whitelist Addresses (Optional)"
              name="whitelistAddresses"
              value={data.whitelistAddresses?.join('\n') || ''}
              onChange={(e) => onInputChange({
                target: { name: 'whitelistAddresses', value: e.target.value.split('\n') }
              })}
              error={errors.whitelistAddresses}
              placeholder="Enter one Ethereum address per line."
              rows={5}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="League (Optional)"
          name="league"
          value={data.league || ''}
          onChange={onInputChange}
          placeholder="e.g., Premier League, NBA"
          icon={<TagIcon className="w-4 h-4 text-text-muted" />}
        />
        <Input
          label="Region (Optional)"
          name="region"
          value={data.region || ''}
          onChange={onInputChange}
          placeholder="e.g., USA, Europe"
          icon={<UserGroupIcon className="w-4 h-4 text-text-muted" />}
        />
      </div>
    </div>
  );
}

function ReviewAndDeploy({ data, calculations, formatters }: any) {
  return (
    <div className="space-y-6 text-text-secondary">
      <div className="p-6 rounded-2xl bg-bg-card border border-border-card">
        <h3 className="text-lg font-bold text-text-primary mb-4">Final Review</h3>
        <div className="space-y-3">
          <ReviewItem label="Title" value={data.title} />
          <ReviewItem label="Predicted Outcome" value={data.predictedOutcome} />
          <ReviewItem label="Category" value={data.category} isCapitalized={true} />
          <hr className="border-border-card/50" />
          <ReviewItem label="Your Stake" value={`${data.creatorStake} ${data.usesBitr ? 'BITR' : 'STT'}`} />
          <ReviewItem label="Odds" value={formatters.formatOdds(data.odds)} />
          <ReviewItem label="Potential Bettor Stake" value={`${calculations.maxBettorStake.toFixed(2)} ${data.usesBitr ? 'BITR' : 'STT'}`} />
          <hr className="border-border-card/50" />
          <ReviewItem label="Starts" value={formatters.formatDateTime(data.eventStartTime)} />
          <ReviewItem label="Ends" value={formatters.formatDateTime(data.eventEndTime)} />
          <hr className="border-border-card/50" />
          <ReviewItem label="Privacy" value={data.isPrivate ? 'Private' : 'Public'} />
          {data.isPrivate && <ReviewItem label="Max Bet Per User" value={data.maxBetPerUser > 0 ? `${data.maxBetPerUser} ${data.usesBitr ? 'BITR' : 'STT'}` : 'Unlimited'} />}
        </div>
      </div>
      <div className="p-4 border-l-4 border-yellow-500 bg-yellow-500/10 rounded-r-lg">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
          <div>
            <h4 className="font-semibold text-text-primary">Important</h4>
            <p className="text-sm text-yellow-200/80 mt-1">
              Once deployed, market parameters are immutable. You will pay a creation fee of <span className="font-bold">{calculations.creationFee} {data.usesBitr ? 'BITR' : 'STT'}</span> plus gas fees. Your initial stake will be locked until the market is resolved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewItem({ label, value, isCapitalized = false }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="font-medium text-text-muted">{label}:</span>
      <span className={`font-semibold text-text-primary text-right ${isCapitalized ? 'capitalize' : ''}`}>{value || 'Not set'}</span>
    </div>
  );
}

function DeploymentSuccess({ data, hash, onReset }: { data: any, hash: string, onReset: () => void }) {
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
        <h2 className="text-2xl font-bold text-text-primary mb-2">Market Created Successfully!</h2>
        <p className="text-text-secondary mb-6">Your prediction market has been deployed to the blockchain.</p>

        <div className="bg-bg-card rounded-button p-4 mb-6 text-left">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-text-muted">Transaction Hash:</span>
              <a 
                href={`https://explorer.somnia.network/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-secondary flex items-center gap-1"
              >
                {hash.slice(0, 10)}...{hash.slice(-8)}
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
          <Button onClick={() => window.location.href = '/'}>View Markets</Button>
          <Button variant="outline" onClick={onReset}>Create Another</Button>
        </div>
      </motion.div>
    </div>
  );
}
