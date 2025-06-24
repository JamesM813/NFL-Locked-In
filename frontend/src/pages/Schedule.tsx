import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Game = {
  id: string
  created_at: string
  api_game_id: string
  week: number
  game_time: string
  status: string
  home_team_id: string
  away_team_id: string
  winner_id: string | null
}

type DateRange = {
  start: Date
  end: Date
}

export default function Schedule() {
  const [teamNameMap, setTeamNameMap] = useState<Map<string, string>>(new Map())
  const [teamLogoMap, setTeamLogoMap] = useState<Map<string, string>>(new Map())
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState<number>(1)


  useEffect(() => {
    async function fetchGames() {
      try {
        const { data, error } = await supabase
          .from('nfl_schedule')
          .select('*')
          .order('week', { ascending: true })
          .order('game_time', { ascending: true })

        if (error) {
          console.error('Error fetching games:', error)
        } else {
          setGames(data || [])
        }
      } catch (err) {
        console.error('Fetch error:', err)
      }
      setLoading(false)
    }
    
    fetchGames()
  }, [])

  function createWeekMap(): Map<DateRange, number> {
    const weekMap = new Map<DateRange, number>()
    

    const gamesByWeek = games.reduce((acc, game) => {
      if (!acc[game.week]) {
        acc[game.week] = []
      }
      acc[game.week].push(game)
      return acc
    }, {} as Record<number, Game[]>)


    const sortedWeeks = Object.keys(gamesByWeek)
      .map(Number)
      .sort((a, b) => a - b)

    let previousWeekEnd: Date | null = null

    for (const weekNumber of sortedWeeks) {
      const weekGames = gamesByWeek[weekNumber]
      

      const gameTimes = weekGames.map(game => new Date(game.game_time))
      const earliestGame = new Date(Math.min(...gameTimes.map(d => d.getTime())))
      const latestGame = new Date(Math.max(...gameTimes.map(d => d.getTime())))

      let weekStart: Date
      
      if (previousWeekEnd) {

        weekStart = new Date(previousWeekEnd)
        weekStart.setDate(weekStart.getDate() + 1)
        weekStart.setHours(0, 0, 0, 0) 
      } else {
       
        weekStart = new Date(earliestGame)
        weekStart.setDate(weekStart.getDate() - 3)
        weekStart.setHours(0, 0, 0, 0)
      }


      const weekEnd = new Date(latestGame)
      weekEnd.setHours(23, 59, 59, 999) 

      const dateRange: DateRange = { start: weekStart, end: weekEnd }
      weekMap.set(dateRange, weekNumber)
      

      previousWeekEnd = new Date(weekEnd)
    }

    return weekMap
  }

  function getCurrentWeek(): number {
    const now = new Date()
  
    const map = createWeekMap()
    for (const [dateRange, week] of map.entries()) {
      if (now >= dateRange.start && now <= dateRange.end) {
        return week;
      }
    }
    return 1; 
  }

  useEffect(() => {
    if (games.length > 0) {
      const currentWeek = getCurrentWeek();
      setSelectedWeek(currentWeek);
    }
  }, [games])


  const availableWeeks = [...new Set(games.map(game => game.week))].sort((a, b) => a - b)
  
  const filteredGames = games.filter(game => game.week === selectedWeek)

  useEffect(() => {
    async function fetchTeamNameMap(){
      try {
        const { data, error } = await supabase
        .from('nfl_teams')
        .select('id,name,logo_url')

        if (error) {
          console.error('Error fetching team map:', error)
        } else {
          const tempNameMap = new Map(data?.map((team: { id: string, name: string }) => [team.id, team.name]))
          const tempLogoMap = new Map(data?.map((team: { id: string, logo_url: string }) => [team.id, team.logo_url]))
          setTeamNameMap(tempNameMap)
          setTeamLogoMap(tempLogoMap)
        }
      } catch (err){
        console.error('Error fetching team map:', err)
      }
    }
    fetchTeamNameMap()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <p className="text-white">Loading NFL schedule...</p>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <p className="text-white">No games found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">NFL Schedule</h1>
        </header>

        {/* Week Selector */}
        <div className="mb-8">
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-3 min-w-max">
              {availableWeeks.map((week) => (
                <button
                  key={week}
                  onClick={() => setSelectedWeek(week)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${
                    selectedWeek === week
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  Week {week}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div className="space-y-6">
          {filteredGames.map((game) => (
            <Card key={game.id} className="backdrop-blur-sm bg-white/10 shadow-2xl border-0 text-white">
              <CardHeader>
                <CardTitle className="text-xl">Week {game.week}</CardTitle>
                <CardDescription className="text-gray-300">
                  {new Date(game.game_time).toLocaleString('en-US', {
                          weekday: 'long',     
                          month: 'short',       
                          day: 'numeric',      
                          hour: 'numeric',      
                          minute: '2-digit',    
                          hour12: true          
                        })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={teamLogoMap.get(game.away_team_id)} 
                        alt={teamNameMap.get(game.away_team_id)}
                        className="w-12 h-12 object-contain"
                      />
                      <span className="text-gray-400">@</span>
                      <img 
                        src={teamLogoMap.get(game.home_team_id)} 
                        alt={teamNameMap.get(game.home_team_id)}
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Status: {game.status}</p>
                      {game.winner_id && (
                        <p className="text-sm text-green-400">Winner ID: {game.winner_id}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    API Game ID: {game.api_game_id}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}