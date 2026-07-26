import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useGroup } from "@/context/SessionContext";
import { useSeason } from "@/context/SeasonContext";
import { useGroupData } from "@/hooks/useGroupData";
import { useGroupActions } from "@/hooks/useGroupActions";
import { calculateMemberScores } from "@/utils/scoring";

const INITIAL_LEAVE_GROUP_STATE = {
  isModalOpen: false,
  confirmationText: "",
  isLeaving: false,
  message: ""
};

const INITIAL_SETTINGS_FORM = {
  groupName: '',
  isPublic: false,
  profilePictureUrl: ''
};

// Composite hook backing the group dashboard page: owns all data fetching,
// derived state, and mutation handlers so GroupDash.tsx only renders.
export function useGroupDashboard() {
  const nav = useNavigate();
  const { groupId: groupIdParam } = useParams();
  const groupContext = useGroup();

  if (!groupContext) {
    throw new Error("useGroup must be used within a SessionProvider");
  }
  if (!groupIdParam) {
    throw new Error("Group ID is required");
  }
  // The route param is a string; the DB stores group ids as numbers.
  const groupId = Number(groupIdParam);

  const { groups, refetchGroups } = groupContext;
  const { currentSeason, currentWeek } = useSeason();
  const [viewingSeason, setViewingSeason] = useState(currentSeason);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([currentSeason]);
  const isCurrentSeason = viewingSeason === currentSeason;
  const userInGroupData = groups?.find((group) => group.group_id === groupId);

  const {
    loading,
    groupMembers,
    nflTeams,
    selections,
    groupSelections,
    setSelections,
    fetchUserSelections,
    fetchGroupSelections,
    getAvailableTeamsForUserWeek
  } = useGroupData(groupId, viewingSeason, userInGroupData?.user_id);

  const {
    isSubmittingSettings,
    handleInviteMembers,
    handleSubmitSettings,
    handleLeaveGroup
  } = useGroupActions(groupId, refetchGroups);

  const [showTeamSelector, setShowTeamSelector] = useState<{ [key: number]: boolean }>({});
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [groupSize, setGroupSize] = useState(0);
  const [leaveGroup, setLeaveGroup] = useState(INITIAL_LEAVE_GROUP_STATE);
  const [settingsModal, setSettingsModal] = useState({
    isOpen: false,
    form: INITIAL_SETTINGS_FORM
  });

  const memberScores = useMemo(
    () => calculateMemberScores(groupMembers, groupSelections),
    [groupMembers, groupSelections]
  );

  useEffect(() => {
    setSelectedWeek(currentWeek);
  }, [currentWeek]);

  useEffect(() => {
    setViewingSeason(currentSeason);
  }, [groupId, currentSeason]);

  useEffect(() => {
    async function fetchAvailableSeasons() {
      const { data, error } = await supabase
        .from('user_picks')
        .select('season')
        .eq('group_id', groupId);

      if (error) {
        console.error("Error fetching group seasons:", error);
        return;
      }

      const seasons = [...new Set([...(data ?? []).map((row) => row.season), currentSeason])]
        .sort((a, b) => b - a);
      setAvailableSeasons(seasons);
    }
    fetchAvailableSeasons();
  }, [groupId, currentSeason]);

  useEffect(() => {
    async function fetchGroupSize() {
      const { data: groupSize, error } = await supabase
        .from('group_member_counts')
        .select('group_size')
        .eq('id', groupId)
        .single();
      if (error) {
        console.error("Error fetching group size:", error);
        return;
      }
      if (groupSize) {
        setGroupSize(groupSize.group_size);
      }
    }
    fetchGroupSize();
  }, [groupId]);

  useEffect(() => {
    if (userInGroupData?.groups) {
      const group = userInGroupData.groups;
      setSettingsModal(prev => ({
        ...prev,
        form: {
          groupName: group.name || '',
          isPublic: group.is_public || false,
          profilePictureUrl: group.group_picture_url || ''
        }
      }));
    }
  }, [userInGroupData]);

  const handleDeleteGroup = async () => {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted successfully');

      await refetchGroups();
      nav('/dashboard');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
      throw error;
    }
  };

  const handleChangeSettings = () => {
    if (!userInGroupData?.is_admin) {
      toast.error("You do not have permission to change group settings! Ask your group's admin to do this.");
      return;
    }
    setSettingsModal(prev => ({ ...prev, isOpen: true }));
  };

  const handleCloseSettings = () => {
    setSettingsModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleInviteMembersClick = () => {
    if (!userInGroupData?.groups) return;
    handleInviteMembers(userInGroupData.is_admin || false, groupSize);
  };

  const handleLeaveGroupClick = () => {
    if (userInGroupData?.is_admin) {
      toast.error("You need to transfer admin rights before leaving the group.");
    } else {
      setLeaveGroup(prev => ({ ...prev, isModalOpen: true }));
    }
  };

  const handleConfirmLeaveGroup = async () => {
    if (leaveGroup.confirmationText !== "LEAVE GROUP") return;

    setLeaveGroup(prev => ({ ...prev, isLeaving: true }));
    const message = await handleLeaveGroup(userInGroupData?.user_id || '');
    setLeaveGroup({ ...INITIAL_LEAVE_GROUP_STATE, message });
  };

  const handleCloseLeaveModal = () => {
    setLeaveGroup(prev => ({ ...prev, isModalOpen: false, confirmationText: "" }));
  };

  const handleConfirmationTextChange = (text: string) => {
    setLeaveGroup(prev => ({ ...prev, confirmationText: text }));
  };

  const toggleTeamSelector = useCallback((week: number) => {
    setShowTeamSelector(prev => ({ ...prev, [week]: !prev[week] }));
  }, []);

  const handleTeamSelection = useCallback(async (week: number, teamId: string | null) => {
    if (!isCurrentSeason) return;

    setSelections(prev => prev.map(selection =>
      selection.week === week
        ? { ...selection, teamId: teamId === selection.teamId ? null : teamId }
        : selection
    ));

    setShowTeamSelector(prev => ({ ...prev, [week]: false }));

    try {
      if (teamId) {
        const { data: gameData, error: gameError } = await supabase
          .from('nfl_schedule')
          .select('api_game_id, locks_at')
          .eq('season', currentSeason)
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
            season: currentSeason,
            week: week,
            team_id: teamId,
            game_id: gameData.api_game_id,
            status: 'pending',
            updated_at: new Date().toISOString(),
            locks_at: gameData.locks_at
          }, {
            onConflict: 'user_id,group_id,season,week'
          })
          .select();

        if (error) throw error;

        if (!data || data.length === 0) {
          throw new Error('No rows were updated');
        }

        toast.success(`Week ${week} pick updated successfully!`, {
          duration: 2000,
          position: "top-center",
        });
      } else {
        const { error } = await supabase
          .from('user_picks')
          .delete()
          .eq('user_id', userInGroupData?.user_id)
          .eq('group_id', groupId)
          .eq('season', currentSeason)
          .eq('week', week);

        if (error) throw error;

        toast.success(`Week ${week} selection cleared!`, {
          duration: 2000,
          position: "top-center",
        });
      }
      await Promise.all([fetchUserSelections(), fetchGroupSelections()]);

    } catch (error) {
      console.error("Update failed:", error);
      setSelections(prev => prev.map(selection =>
        selection.week === week
          ? { ...selection, teamId: selection.teamId === teamId ? null : selection.teamId }
          : selection
      ));

      toast.error(`Failed to update pick. Have you used this team before?`, {
        duration: 3000,
        position: "top-center",
      });
    }
  }, [isCurrentSeason, currentSeason, groupId, userInGroupData?.user_id, setSelections, fetchUserSelections, fetchGroupSelections]);

  const handleSelectPresetAvatar = async (presetUrl: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ group_picture_url: presetUrl })
        .eq('id', groupId);

      if (error) throw error;

      setSettingsModal(prev => ({ ...prev, form: { ...prev.form, profilePictureUrl: presetUrl } }));

      await refetchGroups();
    } catch (error) {
      console.error('Failed to update preset avatar:', error);
      throw error;
    }
  };

  const handleUploadProfilePicture = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `group-${groupId}-${Math.random()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('group-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('group-avatars')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error("No public URL");

      const { error: updateError } = await supabase
        .from('groups')
        .update({ group_picture_url: publicUrl })
        .eq('id', groupId);

      if (updateError) throw updateError;

      return publicUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      refetchGroups();
    }
  };

  const getSelectedTeam = useCallback((teamId: string | null) => {
    if (!teamId) return null;
    return nflTeams.find(t => t.id === teamId) || null;
  }, [nflTeams]);

  return {
    // group identity
    userInGroupData,
    groupSize,
    // season + week
    currentWeek,
    viewingSeason,
    setViewingSeason,
    availableSeasons,
    isCurrentSeason,
    selectedWeek,
    setSelectedWeek,
    // data
    loading,
    groupMembers,
    selections,
    groupSelections,
    memberScores,
    getAvailableTeamsForUserWeek,
    getSelectedTeam,
    // picks
    showTeamSelector,
    toggleTeamSelector,
    handleTeamSelection,
    // settings modal
    settingsModal,
    isSubmittingSettings,
    handleChangeSettings,
    handleCloseSettings,
    handleSubmitSettings,
    handleSelectPresetAvatar,
    handleUploadProfilePicture,
    handleDeleteGroup,
    // membership
    handleInviteMembersClick,
    leaveGroup,
    handleLeaveGroupClick,
    handleConfirmLeaveGroup,
    handleCloseLeaveModal,
    handleConfirmationTextChange
  };
}
