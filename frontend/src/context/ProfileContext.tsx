import {createContext, useContext} from 'react'
import type { userData } from '@/utils/types'

export const ProfileContext = createContext<userData | null>(null)

export function useProfile() {
    return useContext(ProfileContext)
}