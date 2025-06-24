import {createContext, useContext} from 'react'
import type { groupData } from '@/utils/types'

export const GroupContext = createContext<groupData | null>(null)

export function useGroup() {
    return useContext(GroupContext)
}