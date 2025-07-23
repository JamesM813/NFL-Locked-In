/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export function useGroupActions(groupId: string, userInGroupData: any, refreshData: () => Promise<void>) {
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    groupName: '',
    groupDescription: '',
    isPrivate: false,
    allowLatePickChanges: true,
    weeklyDeadline: 'thursday-8pm'
  });

  const handleInviteMembers = async () => {
    if (!userInGroupData?.is_admin) {
      toast.error("You do not have permission to invite members!");
      return;
    }
  
    const groupSize = userInGroupData.groups.group_size;
    if (groupSize >= 10) {
      toast.error("Group is full! You cannot invite more members.");
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("group_join_codes")
        .delete()
        .eq("group_id", groupId);
  
      if (deleteError) throw deleteError;
  
      const { data, error } = await supabase
        .from("group_join_codes")
        .insert([{ group_id: groupId }]) 
        .select();
  
      if (error || !data) throw error;
  
      const inviteCode = data[0].join_code;
      toast.success(`Invite code created: ${inviteCode}`, { duration: 6000 });
      await navigator.clipboard.writeText(inviteCode);
      toast.success("Invite code copied to clipboard!");
    } catch (err) {
      console.error("Invite error:", err);
      toast.error("Failed to create invite code. Please try again.");
    }
  };

  const handleLeaveGroup = () => {
    if (userInGroupData?.is_admin) {
      toast.error("You need to transfer admin rights before leaving the group.");
    } else {
      return true; // Signal to show modal
    }
  };

  const handleTeamSelection = async (week: number, teamId: string | null, setSelections: any) => {
    setSelections((prev: any) => prev.map((selection: any) => 
      selection.week === week 
        ? { ...selection, teamId: teamId === selection.teamId ? null : teamId } 
        : selection
    ));

    try {
      if (teamId) {
        const { data: gameData, error: gameError } = await supabase
          .from('nfl_schedule')
          .select('api_game_id')
          .eq('week', week)
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .single();

        if (gameError || !gameData) {
          throw new Error('No game found for this team/week. Are they on bye?');
        }

        const { data, error } = await supabase
          .from('user_picks')
          .upsert({
            user_id: userInGroupData?.user_id,
            group_id: groupId,
            week: week,
            team_id: teamId,
            game_id: gameData.api_game_id,
            status: 'pending',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,group_id,week'
          })
          .select();

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('No rows were updated');
        }

        toast.success(`Week ${week} pick updated successfully!`, { duration: 2000 });
      } else {
        const { error } = await supabase
          .from('user_picks')
          .delete()
          .eq('user_id', userInGroupData?.user_id)
          .eq('group_id', groupId)
          .eq('week', week);
        
        if (error) throw error;
        toast.success(`Week ${week} selection cleared!`, { duration: 2000 });
      }

      await refreshData();
      
    } catch (error) {
      console.error("Update failed:", error);
      // Revert the optimistic update
      setSelections((prev: any) => prev.map((selection: any) => 
        selection.week === week 
          ? { ...selection, teamId: selection.teamId === teamId ? null : selection.teamId } 
          : selection
      ));
      
      toast.error(`Failed to update pick. Have you used this team before?`, { duration: 3000 });
    }
  };

  // Settings actions
  const settingsActions = {
    form: settingsForm,
    setForm: setSettingsForm,
    isSubmitting: isSubmittingSettings,
    handleSubmit: async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmittingSettings(true);

      try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        toast.success("Group settings updated successfully!");
        return true; // Success - close modal
      } catch (error) {
        console.error("Error updating settings:", error);
        toast.error("Failed to update settings. Please try again.");
        return false;
      } finally {
        setIsSubmittingSettings(false);
      }
    },
    initializeForm: (group: any) => {
      setSettingsForm({
        groupName: group.name || '',
        groupDescription: group.description || '',
        isPrivate: group.is_private || false,
        allowLatePickChanges: true,
        weeklyDeadline: 'thursday-8pm'
      });
    }
  };

  // Leave group actions
  const leaveGroupActions = {
    confirmationText,
    setConfirmationText,
    isLeaving: isLeavingGroup,
    isValid: confirmationText === "LEAVE GROUP",
    handleConfirm: async (setLeaveGroupMessage: (msg: string) => void) => {
      if (confirmationText !== "LEAVE GROUP") return false;

      setIsLeavingGroup(true);
      
      try {
        const { error } = await supabase
          .from("profile_groups")
          .delete()
          .eq("group_id", groupId)
          .eq("user_id", userInGroupData?.user_id);
        
        if (error) throw error;
        
        setLeaveGroupMessage("Successfully left the group!");
        return true; // Success - close modal
        
      } catch (error) {
        console.error("Error leaving group:", error);
        setLeaveGroupMessage("Failed to leave group. Please try again.");
        return false;
      } finally {
        setIsLeavingGroup(false);
        setConfirmationText("");
      }
    }
  };

  return {
    handleInviteMembers,
    handleLeaveGroup,
    handleTeamSelection,
    settingsActions,
    leaveGroupActions
  };
}