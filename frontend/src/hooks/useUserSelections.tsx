/*eslint-disable*/
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { GroupMember, Selection } from '@/utils/types';

const TOTAL_WEEKS = 18;

function emptySelections(): Selection[] {
  return Array.from({ length: TOTAL_WEEKS }, (_, index) => ({
    week: index + 1,
    teamId: null,
    status: 'pending' as const,
    score: '-',
    locks_at: null
  }));
}

export function useUserSelections(
  groupId: string,
  season: number,
  userId: string | undefined,
  groupMembers: GroupMember[]
) {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [groupSelections, setGroupSelections] = useState<{[userId: string]: Selection[]}>({});

  const fetchUserSelections = useCallback(async () => {
    if (!userId) return;

    try {
      setSelections(emptySelections());

      const { data, error } = await supabase
        .from("user_picks")
        .select("week, team_id, status, score, locks_at")
        .eq("user_id", userId)
        .eq("group_id", groupId)
        .eq("season", season);

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
      console.error("Error in fetchUserSelections:", err);
    }
  }, [userId, groupId, season]);

  const fetchGroupSelections = useCallback(async () => {
    if (groupMembers.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("user_picks")
        .select("user_id, week, team_id, status, score, locks_at")
        .eq("group_id", groupId)
        .eq("season", season);

      if (error) {
        console.error("Error fetching group selections:", error);
        return;
      }

      if (data && data.length > 0) {
        const selectionsByUser: {[userId: string]: Selection[]} = {};
        groupMembers.forEach(member => {
          selectionsByUser[member.user_id] = emptySelections();
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
  }, [groupId, groupMembers, season]);

  useEffect(() => {
    fetchUserSelections();
  }, [fetchUserSelections]);

  useEffect(() => {
    fetchGroupSelections();
  }, [fetchGroupSelections]);

  return { selections, setSelections, groupSelections, fetchUserSelections, fetchGroupSelections };
}
