/*eslint-disable*/
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [groupPicks, setGroupPicks] = useState<any[]>([]);

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

      setGroupPicks(data ?? []);
    } catch (err) {
      console.error("Error in fetchGroupSelections:", err);
    }
  }, [groupId, season]);

  const groupSelections = useMemo(() => {
    const selectionsByUser: {[userId: string]: Selection[]} = {};
    groupMembers.forEach(member => {
      selectionsByUser[member.user_id] = emptySelections();
    });

    groupPicks.forEach((item: any) => {
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

    return selectionsByUser;
  }, [groupMembers, groupPicks]);

  useEffect(() => {
    fetchUserSelections();
  }, [fetchUserSelections]);

  useEffect(() => {
    fetchGroupSelections();
  }, [fetchGroupSelections]);

  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`user-picks-group-${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_picks', filter: `group_id=eq.${groupId}` },
        () => {
          // The scoring cron updates many picks at once; debounce so a burst
          // of events triggers a single refetch.
          if (refetchTimer.current) clearTimeout(refetchTimer.current);
          refetchTimer.current = setTimeout(() => {
            fetchUserSelections();
            fetchGroupSelections();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [groupId, fetchUserSelections, fetchGroupSelections]);

  return { selections, setSelections, groupSelections, fetchUserSelections, fetchGroupSelections };
}
