import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

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

export default function Schedule() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return <div>Loading NFL schedule...</div>
  }

  if (games.length === 0) {
    return <div>No games found</div>
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>NFL Schedule</h1>
      <p>Total games: {games.length}</p>
      
      {games.map((game) => (
        <div 
          key={game.id} 
          style={{ 
            border: '1px solid #ddd', 
            margin: '10px 0', 
            padding: '15px',
            borderRadius: '5px',
            backgroundColor: '#f9f9f9'
          }}
        >
          <h3>Week {game.week}</h3>
          <p><strong>Game Time:</strong> {new Date(game.game_time).toLocaleString()}</p>
          <p><strong>Status:</strong> {game.status}</p>
          <p><strong>Home Team ID:</strong> {game.home_team_id}</p>
          <p><strong>Away Team ID:</strong> {game.away_team_id}</p>
          <p><strong>API Game ID:</strong> {game.api_game_id}</p>
          {game.winner_id && <p><strong>Winner ID:</strong> {game.winner_id}</p>}
        </div>
      ))}
    </div>
  )
}