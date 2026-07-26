import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { GroupMember } from '@/utils/types';

export function useGroupMembers(groupId: number) {
  const [loading, setLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

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

  useEffect(() => {
    fetchGroupMembers();
  }, [fetchGroupMembers]);

  return { loading, groupMembers, fetchGroupMembers };
}
