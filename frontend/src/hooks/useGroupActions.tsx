import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export function useGroupActions(groupId: string, refetchGroups: () => Promise<void>) {
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  const handleInviteMembers = async (isAdmin: boolean, groupSize: number) => {
    if (!isAdmin) {
      toast.error("You do not have permission to invite members!");
      return;
    }

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

  const handleSubmitSettings = async (settingsForm: { groupName: string; isPublic: boolean }) => {
    setIsSubmittingSettings(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: settingsForm.groupName,
          is_public: settingsForm.isPublic,
        })
        .eq('id', groupId);
      
      if (error) throw error;

      toast.success("Group settings updated successfully!");
      await refetchGroups();
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings. Please try again.");
      return false;
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  const handleLeaveGroup = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profile_groups")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
      
      if (error) throw error;
      return "Successfully left the group!";
    } catch (error) {
      console.error("Error leaving group:", error);
      return "Failed to leave group. Please try again.";
    }
  };

  return {
    isSubmittingSettings,
    handleInviteMembers,
    handleSubmitSettings,
    handleLeaveGroup
  };
}