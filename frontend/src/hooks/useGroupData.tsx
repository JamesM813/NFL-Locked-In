/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { GroupMember, NFLTeam, Selection } from "../utils/types";

export function useGroupData(groupId: string, userInGroupData: any) {
  const [loading, setLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [nflTeams, setNFLTeams] = useState<NFLTeam[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [groupSelections, setGroupSelections] = useState<{[userId: string]: Selection[]}>({});
  const [leaveGroupMessage, setLeaveGroupMessage] = useState("");

  const fetchInitialData = async () => {
    const totalWeeks = 18;
    const initialSelections: Selection[] = Array.from({ length: totalWeeks }, (_, index) => ({
      week: index + 1,
      teamId: null,
      status: 'pending' as const,
      score: '-'
    }));

    try {
      setSelections(initialSelections);
      
      const { data, error } = await supabase
        .from("user_picks")
        .select("week, team_id, status, score")
        .eq("user_id", userInGroupData?.user_id)
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
          score: item.score || '-'
        }));
        
        setSelections(prev => prev.map(selection => {
          const existing = existingSelections.find(s => s.week === selection.week);
          return existing ? { ...selection, ...existing } : selection;
        }));
      }
    } catch (err) {
      console.error("Error in fetchInitialData:", err);
    }
  };

  const fetchGroupSelections = async () => {
    try {
      const { data, error } = await supabase
        .from("user_picks")
        .select("user_id, week, team_id, status, score")
        .eq("group_id", groupId);

      if (error) {
        console.error("Error fetching group selections:", error);
        return;
      }

      if (data && data.length > 0) {
        const selectionsByUser: {[userId: string]: Selection[]} = {};
        const currentMembers = groupMembers;   
        currentMembers.forEach(member => {
          selectionsByUser[member.user_id] = Array.from({ length: 18 }, (_, index) => ({
            week: index + 1,
            teamId: null,
            status: 'pending' as const,
            score: '-'
          }));
        });

        data.forEach((item: any) => {
          if (selectionsByUser[item.user_id]) {
            const weekIndex = item.week - 1;
            selectionsByUser[item.user_id][weekIndex] = {
              week: item.week,
              teamId: item.team_id,
              status: item.status || 'pending',
              score: item.score || '-'
            };
          }
        });

        setGroupSelections(selectionsByUser);
      }
    } catch (err) {
      console.error("Error in fetchGroupSelections:", err);
    }
  };

  const fetchNFLTeams = async () => {
    const {data, error} = await supabase
      .from("nfl_teams")
      .select("*");

    if(error) throw new Error(`Error fetching NFL teams: ${error.message}`);
    if(data) {
      const teams = data.map((team: any) => ({
        id: team.id,
        logo_url: team.logo_url,
        name: team.name
      }));
      setNFLTeams(teams);
    }
  };

  const fetchGroupMembers = async () => {
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
  };

  const refreshData = async () => {
    await Promise.all([
      fetchInitialData(),
      fetchGroupSelections()
    ]);
  };

  // Effects
  useEffect(() => {
    fetchNFLTeams();
  }, []);

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId]);

  useEffect(() => {
    if (userInGroupData?.user_id) {
      fetchInitialData();
    }
  }, [groupId, userInGroupData?.user_id]);

  useEffect(() => {
    if (groupMembers.length > 0) {
      fetchGroupSelections();
    }
  }, [groupMembers]);

  return {
    loading,
    groupMembers,
    nflTeams,
    selections,
    setSelections,
    groupSelections,
    leaveGroupMessage,
    setLeaveGroupMessage,
    refreshData
  };
}