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
  locks_at: string
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

async function fetchScheduleData(): Promise<void> {
  const YEAR = 2024;
  const SEASON_TYPE = 2; 
  const BASE_URL = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${YEAR}&seasontype=${SEASON_TYPE}&week=`

  const teamMap = await getTeamMapping()
  const seen = new Set<string>()
  const weeks: Record<number, Game[]> = {}

  for (let i = 1; i <= 18; i++) {
    weeks[i] = []
  }

  for(let week = 1; week <= 19; week++) {
    console.log(`Fetching week ${week}...`)
    
    const response = await fetch(`${BASE_URL}${week}`)
    if(!response.ok) { 
      console.error(`Failed to fetch week ${week}`)
      continue
    }
    
    const data = await response.json() as NFLApiResponse

    if (!data.events) {
      console.log(`No events found for week ${week}`)
      continue
    }

    for(const event of data.events) {
      const gameId = event.id
      const gameWeek = event.week?.number

      if (!gameId || !gameWeek || seen.has(gameId)) continue
      seen.add(gameId)

      const homeTeam = event.competitions[0].competitors[0].team.displayName
      const awayTeam = event.competitions[0].competitors[1].team.displayName

      const homeTeamId = teamMap.get(homeTeam)
      const awayTeamId = teamMap.get(awayTeam)

      if (!homeTeamId || !awayTeamId) {
        console.warn(`Could not find team IDs for: ${awayTeam} at ${homeTeam}`)
        continue
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const winner = event.competitions[0].competitors.find((team: any) => team.winner === true)?.team.displayName || null
      const winnerId = winner ? teamMap.get(winner) || null : null

      const gameObj: Game = {
        api_game_id: gameId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        game_time: event.date || '',
        status: event.status?.type?.description || '',
        week: gameWeek,
        locks_at: new Date(new Date(event.date).getTime() - 30 * 60000).toISOString(),
        winner_id: winnerId
      }

      weeks[gameWeek].push(gameObj)

      console.log(`Game ID: ${gameId}, Week: ${gameWeek}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Winner: ${winner || 'TBD'}`);

      const { error } = await supabase
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