import {createContext, useContext} from 'react'
import type { profileGroupData } from '@/utils/types'

export const GroupContext = createContext<profileGroupData[] | null>(null)

export function useGroup() {
    return useContext(GroupContext)
}