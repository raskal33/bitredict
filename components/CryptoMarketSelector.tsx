'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, TrendingUp, TrendingDown, Star, AlertCircle, Target, Clock } from 'lucide-react';
import { cryptoService, type CryptoData, type PriceTarget } from '@/services/cryptoService';
import Image from 'next/image';

// Remove duplicate interfaces since they're imported from the service

interface CryptoMarket {
  coinId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  targetPrice: number;
  direction: 'above' | 'below';
  timeframe: '1h' | '24h' | '7d' | '30d';
  difficulty: 'easy' | 'medium' | 'hard';
  volatility: number;
}

interface CryptoMarketSelectorProps {
  onMarketSelect: (market: CryptoMarket) => void;
  selectedTimeframe?: string;
  selectedDifficulty?: string;
}

const CryptoMarketSelector: React.FC<CryptoMarketSelectorProps> = ({
  onMarketSelect,
  selectedTimeframe = '24h',
  selectedDifficulty = 'all'
}) => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [filteredCryptos, setFilteredCryptos] = useState<CryptoData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [priceTargets, setPriceTargets] = useState<PriceTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<PriceTarget | null>(null);
  const [timeframe, setTimeframe] = useState(selectedTimeframe);
  const [difficultyFilter, setDifficultyFilter] = useState(selectedDifficulty);
  const [loadingTargets, setLoadingTargets] = useState(false);

  // Fetch popular cryptocurrencies
  const fetchCryptos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const popularCryptos = await cryptoService.getPopularCryptos();
      setCryptos(popularCryptos);
      setFilteredCryptos(popularCryptos);
      console.log('Loaded cryptocurrencies:', popularCryptos);
      
    } catch (err) {
      console.error('Error fetching cryptocurrencies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cryptocurrencies');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search cryptocurrencies
  const searchCryptos = useCallback(async (query: string) => {
    if (!query.trim()) {
      setFilteredCryptos(cryptos);
      return;
    }

    try {
      const searchResults = await cryptoService.searchCryptos(query);
      
      if (searchResults.length > 0) {
        setFilteredCryptos(searchResults.slice(0, 10));
      } else {
        // Filter local cryptos
        const filtered = cryptos.filter(crypto =>
          crypto.name.toLowerCase().includes(query.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredCryptos(filtered);
      }
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to local filtering
      const filtered = cryptos.filter(crypto =>
        crypto.name.toLowerCase().includes(query.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCryptos(filtered);
    }
  }, [cryptos]);

  // Fetch price targets for selected crypto
  const fetchPriceTargets = useCallback(async (coinSymbol: string) => {
    try {
      setLoadingTargets(true);
      
      // Convert symbol to coinpaprika ID (simplified approach)
      const coinIdMap: { [key: string]: string } = {
        'BTC': 'btc-bitcoin',
        'ETH': 'eth-ethereum',
        'SOL': 'sol-solana',
        'ADA': 'ada-cardano',
        'MATIC': 'matic-polygon',
        'AVAX': 'avax-avalanche',
        'DOT': 'dot-polkadot',
        'LINK': 'link-chainlink',
        'UNI': 'uni-uniswap',
        'LTC': 'ltc-litecoin'
      };
      
      const coinId = coinIdMap[coinSymbol] || `${coinSymbol.toLowerCase()}-${coinSymbol.toLowerCase()}`;
      
      const response = await fetch(`/api/crypto/targets/${coinId}?timeframe=${timeframe}`);
      const data = await response.json();
      
      if (data.success) {
        setPriceTargets(data.targets);
      } else {
        // Generate fallback targets based on current price and volatility
        const crypto = selectedCrypto;
        if (crypto) {
          const fallbackTargets = generateFallbackTargets(crypto.price, crypto.volatility || 5);
          setPriceTargets(fallbackTargets);
        }
      }
    } catch (err) {
      console.error('Error fetching price targets:', err);
      // Generate fallback targets
      if (selectedCrypto) {
        const fallbackTargets = generateFallbackTargets(selectedCrypto.price, selectedCrypto.volatility || 5);
        setPriceTargets(fallbackTargets);
      }
    } finally {
      setLoadingTargets(false);
    }
  }, [selectedCrypto, timeframe]);

  // Generate fallback targets when API fails
  const generateFallbackTargets = (currentPrice: number, volatility: number): PriceTarget[] => {
    const percentages = [5, 10, 15, 25, 50];
    const targets: PriceTarget[] = [];
    
    for (const percentage of percentages) {
      const adjustedPercentage = Math.max(percentage, volatility * 2);
      
      targets.push({
        direction: 'above',
        targetPrice: currentPrice * (1 + adjustedPercentage / 100),
        percentage: adjustedPercentage,
        difficulty: adjustedPercentage <= 10 ? 'easy' : adjustedPercentage <= 25 ? 'medium' : 'hard'
      });

      targets.push({
        direction: 'below',
        targetPrice: currentPrice * (1 - adjustedPercentage / 100),
        percentage: adjustedPercentage,
        difficulty: adjustedPercentage <= 10 ? 'easy' : adjustedPercentage <= 25 ? 'medium' : 'hard'
      });
    }

    return targets.sort((a, b) => a.percentage - b.percentage);
  };

  // Handle crypto selection
  const handleCryptoSelect = (crypto: CryptoData) => {
    setSelectedCrypto(crypto);
    setSelectedTarget(null);
    fetchPriceTargets(crypto.symbol);
  };

  // Handle target selection and create market
  const handleTargetSelect = (target: PriceTarget) => {
    if (!selectedCrypto) return;
    
    setSelectedTarget(target);
    
    // Convert symbol to coinpaprika ID for market creation
    const coinIdMap: { [key: string]: string } = {
      'BTC': 'btc-bitcoin',
      'ETH': 'eth-ethereum',
      'SOL': 'sol-solana',
      'ADA': 'ada-cardano',
      'MATIC': 'matic-polygon',
      'AVAX': 'avax-avalanche',
      'DOT': 'dot-polkadot',
      'LINK': 'link-chainlink',
      'UNI': 'uni-uniswap',
      'LTC': 'ltc-litecoin'
    };
    
    const coinId = coinIdMap[selectedCrypto.symbol] || `${selectedCrypto.symbol.toLowerCase()}-${selectedCrypto.symbol.toLowerCase()}`;
    
    const market: CryptoMarket = {
      coinId,
      symbol: selectedCrypto.symbol,
      name: selectedCrypto.name,
      currentPrice: selectedCrypto.price,
      targetPrice: target.targetPrice,
      direction: target.direction,
      timeframe: timeframe as '1h' | '24h' | '7d' | '30d',
      difficulty: target.difficulty,
      volatility: selectedCrypto.volatility || 5
    };
    
    onMarketSelect(market);
  };

  // Filter cryptos by difficulty
  useEffect(() => {
    if (difficultyFilter === 'all') {
      return;
    }
    
    const filtered = cryptos.filter(crypto => crypto.difficulty === difficultyFilter);
    setFilteredCryptos(filtered);
  }, [difficultyFilter, cryptos]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCryptos(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchCryptos]);

  // Load cryptocurrencies on mount
  useEffect(() => {
    fetchCryptos();
  }, [fetchCryptos]);

  // Format price for display
  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(0)}`;
  };

  // Format market cap
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap.toFixed(0)}`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fallback logo component
  const CoinLogo = ({ logoUrl, symbol, size = 40 }: { logoUrl?: string; symbol: string; size?: number }) => {
    const [imageError, setImageError] = useState(false);
    
    if (!logoUrl || imageError) {
      return (
        <div 
          className="bg-gray-100 rounded-full flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="font-bold text-gray-700 text-sm">{symbol}</span>
        </div>
      );
    }

    return (
      <Image
        src={logoUrl}
        alt={`${symbol} logo`}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => setImageError(true)}
      />
    );
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error Loading Cryptocurrencies</span>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchCryptos}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Select Cryptocurrency Market
        </h3>
        <p className="text-gray-600">
          Choose a cryptocurrency and price target for your prediction market.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="1h">1 Hour</option>
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
        </select>
        
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Crypto List */}
      {!selectedCrypto && (
        <div className="grid gap-3">
          {filteredCryptos.map((crypto) => (
            <div
              key={crypto.symbol}
              onClick={() => handleCryptoSelect(crypto)}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CoinLogo logoUrl={crypto.logo} symbol={crypto.symbol} size={40} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{crypto.name}</h4>
                      <span className="text-sm text-gray-500">#{crypto.rank}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(crypto.difficulty || 'medium')}`}>
                        {crypto.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{crypto.symbol}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatPrice(crypto.price)}</div>
                  <div className={`flex items-center gap-1 text-sm ${
                    crypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {crypto.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {crypto.change24h.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatMarketCap(crypto.marketCap)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Crypto and Price Targets */}
      {selectedCrypto && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <CoinLogo logoUrl={selectedCrypto.logo} symbol={selectedCrypto.symbol} size={48} />
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedCrypto.name}</h4>
                  <p className="text-sm text-gray-600">{selectedCrypto.symbol}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCrypto(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Change
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Price</span>
                <div className="font-semibold">{formatPrice(selectedCrypto.price)}</div>
              </div>
              <div>
                <span className="text-gray-600">24h Change</span>
                <div className={`font-semibold ${
                  selectedCrypto.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedCrypto.change24h.toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-gray-600">Volatility</span>
                <div className="font-semibold">{(selectedCrypto.volatility || 5).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Price Targets */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Select Price Target</h4>
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{timeframe}</span>
            </div>
            
            {loadingTargets ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {priceTargets.map((target, index) => (
                  <div
                    key={index}
                    onClick={() => handleTargetSelect(target)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTarget === target
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(target.difficulty)}`}>
                        {target.difficulty}
                      </span>
                      <div className={`flex items-center gap-1 text-sm ${
                        target.direction === 'above' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {target.direction === 'above' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {target.direction === 'above' ? 'Above' : 'Below'}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {formatPrice(target.targetPrice)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {target.percentage.toFixed(1)}% {target.direction}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedTarget && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <Star className="w-4 h-4" />
                <span className="font-medium">Market Selected</span>
              </div>
              <p className="text-green-700 text-sm">
                Predicting {selectedCrypto.symbol} will go {selectedTarget.direction} {formatPrice(selectedTarget.targetPrice)} 
                within {timeframe} ({selectedTarget.difficulty} difficulty)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CryptoMarketSelector; 