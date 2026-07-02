import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/LoadingSpinner'

type SeasonContextType = {
  currentSeason: number
  currentWeek: number
}

export const SeasonContext = createContext<SeasonContextType | null>(null)

export function useSeason() {
  const context = useContext(SeasonContext)
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider')
  }
  return context
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [season, setSeason] = useState<number | null>(null)
  const [currentWeek, setCurrentWeek] = useState(1)

  useEffect(() => {
    async function fetchSeasonAndWeek() {
      let currentSeason = 2025

      const { data: config, error: configError } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'current_season')
        .single()

      if (configError) {
        console.error('Error fetching current season:', configError)
      } else if (config) {
        currentSeason = parseInt(config.value)
      }

      // Current week = the first week that still has an unlocked game;
      // once every game of the season is locked, stay on week 18.
      const { data: games, error: gamesError } = await supabase
        .from('nfl_schedule')
        .select('week, locks_at')
        .eq('season', currentSeason)

      if (gamesError) {
        console.error('Error fetching schedule for current week:', gamesError)
      } else if (games && games.length > 0) {
        const now = new Date()
        const openWeeks = games
          .filter((game) => game.locks_at && new Date(game.locks_at) > now)
          .map((game) => game.week)
        setCurrentWeek(openWeeks.length > 0 ? Math.min(...openWeeks) : 18)
      }

      setSeason(currentSeason)
    }

    fetchSeasonAndWeek()
  }, [])

  if (season === null) return <LoadingSpinner />

  return (
    <SeasonContext.Provider value={{ currentSeason: season, currentWeek }}>
      {children}
    </SeasonContext.Provider>
  )
}
