import {supabase} from './supabase-node'

interface Team {
  id: string
  name: string
}

interface Game {
  api_game_id: string
  home_team_id: string
  away_team_id: string
  game_time: string
  status: string
  week: number
  wave: number
  winner_id?: string | null
}

interface NFLApiResponse {
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
    events: any[]
}

async function getTeamMapping(): Promise<Map<string, string>> {
  const { data: teams, error } = await supabase
    .from('nfl_teams')
    .select('id, name')

  if (error) {
    console.error('Error fetching teams:', error)
    throw error
  }

  const teamMap = new Map<string, string>()
  
  teams?.forEach((team: Team) => {
    teamMap.set(team.name, team.id)
  })

  console.log(`Loaded ${teamMap.size} teams`)
  return teamMap
}

function parseGameName(gameName: string): { away: string, home: string } {
  const parts = gameName.split(' at ')
  if (parts.length === 2) {
    return {
      away: parts[0].trim(),
      home: parts[1].trim()
    }
  }
  
  const vsMatch = gameName.match(/(.+) vs (.+)/)
  if (vsMatch) {
    return {
      away: vsMatch[1].trim(),
      home: vsMatch[2].trim()
    }
  }
  
  console.warn(`Could not parse game name: ${gameName}`)
  return { away: '', home: '' }
}

async function fetchScheduleData(): Promise<void> {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?limit=1000&dates=20250101-20251231&seasontype=2'

  const teamMap = await getTeamMapping()
  //const YEAR = new Date().getFullYear()
  const res = await fetch(url)
  const data = await res.json() as NFLApiResponse

  if (!data.events) {
    console.error('No events found')
    return
  }

  const seen = new Set<string>()
  const weeks: Record<number, Game[]> = {}

  for (let i = 1; i <= 18; i++) {
    weeks[i] = []
  }

  for (const game of data.events) {
    const season = game.season || {}
    const weekInfo = game.week || {}

    if (season.year === 2025 && season.slug === 'regular-season') {
      const gameId = game.id
      const gameWeek = weekInfo.number

      if (!gameId || !gameWeek || seen.has(gameId)) continue
      seen.add(gameId)

      const { away, home } = parseGameName(game.name || '')
      
      const homeTeamId = teamMap.get(home)
      const awayTeamId = teamMap.get(away)

      if (!homeTeamId || !awayTeamId) {
        console.warn(`Could not find team IDs for: ${away} at ${home}`)
        continue
      }

      let wave: number = 0

      if( 4 <= new Date(game.date).getDay() && new Date(game.date).getDay()  <= 6 ){
        wave = 1
      } else {
        wave = 2
      }

      if(wave === 0) throw new Error(`Invalid wave for game ${gameId} on ${game.date}`)

      const gameObj: Game = {
        api_game_id: gameId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        game_time: game.date || '',
        status: game.status?.type?.description || '',
        week: gameWeek,
        wave: wave,
        winner_id: null 
      }

      weeks[gameWeek].push(gameObj)

      const {  error } = await supabase
        .from('nfl_schedule')
        .upsert(gameObj, { 
          onConflict: 'api_game_id' 
        })
      
      if (error) {
        console.error(`Error inserting game ${gameId}:`, error)
      }
    }
  }

  console.log('Schedule loaded:', Object.keys(weeks).length, 'weeks')
  
  for (const [week, games] of Object.entries(weeks)) {
    if (games.length > 0) {
      console.log(`Week ${week}: ${games.length} games`)
    }
  }
}

fetchScheduleData()
  .catch(console.error)