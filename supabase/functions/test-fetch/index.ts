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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret"
};

// ESPN rejects Deno's default agent (and browser-impersonating ones) with 403,
// so identify the caller honestly. Verified from Supabase egress: the default
// Deno/x.y.z agent and a Chrome string both 403, this one returns 200.
const ESPN_HEADERS = { "User-Agent": "NFL-Locked-In/1.0" };

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

  // Invocation guard: the anon key alone is public (it ships in the frontend
  // bundle), so when a CRON_SECRET is configured for this function, require
  // callers to also send it in the x-cron-secret header. Fails open when the
  // secret is not configured so a fresh deploy doesn't break the cron.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!cronSecret) {
    console.warn("CRON_SECRET is not set — anyone with the public anon key can invoke this function.");
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
    // Retry rather than fall back: this read fails intermittently with a
    // Gateway Timeout, and a silent 2025 default would refetch last season
    // over the current one.
    let config = null;
    let configError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "current_season")
        .single();
      config = result.data;
      configError = result.error;
      if (!configError && config?.value) break;
      console.warn(`app_config read attempt ${attempt}/3 failed:`, configError?.message ?? "no value returned");
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 500));
    }

    if (configError || !config?.value) {
      console.error("Could not read current_season after 3 attempts; aborting.", configError);
      return jsonResponse({
        error: "Could not determine current season",
        detail: configError?.message ?? "app_config returned no value"
      }, 503);
    }
    year = config.value;
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
        const response = await fetch(`${BASE_URL}${week}`, { headers: ESPN_HEADERS })
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

    // Every requested week failed: report it as an error status. Returning 200
    // here made a total outage look like a successful run to the GitHub
    // workflow, which only inspects the status code.
    const totalFailure = totalProcessed === 0 && totalErrors >= weeksToFetch.length;
    if (totalFailure) {
      return jsonResponse({
        ...summary,
        message: `All ${weeksToFetch.length} requested weeks failed to fetch`
      }, 502);
    }

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
