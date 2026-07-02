// Schedule fetcher (deployed as "test-fetch", called hourly by the
// nfl-data-fetch GitHub Action). Pulls the ESPN scoreboard for the current
// season and upserts games into nfl_schedule.
//
// Season rollover: update app_config (key = 'current_season') to the new
// year; this function picks it up automatically. A ?year= query param
// overrides it for backfills.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

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
  season: number
  week: number
  locks_at: string
  winner_id?: string | null
}

interface NFLApiResponse {
  events: any[]
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const url = new URL(req.url);
  const testMode = url.searchParams.get("test") === "true";
  const specificWeek = url.searchParams.get("week");
  let year = url.searchParams.get("year");

  if (!year) {
    const { data: config, error: configError } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "current_season")
      .single();
    if (configError) {
      console.error("Error fetching current season from app_config:", configError);
    }
    year = config?.value ?? "2025";
  }

  console.log(`Fetching ESPN schedule data - Year: ${year}, Week: ${specificWeek || "all"}, Test Mode: ${testMode}`);

  try {
    // Get team mapping from database
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

    const YEAR = parseInt(year);
    const SEASON_TYPE = 2;
    const BASE_URL = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${YEAR}&seasontype=${SEASON_TYPE}&week=`

    const teamMap = await getTeamMapping()
    const seen = new Set<string>()
    const weeks: Record<number, Game[]> = {}
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    // Initialize weeks structure
    for (let i = 1; i <= 18; i++) {
      weeks[i] = []
    }

    // Determine which weeks to fetch
    const weeksToFetch = specificWeek ? [parseInt(specificWeek)] : Array.from({length: 19}, (_, i) => i + 1);

    for(const week of weeksToFetch) {
      console.log(`Fetching week ${week}...`)

      try {
        const response = await fetch(`${BASE_URL}${week}`)
        if(!response.ok) {
          console.error(`Failed to fetch week ${week}: ${response.status} ${response.statusText}`)
          totalErrors++;
          continue
        }

        const data = await response.json() as NFLApiResponse

        if (!data.events) {
          console.log(`No events found for week ${week}`)
          continue
        }

        console.log(`Found ${data.events.length} events for week ${week}`)

        for(const event of data.events) {
          try {
            totalProcessed++;
            const gameId = event.id
            const gameWeek = event.week?.number

            if (!gameId || !gameWeek || seen.has(gameId)) {
              console.log(`Skipping duplicate or invalid game: ${gameId}`)
              continue;
            }
            seen.add(gameId)

            // Get team names - ESPN structure can vary
            const competition = event.competitions?.[0];
            if (!competition?.competitors?.length) {
              console.warn(`No competitors found for game ${gameId}`)
              continue;
            }

            // Find home and away teams
            const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === "home");
            const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === "away");

            if (!homeCompetitor || !awayCompetitor) {
              console.warn(`Could not determine home/away teams for game ${gameId}`)
              continue;
            }

            const homeTeam = homeCompetitor.team.displayName
            const awayTeam = awayCompetitor.team.displayName

            const homeTeamId = teamMap.get(homeTeam)
            const awayTeamId = teamMap.get(awayTeam)

            if (!homeTeamId || !awayTeamId) {
              console.warn(`Could not find team IDs for: ${awayTeam} at ${homeTeam}`)
              console.warn(`Available teams: ${Array.from(teamMap.keys()).join(', ')}`)
              continue
            }

            // Determine winner
            const winner = competition.competitors.find((team: any) => team.winner === true)?.team.displayName || null
            const winnerId = winner ? teamMap.get(winner) || null : null

            const gameTime = event.date || '';
            const locksAt = gameTime ? new Date(new Date(gameTime).getTime() - 30 * 60000).toISOString() : '';

            const gameObj: Game = {
              api_game_id: gameId,
              home_team_id: homeTeamId,
              away_team_id: awayTeamId,
              game_time: gameTime,
              status: event.status?.type?.description || '',
              season: YEAR,
              week: gameWeek,
              locks_at: locksAt,
              winner_id: winnerId
            }

            if (gameWeek >= 1 && gameWeek <= 18) {
              weeks[gameWeek].push(gameObj)
            }

            console.log(`Game ID: ${gameId}, Week: ${gameWeek}, Home: ${homeTeam}, Away: ${awayTeam}, Winner: ${winner || 'TBD'}`);

            if (!testMode) {
              const { error } = await supabase
                .from('nfl_schedule')
                .upsert(gameObj, {
                  onConflict: 'api_game_id'
                })

              if (error) {
                console.error(`Error inserting game ${gameId}:`, error)
                totalErrors++;
              } else {
                totalUpdated++;
              }
            }

          } catch (gameError) {
            console.error(`Error processing game ${event.id}:`, gameError);
            totalErrors++;
          }
        }

      } catch (weekError) {
        console.error(`Error fetching week ${week}:`, weekError);
        totalErrors++;
      }
    }

    const summary = {
      message: testMode ? "Test mode - no database changes made" : "ESPN schedule fetch completed",
      year: YEAR,
      weeksRequested: weeksToFetch,
      stats: {
        gamesProcessed: totalProcessed,
        gamesUpdated: totalUpdated,
        errors: totalErrors,
        teamMappingsLoaded: teamMap.size
      },
      weeksSummary: Object.entries(weeks)
        .filter(([_, games]) => games.length > 0)
        .reduce((acc, [week, games]) => {
          acc[week] = games.length;
          return acc;
        }, {} as Record<string, number>),
      testMode
    };

    if (testMode) {
      // In test mode, show sample games
      const sampleGames = Object.values(weeks).flat().slice(0, 5);
      summary.sampleGames = sampleGames;
    }

    console.log('Final summary:', summary);
    return jsonResponse(summary);

  } catch (error) {
    console.error('Fatal error:', error);
    return jsonResponse({
      error: error.message,
      stack: error.stack
    }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}
