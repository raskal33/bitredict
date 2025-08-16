export const SOMNIA_NETWORK = {
  chainId: '0xC478', // 50312 in hex
  chainName: 'Somnia Testnet',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: ['https://dream-rpc.somnia.network'],
  blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
}

export async function addSomniaNetwork() {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Try to switch to the network first
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_NETWORK.chainId }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_NETWORK],
          })
        } catch (addError) {
          console.error('Failed to add Somnia network:', addError)
          throw addError
        }
      } else {
        console.error('Failed to switch to Somnia network:', switchError)
        throw switchError
      }
    }
  } else {
    throw new Error('MetaMask is not installed')
  }
}

export function getSomniaNetworkConfig() {
  return SOMNIA_NETWORK
} 