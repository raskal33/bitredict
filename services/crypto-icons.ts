/**
 * Crypto Icons Service
 * Provides appropriate icons for different cryptocurrencies and categories
 */

export interface CryptoIcon {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CRYPTO_ICONS: Record<string, CryptoIcon> = {
  'BTC': {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    color: 'text-orange-400',
    bgColor: 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20'
  },
  'ETH': {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    color: 'text-blue-400',
    bgColor: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20'
  },
  'BNB': {
    symbol: 'BNB',
    name: 'Binance Coin',
    icon: '🟡',
    color: 'text-yellow-400',
    bgColor: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20'
  },
  'ADA': {
    symbol: 'ADA',
    name: 'Cardano',
    icon: '🔵',
    color: 'text-blue-400',
    bgColor: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20'
  },
  'SOL': {
    symbol: 'SOL',
    name: 'Solana',
    icon: '🟣',
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-r from-purple-500/20 to-violet-500/20'
  },
  'MATIC': {
    symbol: 'MATIC',
    name: 'Polygon',
    icon: '🟣',
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20'
  },
  'AVAX': {
    symbol: 'AVAX',
    name: 'Avalanche',
    color: 'text-red-400',
    icon: '🔴',
    bgColor: 'bg-gradient-to-r from-red-500/20 to-orange-500/20'
  },
  'DOT': {
    symbol: 'DOT',
    name: 'Polkadot',
    icon: '🟡',
    color: 'text-pink-400',
    bgColor: 'bg-gradient-to-r from-pink-500/20 to-rose-500/20'
  },
  'LINK': {
    symbol: 'LINK',
    name: 'Chainlink',
    icon: '🔗',
    color: 'text-blue-400',
    bgColor: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20'
  },
  'UNI': {
    symbol: 'UNI',
    name: 'Uniswap',
    icon: '🦄',
    color: 'text-pink-400',
    bgColor: 'bg-gradient-to-r from-pink-500/20 to-purple-500/20'
  }
};

export const CATEGORY_ICONS: Record<string, CryptoIcon> = {
  'cryptocurrency': {
    symbol: 'CRYPTO',
    name: 'Cryptocurrency',
    icon: '₿',
    color: 'text-yellow-400',
    bgColor: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20'
  },
  'crypto': {
    symbol: 'CRYPTO',
    name: 'Cryptocurrency',
    icon: '₿',
    color: 'text-yellow-400',
    bgColor: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20'
  },
  'bitcoin': {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    color: 'text-orange-400',
    bgColor: 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20'
  },
  'ethereum': {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    color: 'text-blue-400',
    bgColor: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20'
  },
  'sports': {
    symbol: 'SPORTS',
    name: 'Sports',
    icon: '⚽',
    color: 'text-green-400',
    bgColor: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20'
  },
  'football': {
    symbol: 'FOOTBALL',
    name: 'Football',
    icon: '⚽',
    color: 'text-green-400',
    bgColor: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20'
  }
};

/**
 * Get crypto icon for a specific asset
 */
export function getCryptoIcon(asset: string): CryptoIcon {
  const upperAsset = asset.toUpperCase();
  return CRYPTO_ICONS[upperAsset] || {
    symbol: upperAsset,
    name: upperAsset,
    icon: '₿',
    color: 'text-gray-400',
    bgColor: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20'
  };
}

/**
 * Get category icon for a specific category
 */
export function getCategoryIcon(category: string): CryptoIcon {
  const lowerCategory = category.toLowerCase();
  return CATEGORY_ICONS[lowerCategory] || {
    symbol: 'UNKNOWN',
    name: 'Unknown',
    icon: '❓',
    color: 'text-gray-400',
    bgColor: 'bg-gradient-to-r from-gray-500/20 to-slate-500/20'
  };
}

/**
 * Get icon for pool based on category and asset
 */
export function getPoolIcon(category: string, asset?: string): CryptoIcon {
  if (category === 'cryptocurrency' || category === 'crypto') {
    return asset ? getCryptoIcon(asset) : getCategoryIcon(category);
  }
  return getCategoryIcon(category);
}
