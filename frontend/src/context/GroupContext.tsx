import {createContext, useContext} from 'react'
import type { profileGroupData } from '@/utils/types'

type GroupContextType = {
    groups: profileGroupData[] | null
    refetchGroups: () => Promise<void>
  }
  
  export const GroupContext = createContext<GroupContextType | null>(null)
  
  export function useGroup() {
    return useContext(GroupContext)
}