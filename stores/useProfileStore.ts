import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useReputationStore } from './useReputationStore'

export interface UserProfile {
  address: string
  username: string
  displayName: string
  bio: string
  avatar?: string
  joinDate: string
  location?: string
  website?: string
  twitter?: string
  discord?: string
  telegram?: string
  isVerified: boolean
  preferences: {
    notifications: boolean
    privateProfile: boolean
    showActivity: boolean
  }
}

interface ProfileState {
  profiles: Record<string, UserProfile>
  currentProfile: UserProfile | null
  isProfileModalOpen: boolean
  
  // Actions
  setProfile: (address: string, profile: Partial<UserProfile>) => void
  getProfile: (address: string) => UserProfile | null
  setCurrentProfile: (address: string | null) => void
  openProfileModal: () => void
  closeProfileModal: () => void
  updateCurrentProfile: (updates: Partial<UserProfile>) => void
  hasProfile: (address: string) => boolean
  uploadAvatar: (address: string, file: File) => Promise<string>
}

const defaultProfile = (address: string): UserProfile => ({
  address,
  username: `user_${address.slice(0, 6)}`,
  displayName: `User ${address.slice(0, 6)}`,
  bio: '',
  joinDate: new Date().toISOString(),
  isVerified: false,
  preferences: {
    notifications: true,
    privateProfile: false,
    showActivity: true,
  }
})

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: {},
      currentProfile: null,
      isProfileModalOpen: false,

      setProfile: (address: string, profileData: Partial<UserProfile>) => {
        const existingProfile = get().profiles[address.toLowerCase()]
        const newProfile: UserProfile = {
          ...defaultProfile(address),
          ...existingProfile,
          ...profileData,
          address: address.toLowerCase(),
        }
        
        // Initialize reputation for new users
        const reputationStore = useReputationStore.getState()
        reputationStore.initializeUser(address.toLowerCase())
        
        set((state) => ({
          profiles: {
            ...state.profiles,
            [address.toLowerCase()]: newProfile,
          },
        }))
      },

      getProfile: (address: string) => {
        return get().profiles[address.toLowerCase()] || null
      },

      setCurrentProfile: (address: string | null) => {
        if (!address) {
          set({ currentProfile: null })
          return
        }
        
        const profile = get().getProfile(address)
        set({ currentProfile: profile })
      },

      openProfileModal: () => set({ isProfileModalOpen: true }),
      closeProfileModal: () => set({ isProfileModalOpen: false }),

      updateCurrentProfile: (updates: Partial<UserProfile>) => {
        const current = get().currentProfile
        if (!current) return

        const updatedProfile = { ...current, ...updates }
        
        set((state) => ({
          currentProfile: updatedProfile,
          profiles: {
            ...state.profiles,
            [current.address]: updatedProfile,
          },
        }))
      },

      hasProfile: (address: string) => {
        const profile = get().getProfile(address)
        if (!profile) return false
        
        const defaultUsername = `user_${address.slice(0, 6)}`
        const hasCustomUsername = profile.username !== defaultUsername
        const hasCustomDisplay = profile.displayName !== `User ${address.slice(0, 6)}`
        const hasBio = !!(profile.bio && profile.bio.trim() !== '')
        
        // Consider profile complete if user has customized username, display name, or added bio
        return hasCustomUsername || hasCustomDisplay || hasBio
      },

      uploadAvatar: async (address: string, file: File): Promise<string> => {
        // Convert file to base64 for localStorage storage
        // In a real app, you'd upload to a cloud service like AWS S3, Cloudinary, etc.
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            const { profiles } = get()
            const updatedProfiles = {
              ...profiles,
              [address.toLowerCase()]: {
                ...profiles[address.toLowerCase()],
                avatar: base64
              }
            }
            
            set({ profiles: updatedProfiles })
            resolve(base64)
          }
          reader.onerror = () => reject(new Error('Failed to read file'))
          reader.readAsDataURL(file)
        })
      },
    }),
    {
      name: 'bitr-profiles',
      partialize: (state) => ({ 
        profiles: state.profiles 
      }),
    }
  )
) 