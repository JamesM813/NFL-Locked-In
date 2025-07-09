import {createContext, useContext} from 'react'
import type { profileData } from '@/utils/types'

type ProfileGroupType = {
    profile: profileData | null
    refetchProfiles: () => Promise<void>
  }

export const ProfileContext = createContext<ProfileGroupType | null>(null)

export function useProfile() {
    return useContext(ProfileContext)
}