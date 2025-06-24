import {createContext, useContext} from 'react'
import type { profileData } from '@/utils/types'

export const ProfileContext = createContext<profileData | null>(null)

export function useProfile() {
    return useContext(ProfileContext)
}