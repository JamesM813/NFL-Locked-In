import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

const CONFIG_READ_ATTEMPTS = 3

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [season, setSeason] = useState<number | null>(null)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [configFailed, setConfigFailed] = useState(false)

  const fetchSeasonAndWeek = useCallback(async () => {
    setConfigFailed(false)

    // The app_config read fails intermittently with a Gateway Timeout. This
    // used to fall back to a hard-coded 2025, which silently served everyone
    // the previous season with no season selector — indistinguishable from a
    // real rollover failure. Retry, then surface the error instead.
    let configValue: string | null = null

    for (let attempt = 1; attempt <= CONFIG_READ_ATTEMPTS; attempt++) {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'current_season')
        .single()

      if (!error && data?.value) {
        configValue = data.value
        break
      }

      console.warn(
        `current_season read attempt ${attempt}/${CONFIG_READ_ATTEMPTS} failed:`,
        error?.message ?? 'no value returned'
      )

      if (attempt < CONFIG_READ_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500))
      }
    }

    const parsedSeason = configValue === null ? NaN : parseInt(configValue)

    if (!Number.isInteger(parsedSeason)) {
      console.error('Could not determine the current season; refusing to guess.')
      setConfigFailed(true)
      return
    }

    // Current week = the first week that still has an unlocked game;
    // once every game of the season is locked, stay on week 18.
    const { data: games, error: gamesError } = await supabase
      .from('nfl_schedule')
      .select('week, locks_at')
      .eq('season', parsedSeason)

    if (gamesError) {
      console.error('Error fetching schedule for current week:', gamesError)
    } else if (games && games.length > 0) {
      const now = new Date()
      const openWeeks = games
        .filter((game) => game.locks_at && new Date(game.locks_at) > now)
        .map((game) => game.week)
      setCurrentWeek(openWeeks.length > 0 ? Math.min(...openWeeks) : 18)
    }

    setSeason(parsedSeason)
  }, [])

  useEffect(() => {
    fetchSeasonAndWeek()
  }, [fetchSeasonAndWeek])

  if (configFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl">
          <h2 className="mb-2 text-lg font-semibold text-white">
            Couldn&apos;t load the current season
          </h2>
          <p className="mb-5 text-sm text-white/70">
            We couldn&apos;t reach the server to find out which NFL season is
            active. Your picks are safe — this is a connection problem, not a
            data problem.
          </p>
          <button
            onClick={fetchSeasonAndWeek}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (season === null) return <LoadingSpinner />

  return (
    <SeasonContext.Provider value={{ currentSeason: season, currentWeek }}>
      {children}
    </SeasonContext.Provider>
  )
}
