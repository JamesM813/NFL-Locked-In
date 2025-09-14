import { useGroup } from "@/context/GroupContext";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useGroupData } from "@/hooks/useGroupData";
import { useGroupActions } from "@/hooks/useGroupActions";
import { GroupHeader } from "@/components/GroupHeader";
import { SelectionsList } from "@/components/SelectionsList";
import { Standings } from "@/components/Standings";
import { GroupPicks } from "@/components/GroupPicks";
import { SettingsModal } from "@/components/SettingsModal";
import { LeaveGroupModal } from "@/components/LeaveGroupModal";
import { useNavigate } from "react-router-dom";

export default function GroupDash() {
  const nav = useNavigate();
  const { groupId } = useParams();
  const groupContext = useGroup();
  
  if (!groupContext) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  if (!groupId) {
    throw new Error("Group ID is required");
  }

  const { groups, refetchGroups } = groupContext;
  const userInGroupData = groups?.find((group) => group.group_id === Number(groupId));

  const {
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
    getAvailableTeamsForUserWeek
  } = useGroupData(groupId, userInGroupData?.user_id);

  const {
    isSubmittingSettings,
    handleInviteMembers,
    handleSubmitSettings,
    handleLeaveGroup
  } = useGroupActions(groupId, refetchGroups);


  const handleDeleteGroup = async () => {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted successfully');

      await refetchGroups();
      nav('/dashboard')
      
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
      throw error; 
    }
  };

  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTeamSelector, setShowTeamSelector] = useState<{ [key: number]: boolean }>({});
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [leaveGroupMessage, setLeaveGroupMessage] = useState("");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [groupSize, setGroupSize] = useState(0);
  const [settingsForm, setSettingsForm] = useState({
    groupName: '',
    isPublic: false,
    profilePictureUrl: ''
  });


  const calculateMemberScores = () => {
    const scores: { [key: string]: number } = {};
    
    if (Array.isArray(groupMembers)) {
      groupMembers.forEach(member => {
        scores[member.user_id] = 0;
      });
    }

    if (groupSelections && typeof groupSelections === 'object') {
      Object.entries(groupSelections).forEach(([userId, userSelections]) => {
        if (Array.isArray(userSelections)) {
          userSelections.forEach(selection => {
            scores[userId] = (scores[userId] || 0) + (Number(selection.score) || 0);
          });
        }
      });
    }
    
    return scores;
  };


  useEffect(() => {
    async function fetchCurrentWeek(){
      const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard')
      if (!response.ok) {
        console.error('Failed to fetch NFL current week');
        return;
      }
      const data = await response.json();
      let curWeek = data?.week?.number || 1;
      console.log(curWeek)
      
      const now = new Date();
      const year = now.getFullYear();
      const march1 = new Date(`${year}-03-01T00:00:00Z`);
      const sep4 = new Date(`${year}-09-04T00:00:00Z`);
      if(now >= march1 && now <= sep4){
        curWeek = 1; // Force to week 1 before season starts since ESPN api does weird stuff with HOF game/preseason weeks
      }
      setCurrentWeek(curWeek);
    }
    fetchCurrentWeek()

  })


  useEffect(() => {
    setSelectedWeek(currentWeek);
  }, [])
  
  useEffect(() => {
    async function fetchGroupSize(){
      const {data: groupSize, error} = await supabase
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
  fetchGroupSize()
  })
  useEffect(() => {
    fetchNFLTeams();
  }, [fetchNFLTeams]);

  useEffect(() => {
    fetchGroupMembers();
  }, [groupId, fetchGroupMembers]);

  useEffect(() => {
    if (userInGroupData?.user_id) {
      fetchInitialData();
    }
  }, [groupId, userInGroupData?.user_id, fetchInitialData]);

  useEffect(() => {
    if (groupMembers.length > 0) {
      fetchGroupSelections();
    }
  }, [groupMembers, fetchGroupSelections]);

  useEffect(() => {
    if (userInGroupData?.groups) {
      const group = userInGroupData.groups;
      setSettingsForm({
        groupName: group.name || '',
        isPublic: group.is_public || false,
        profilePictureUrl: group.group_picture_url || ''
      });
    }
  }, [userInGroupData]);

  const handleChangeSettings = () => {
    if (!userInGroupData?.is_admin) {
      toast.error("You do not have permission to change group settings! Ask your group's admin to do this.");
      return;
    }
    setShowSettingsModal(true);
  };

  const handleInviteMembersClick = () => {
    if (!userInGroupData?.groups) return;
    handleInviteMembers(userInGroupData.is_admin || false, userInGroupData.groups.group_size);
  };

  const handleLeaveGroupClick = () => {
    if (userInGroupData?.is_admin) {
      toast.error("You need to transfer admin rights before leaving the group.");
    } else {
      setShowLeaveModal(true);
    }
  };

  const handleConfirmLeaveGroup = async () => {
    if (confirmationText !== "LEAVE GROUP") return;
    
    setIsLeavingGroup(true);
    const message = await handleLeaveGroup(userInGroupData?.user_id || '');
    setLeaveGroupMessage(message);
    setShowLeaveModal(false);
    setIsLeavingGroup(false);
    setConfirmationText("");
  };

  const handleCloseLeaveModal = () => {
    setShowLeaveModal(false);
    setConfirmationText("");
  };

  const toggleTeamSelector = (week: number) => {
    setShowTeamSelector(prev => ({ ...prev, [week]: !prev[week] }));
  };

  const handleTeamSelection = async (week: number, teamId: string | null) => {
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
            updated_at: new Date().toISOString(),
            locks_at: gameData.locks_at
          }, {
            onConflict: 'user_id,group_id,week'
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
          .eq('week', week);
        
        if (error) throw error;
        
        toast.success(`Week ${week} selection cleared!`, {
          duration: 2000,
          position: "top-center",
        });
      }
      await fetchInitialData();
      await fetchGroupSelections();
      
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
  };
 
  const handleSelectPresetAvatar = async (presetUrl: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ group_picture_url: presetUrl })
        .eq('id', groupId);

      if (error) throw error;


      setSettingsForm(prev => ({ ...prev, profilePictureUrl: presetUrl }));
      

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
      refetchGroups()
    }
  };

  const getStatusIcon = (status: 'correct' | 'incorrect' | 'pending') => {
    switch (status) {
      case 'correct':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'incorrect':
        return (
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getSelectedTeam = (teamId: string | null) => {
    if (!teamId) return null;
    return nflTeams.find(t => t.id === teamId) || null;
  };

  if (!userInGroupData) {
    return (
      <div className="p-6 text-white text-center">
        Group not found or you do not have access.
      </div>
    );
  }

  const group = userInGroupData.groups;
  const groupName = group.name;
  const groupPictureURL = group.group_picture_url || `https://placehold.co/80x80/1f2937/ffffff?text=${groupName.charAt(0)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <GroupHeader
          groupName={groupName}
          groupSize={groupSize}
          groupId={String(group.id)}
          groupPictureURL={groupPictureURL}
          onChangeSettings={handleChangeSettings}
          onInviteMembers={handleInviteMembersClick}
          onLeaveGroup={handleLeaveGroupClick}
        />

        {leaveGroupMessage && (
          <div className="bg-blue-600/20 border border-blue-600/30 p-4 rounded-xl">
            <p className="text-blue-200">{leaveGroupMessage}</p>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SelectionsList
            selections={selections}
            currentWeek={currentWeek}
            getAvailableTeamsForUserWeek={getAvailableTeamsForUserWeek}
            showTeamSelector={showTeamSelector}
            onToggleTeamSelector={toggleTeamSelector}
            onTeamSelection={handleTeamSelection}
            getStatusIcon={getStatusIcon}
            getSelectedTeam={getSelectedTeam}
          />

          <Standings
            loading={loading}
            groupMembers={groupMembers}
            memberScores={calculateMemberScores()}
          />
        </section>

        <GroupPicks
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          groupMembers={groupMembers}
          groupSelections={groupSelections}
          getSelectedTeam={getSelectedTeam}
          getStatusIcon={getStatusIcon}
          currentWeek={currentWeek}
        />

        <SettingsModal
          isOpen={showSettingsModal}
          isSubmitting={isSubmittingSettings}
          initialSettings={settingsForm}
          onClose={() => setShowSettingsModal(false)}
          onSubmit={handleSubmitSettings}
          onSelectPresetAvatar={handleSelectPresetAvatar}
          onUploadProfilePicture={handleUploadProfilePicture}
          onDeleteGroup={userInGroupData?.is_admin ? handleDeleteGroup : undefined}
          presetAvatars={[1,2,3,4].map((i) => {
            const presetUrl = supabase
                  .storage
                  .from("preset-group-avatars")
                  .getPublicUrl(`avatar-${i}.png`).data.publicUrl
            return presetUrl
          })}
        />

        <LeaveGroupModal
          isOpen={showLeaveModal}
          isLeaving={isLeavingGroup}
          groupName={groupName}
          confirmationText={confirmationText}
          onConfirmationChange={setConfirmationText}
          onClose={handleCloseLeaveModal}
          onConfirm={handleConfirmLeaveGroup}
        />
      </div>
    </div>
  );
}