// Scoring cron (deployed as "nfl-scraper"). Scores user picks for finished
// games, splitting points when multiple group members picked the same winner
// (scoringChart is indexed by group size, then by how many members made the
// same pick).
//
// Season rollover: update app_config (key = 'current_season') to the new
// year; games and picks are scored for that season only.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  const scoringChart = [
    [
      10,
      6,
      4,
      null,
      null
    ],
    [
      10,
      7,
      5,
      3,
      2
    ],
    [
      10,
      8,
      6,
      5,
      4
    ],
    [
      10,
      9,
      7,
      6,
      5
    ] // 8-10 players, index 3
  ];
  const groupIndex = {
    1: 0,
    2: 0,
    3: 0,
    4: 1,
    5: 1,
    6: 2,
    7: 2,
    8: 3,
    9: 3,
    10: 3
  };
  const scoreIndex = {
    1: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 4,
    7: 4,
    8: 4,
    9: 4,
    10: 4
  };
  const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  // Detect test mode from query string
  const url = new URL(req.url);
  const testMode = url.searchParams.get("test") === "true";
  console.log(`Running scoring cron — Test Mode: ${testMode}`);
  try {
    // 0. Determine the current season (single source of truth in app_config)
    const { data: seasonConfig, error: seasonError } = await supabaseClient.from("app_config").select("value").eq("key", "current_season").single();
    if (seasonError) {
      console.error("Error fetching current season from app_config:", seasonError);
    }
    const SEASON = parseInt(seasonConfig?.value ?? Deno.env.get("NFL_SEASON") ?? "2025");
    console.log(`Scoring season ${SEASON}`);
    // 1. Fetch finished games (skip winner check in test mode)
    let gamesQuery = supabaseClient.from("nfl_schedule").select("api_game_id, week, winner_id, status").eq("season", SEASON);
    if (!testMode) {
      gamesQuery = gamesQuery.in("status", [
        "Final",
        "in_progress",
        "scheduled"
      ]).not("winner_id", "is", null);
    }
    const { data: finishedGames, error: gamesError } = await gamesQuery;
    if (gamesError) throw gamesError;
    if (!finishedGames.length) {
      return jsonResponse({
        message: "No games found."
      });
    }
    // 2. Get picks for those weeks
    const weeks = [
      ...new Set(finishedGames.map((g)=>g.week))
    ];
    const { data: picks, error: picksError } = await supabaseClient.from("user_picks").select("id, user_id, week, group_id, team_id, game_id, status").eq("season", SEASON).in("week", weeks);
    if (picksError) throw picksError;
    if (!picks.length) {
      return jsonResponse({
        message: "No picks found for those weeks."
      });
    }
    // 3. Get group sizes
    const groupIds = [
      ...new Set(picks.map((p)=>p.group_id))
    ];
    const { data: groupSizes, error: sizeError } = await supabaseClient.from("group_member_counts").select("id, group_size").in("id", groupIds);
    if (sizeError) throw sizeError;
    const groupSizeMap = new Map(groupSizes.map((g)=>[
        g.id,
        g.group_size
      ]));
    // 4. Build combo map
    const comboMap = new Map();
    const pickUpdates = [];
    for (const pick of picks){
      const game = finishedGames.find((g)=>g.api_game_id === pick.game_id);
      if (!game) continue;
      const isCorrect = game.winner_id && pick.team_id === game.winner_id;
      if (!testMode && pick.status !== (isCorrect ? "correct" : "incorrect")) {
        pickUpdates.push({
          id: pick.id,
          group_id: pick.group_id,
          status: isCorrect ? "correct" : "incorrect",
          user_id: pick.user_id
        });
      }
      const key = `${pick.week}-${pick.group_id}`;
      if (!comboMap.has(key)) {
        comboMap.set(key, {
          week: pick.week,
          group_id: pick.group_id,
          groupSize: groupSizeMap.get(pick.group_id) || 0,
          teamCounts: new Map(),
          picks: []
        });
      }
      const combo = comboMap.get(key);
      combo.teamCounts.set(pick.team_id, (combo.teamCounts.get(pick.team_id) || 0) + 1);
      combo.picks.push(pick);
    }
    // 5. Log combos in test mode
    if (testMode) {
      for (const combo of comboMap.values()){
        console.log(`Group ID: ${combo.group_id}, Group Size: ${combo.groupSize}, TeamMap: ${JSON.stringify(Object.fromEntries(combo.teamCounts))}`);
      }
    }
    // 6. Calculate scores
    const scoreUpdates = [];
    for (const combo of comboMap.values()){
      const { groupSize, teamCounts, picks } = combo;
      for (const pick of picks){
        const pickCount = teamCounts.get(pick.team_id) || 0;
        let score = 0;
        const game = finishedGames.find((g)=>g.api_game_id === pick.game_id);
        const isCorrect = game && game.winner_id && pick.team_id === game.winner_id;
        if(isCorrect){
          score = scoringChart[groupIndex[groupSize]][scoreIndex[pickCount]];
        }
        console.log(score);
        if (!testMode) {
          scoreUpdates.push({
            id: pick.id,
            group_id: pick.group_id,
            score,
            user_id: pick.user_id
          });
        }
      }
    }
    // 7. Write updates if not in test mode
    if (!testMode) {
      // Update status for each pick individually
      if (pickUpdates.length) {
        for (const update of pickUpdates){
          const { error: statusError } = await supabaseClient.from("user_picks").update({
            status: update.status
          }).eq("id", update.id);
          if (statusError) throw statusError;
        }
      }
      // Update scores for each pick individually
      if (scoreUpdates.length) {
        for (const update of scoreUpdates){
          const { error: scoreError } = await supabaseClient.from("user_picks").update({
            score: update.score
          }).eq("id", update.id);
          if (scoreError) throw scoreError;
        }
      }
    }
    return jsonResponse({
      message: testMode ? "Test mode complete — see logs for group data" : "Scoring cron completed",
      picksUpdated: pickUpdates.length,
      scoresUpdated: scoreUpdates.length,
      season: SEASON
    });
  } catch (err) {
    console.error(err);
    return jsonResponse({
      error: err.message
    }, 500);
  }
});
// Helper for JSON responses
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}
