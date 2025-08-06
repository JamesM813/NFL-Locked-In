/*eslint-disable*/
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { GroupMember, NFLTeam, Selection } from '@/utils/types';

export function useGroupData(groupId: string, userId?: string) {
  const [loading, setLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [nflTeams, setNFLTeams] = useState<NFLTeam[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [groupSelections, setGroupSelections] = useState<{[userId: string]: Selection[]}>({});

  const [nflSchedule, setNFLSchedule] = useState<any[]>([]);

  const fetchNFLTeams = useCallback(async () => {
    try {

      const [teamsResult, scheduleResult] = await Promise.all([
        supabase.from("nfl_teams").select("*"),
        supabase.from("nfl_schedule").select("week, home_team_id, away_team_id, locks_at")
      ]);

      if (teamsResult.error) throw new Error(`Error fetching NFL teams: ${teamsResult.error.message}`);
      if (scheduleResult.error) throw new Error(`Error fetching NFL schedule: ${scheduleResult.error.message}`);
      
      if (teamsResult.data) {
        const teams = teamsResult.data.map((team: any) => ({
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
  }, []);

  const getAvailableTeamsForWeek = useCallback((week: number) => {
    const currentTime = new Date();
    const weekGames = nflSchedule.filter(game => game.week === week);
    
    return nflTeams.filter(team => {
      const teamGame = weekGames.find(game => 
        game.home_team_id === team.id || game.away_team_id === team.id
      );
      
      if (!teamGame) return false; 
      return new Date(teamGame.locks_at) > currentTime; 
    });
  }, [nflTeams, nflSchedule]);

  const fetchGroupMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profile_groups")
      .select(`
        user_id,
        is_admin,
        profiles:user_id (
          id,
          username,
          profile_picture_url
        )
      `)
      .eq("group_id", groupId);

    if (error) {
      console.error("Error fetching group members:", error);
    } else {
      const members = data?.map(member => ({
        user_id: member.user_id,
        is_admin: member.is_admin,
        profiles: Array.isArray(member.profiles) ? member.profiles[0] : member.profiles
      })).filter(member => member.profiles) || [];
      setGroupMembers(members);
    }
    setLoading(false);
  }, [groupId]);

  const fetchInitialData = useCallback(async () => {
    if (!userId) return;
    
    const totalWeeks = 18;
    const initialSelections: Selection[] = Array.from({ length: totalWeeks }, (_, index) => ({
      week: index + 1,
      teamId: null,
      status: 'pending' as const,
      score: '-',
      locks_at: null
    }));

    try {
      setSelections(initialSelections);
      
      const { data, error } = await supabase
        .from("user_picks")
        .select("week, team_id, status, score, locks_at")
        .eq("user_id", userId)
        .eq("group_id", groupId);

      if (error) {
        console.error("Error fetching user selections:", error);
        return;
      }

      if (data && data.length > 0) {
        const existingSelections: Selection[] = data.map((item: any) => ({
          week: item.week,
          teamId: item.team_id,
          status: item.status || 'pending',
          score: item.score || '-',
          locks_at: item.locks_at
        }));
        
        setSelections(prev => prev.map(selection => {
          const existing = existingSelections.find(s => s.week === selection.week);
          return existing ? { ...selection, ...existing } : selection;
        }));
      }
    } catch (err) {
      console.error("Error in fetchInitialData:", err);
    }
  }, [userId, groupId]);

  const fetchGroupSelections = useCallback(async () => {
    if (groupMembers.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from("user_picks")
        .select("user_id, week, team_id, status, score, locks_at")
        .eq("group_id", groupId);

      if (error) {
        console.error("Error fetching group selections:", error);
        return;
      }

      if (data && data.length > 0) {
        const selectionsByUser: {[userId: string]: Selection[]} = {};
        groupMembers.forEach(member => {
          selectionsByUser[member.user_id] = Array.from({ length: 18 }, (_, index) => ({
            week: index + 1,
            teamId: null,
            status: 'pending' as const,
            score: '-',
            locks_at: null
          }));
        });

        data.forEach((item: any) => {
          if (selectionsByUser[item.user_id]) {
            const weekIndex = item.week - 1;
            selectionsByUser[item.user_id][weekIndex] = {
              week: item.week,
              teamId: item.team_id,
              status: item.status || 'pending',
              score: item.score || '-',
              locks_at: item.locks_at
            };
          }
        });

        setGroupSelections(selectionsByUser);
      }
    } catch (err) {
      console.error("Error in fetchGroupSelections:", err);
    }
  }, [groupId, groupMembers]);

  return {
    loading,
    groupMembers,
    nflTeams,
    selections,
    groupSelections,
    setSelections,
    fetchNFLTeams,
    fetchGroupMembers,
    fetchInitialData,
    fetchGroupSelections,
    getAvailableTeamsForWeek
  };
}