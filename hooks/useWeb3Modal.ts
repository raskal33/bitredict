import { useEffect, useState } from 'react'

export function useWeb3ModalSafe() {
  const [modalOpen, setModalOpen] = useState<(() => void) | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@web3modal/wagmi/react').then(({ useWeb3Modal }) => {
        // We'll use a global reference instead
        if ((window as any).web3modal) {
          setModalOpen(() => (window as any).web3modal.open)
        }
      })
    }
  }, [])

  const openModal = () => {
    if (typeof window !== 'undefined' && (window as any).web3modal) {
      (window as any).web3modal.open()
    }
  }

  return { open: openModal }
} 