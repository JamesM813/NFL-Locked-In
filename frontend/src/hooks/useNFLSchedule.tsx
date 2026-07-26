import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getAvailableTeamsForWeek } from '@/utils/availableTeams';
import type { NFLTeam, ScheduleGame, Selection } from '@/utils/types';

export function useNFLSchedule(season: number) {
  const [nflTeams, setNFLTeams] = useState<NFLTeam[]>([]);
  const [nflSchedule, setNFLSchedule] = useState<ScheduleGame[]>([]);

  const fetchNFLData = useCallback(async () => {
    try {
      const [teamsResult, scheduleResult] = await Promise.all([
        supabase.from("nfl_teams").select("*"),
        supabase.from("nfl_schedule").select("week, home_team_id, away_team_id, locks_at").eq("season", season)
      ]);

      if (teamsResult.error) throw new Error(`Error fetching NFL teams: ${teamsResult.error.message}`);
      if (scheduleResult.error) throw new Error(`Error fetching NFL schedule: ${scheduleResult.error.message}`);

      if (teamsResult.data) {
        const teams = teamsResult.data.map((team: NFLTeam) => ({
          id: team.id,
          logo_url: team.logo_url,
          name: team.name
        }));
        setNFLTeams(teams);
      }

      if (scheduleResult.data) {
        setNFLSchedule(scheduleResult.data);
      }
    } catch (error) {
      console.error("Error fetching NFL data:", error);
    }
  }, [season]);

  useEffect(() => {
    fetchNFLData();
  }, [fetchNFLData]);

  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`nfl-schedule-${season}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'nfl_schedule', filter: `season=eq.${season}` },
        () => {
          // The scraper upserts a whole week of games at once; debounce so a
          // burst of events triggers a single refetch.
          if (refetchTimer.current) clearTimeout(refetchTimer.current);
          refetchTimer.current = setTimeout(() => fetchNFLData(), 1000);
        }
      )
      .subscribe();

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [season, fetchNFLData]);

  const getAvailableTeamsForUserWeek = useCallback(
    (week: number, userSelections: Selection[]) =>
      getAvailableTeamsForWeek(nflTeams, nflSchedule, week, userSelections),
    [nflTeams, nflSchedule]
  );

  return { nflTeams, nflSchedule, fetchNFLData, getAvailableTeamsForUserWeek };
}
