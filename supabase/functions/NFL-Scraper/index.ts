import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TeamMap {
  [key: string]: string; 
}

interface GameData {
  api_game_id: string
  week: number
  game_time: string
  status: string
  home_team_id: string
  away_team_id: string
  winner_id: string | null
  wave: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // First, get all teams to create a mapping
    const { data: teams, error: teamsError } = await supabaseClient
      .from('nfl_teams')
      .select('id, name')

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch teams' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create team name mapping (ESPN name -> UUID)
    const teamMap: TeamMap = {}
    teams?.forEach(team => {
      teamMap[team.name] = team.id
    })

    const YEAR = 2025
    const URL = `https://cdn.espn.com/core/nfl/schedule?xhr=1&year=${YEAR}&week=`
    
    const allGames: GameData[] = []
    let processedCount = 0

    // Scrape all weeks
    for (let week = 1; week <= 18; week++) {
      try {
        const response = await fetch(`${URL}${week}`)
        
        if (!response.ok) {
          console.error(`Failed to fetch week ${week}: ${response.status}`)
          continue
        }

        const data = await response.json()
        
        // Process games for this week
        for (const [dateStr, dateData] of Object.entries(data.content.schedule)) {
          for (const games of (dateData as any).games) {
            for (const game of games.competitions) {
              
              // Extract team names and find their UUIDs
              const homeTeamName = game.competitors[0].team.name
              const awayTeamName = game.competitors[1].team.name
              
              const homeTeamId = teamMap[homeTeamName]
              const awayTeamId = teamMap[awayTeamName]
              
              if (!homeTeamId || !awayTeamId) {
                console.warn(`Missing team mapping for: ${homeTeamName} vs ${awayTeamName}`)
                continue
              }

              // Determine winner
              let winnerId = null
              if (game.competitors[0].winner) {
                winnerId = homeTeamId
              } else if (game.competitors[1].winner) {
                winnerId = awayTeamId
              }

              // Parse game time
              const gameTime = game.date ? new Date(game.date).toISOString() : null
              
              // Map ESPN status to your status values
              let status = 'scheduled'
              if (game.status.type.completed) {
                status = 'final'
              } else if (game.status.type.state === 'in') {
                status = 'in_progress'
              }

              const gameData: GameData = {
                api_game_id: game.id,
                week: week,
                game_time: gameTime || new Date().toISOString(),
                status: status,
                home_team_id: homeTeamId,
                away_team_id: awayTeamId,
                winner_id: winnerId,
                wave: 0 // Default wave value
              }
              
              allGames.push(gameData)
              processedCount++
            }
          }
        }
      } catch (error) {
        console.error(`Error processing week ${week}:`, error)
      }
    }

    if (allGames.length > 0) {
      const { data, error } = await supabaseClient
        .from('nfl_schedule')
        .upsert(allGames, { 
          onConflict: 'api_game_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: 'Database insertion failed', details: error.message }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log(`Successfully processed ${processedCount} games`)
      

      await updateUserPicksStatus(supabaseClient)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        gamesProcessed: processedCount,
        message: 'NFL data updated successfully'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to update user picks status when games finish
async function updateUserPicksStatus(supabaseClient: any) {
  try {
    // Get all finished games that have winners
    const { data: finishedGames, error: gamesError } = await supabaseClient
      .from('nfl_schedule')
      .select('api_game_id, winner_id')
      .eq('status', 'final')
      .not('winner_id', 'is', null)

    if (gamesError || !finishedGames) {
      console.error('Error fetching finished games:', gamesError)
      return
    }

    // Update user picks for finished games
    for (const game of finishedGames) {
      // Update correct picks
      await supabaseClient
        .from('user_picks')
        .update({ 
          status: 'correct',
          score: 1,
          updated_at: new Date().toISOString()
        })
        .eq('game_id', game.api_game_id)
        .eq('team_id', game.winner_id)
        .eq('status', 'pending')

      // Update incorrect picks
      await supabaseClient
        .from('user_picks')
        .update({ 
          status: 'incorrect',
          score: 0,
          updated_at: new Date().toISOString()
        })
        .eq('game_id', game.api_game_id)
        .neq('team_id', game.winner_id)
        .eq('status', 'pending')
    }

    console.log(`Updated picks for ${finishedGames.length} finished games`)
  } catch (error) {
    console.error('Error updating user picks:', error)
  }
}