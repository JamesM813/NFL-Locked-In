import { useGroup } from "@/context/GroupContext";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { GroupMember } from "@/utils/types";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface NFLTeam {
  id: string;
  logo_url: string;
  name: string;
}

interface Selection {
  week: number;
  teamId: string | null;
  status: 'win' | 'loss' | 'pending';
  score: string;
}

export default function GroupDash() {
  const { groupId } = useParams();
  const groupContext = useGroup();
  if (!groupContext) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  if (!groupId) {
    throw new Error("Group ID is required");
  }

  const { groups } = groupContext;
  const userInGroupData = groups?.find((group) => group.group_id === Number(groupId));

  const [leaveGroupMessage, setLeaveGroupMessage] = useState("")
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [nflTeams, setNFLTeams] = useState<NFLTeam[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [groupSelections, setGroupSelections] = useState<{[userId: string]: Selection[]}>({});
  const [showTeamSelector, setShowTeamSelector] = useState<{ [key: number]: boolean }>({});


 
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
      //eslint-disable-next-line
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
      //eslint-disable-next-line
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

async function fetchNFLTeams(){
  const {data, error} = await supabase
  .from("nfl_teams")
  .select("*")

  if(error) throw new Error(`Error fetching NFL teams: ${error.message}`);
  if(data) {
    //eslint-disable-next-line
    const teams = data.map((team: any) => ({
      id: team.id,
      logo_url: team.logo_url,
      name: team.name
    }));
    setNFLTeams(teams);
  }
}


async function fetchGroupMembers() {
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

    setGroupMembers(members)
  }

  setLoading(false);
}

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

  if (!userInGroupData) {
    return (
      <div className="p-6 text-white text-center">
        Group not found or you do not have access.
      </div>
    );
  }

  
  const group = userInGroupData.groups;
  const groupName = group.name
  const groupSize = group.group_size
  const groupPictureURL = group.group_picture_url || `https://placehold.co/80x80/1f2937/ffffff?text=${groupName.charAt(0)}`

  function handleChangeSettings() {
    if (!userInGroupData?.is_admin) {
      alert("You do not have permission to change group settings! Ask your group's admin to do this.");
      return;
    } else {
      console.log("Change group settings clicked");
    }
  }

  async function handleInviteMembers() {
    if (!userInGroupData?.is_admin) {
      toast.error("You do not have permission to invite members!", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#1f2937",
          color: "#fff",
        },
      });
      return;
    }
  
    if( groupSize >= 10) {
      toast.error("Group is full! You cannot invite more members.", {
        duration: 3000,
        position: "top-center",
        style: {
          background: "#1f2937",
          color: "#fff",
        },
      });
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
  
      toast.success(`Invite code created: ${inviteCode}`, {
        duration: 6000,
        position: "top-center",
        style: {
          background: "#1f2937",
          color: "#fff",
        },
      });
  
      await navigator.clipboard.writeText(inviteCode);
      toast.success("Invite code copied to clipboard!");
    } catch (err) {
      console.error("Invite error:", err);
      toast.error("Failed to create invite code. Please try again.");
    }
  }

  function handleLeaveGroup() {
    if (userInGroupData?.is_admin) {
      toast.error("You need to transfer admin rights before leaving the group.");
    } else {
      setShowLeaveModal(true);
    }
  }

  function handleCloseModal() {
    setShowLeaveModal(false);
    setConfirmationText("");
  }

  async function handleConfirmLeaveGroup() {
    if (confirmationText !== "LEAVE GROUP") {
      return;
    }

    setIsLeavingGroup(true);
    
    try {
      const { error } = await supabase
        .from("profile_groups")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userInGroupData?.user_id);
        console.log(userInGroupData?.user_id, groupId);
      
      if (error) throw error;
      
      setLeaveGroupMessage("Successfully left the group!");
      setShowLeaveModal(false);
      
    } catch (error) {
      console.error("Error leaving group:", error);
      setLeaveGroupMessage("Failed to leave group. Please try again.");
    } finally {
      setIsLeavingGroup(false);
      setConfirmationText("");
    }
  }

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

  const toggleTeamSelector = (week: number) => {
    setShowTeamSelector(prev => ({ ...prev, [week]: !prev[week] }));
  };

  const getStatusIcon = (status: 'win' | 'loss' | 'pending') => {
    switch (status) {
      case 'win':
        return (
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'loss':
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
    return nflTeams.find(t => t.id === teamId);
  };

  const isConfirmationValid = confirmationText === "LEAVE GROUP";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={groupPictureURL}
              alt={`${groupName} avatar`}
              className="w-16 h-16 rounded-full border-2 border-white/20 object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold">{groupName}</h1>
              <p className="text-gray-400 text-sm">Group Members: {groupSize}/10</p>
              <p className="text-gray-400 text-sm">Group ID: {group.id}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all text-sm md:text-base"
              onClick={handleChangeSettings}
            >
              Group Settings
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all text-sm md:text-base"
              onClick={handleInviteMembers}
              >
                Invite Members
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-all text-sm md:text-base"
                onClick={handleLeaveGroup}
                >
                Leave Group
                </button>
          </div>
        </header>

        {/* Leave Group Message */}
        {leaveGroupMessage && (
          <div className="bg-blue-600/20 border border-blue-600/30 p-4 rounded-xl">
            <p className="text-blue-200">{leaveGroupMessage}</p>
          </div>
        )}

        {/* Group Content */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selections */}
          <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">Selections</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selections.map((selection) => {
                const selectedTeam = getSelectedTeam(selection.teamId);
                const isExpanded = showTeamSelector[selection.week] || false;
                
                return (
                  <div
                    key={selection.week}
                    className="bg-white/10 p-4 rounded-xl border border-white/20"
                  >
                    {/* Main Selection Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Week Display */}
                        <div className="flex-shrink-0 w-12 text-center">
                          <p className="text-sm font-medium text-gray-300">Week</p>
                          <p className="text-lg font-bold">{selection.week}</p>
                        </div>
                        
                        {/* Team Selection Area */}
                        <div className="flex-grow">
                          {selectedTeam ? (
                            <div className="flex items-center gap-3">
                              <img 
                                src={selectedTeam.logo_url} 
                                alt={selectedTeam.name} 
                                className="w-8 h-8 md:w-10 md:h-10 object-contain"
                              />
                              <div className="flex-grow">
                                <p className="font-semibold text-sm md:text-base">{selectedTeam.name}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <button
                                  className="w-8 h-8 md:w-10 md:h-10 bg-gray-600 rounded-full flex items-center justify-center relative group"
                                  onClick={() => toggleTeamSelector(selection.week)}
                                >
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                  </svg>
                                  <span className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform"></span>
                                </button>
                              <p className="text-gray-400 text-sm md:text-base">Select Team</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden md:flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-300">Result</p>
                            {getStatusIcon(selection.status)}
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-300">Score</p>
                            <p className="font-mono text-sm">{selection.score}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleTeamSelector(selection.week)}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          
                          {selectedTeam && (
                            <button
                              onClick={() => handleTeamSelection(selection.week, null)}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Status Row */}
                    <div className="md:hidden flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">Result:</span>
                        {getStatusIcon(selection.status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">Score:</span>
                        <span className="font-mono">{selection.score}</span>
                      </div>
                    </div>

                    {/* Team Selector Dropdown */}
                    {isExpanded && (
                      <div className="mt-4 border-t border-white/20 pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {nflTeams.map(team => (
                            <button
                              key={team.id}
                              onClick={() => handleTeamSelection(selection.week, team.id)}
                              className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                                selectedTeam?.id === team.id
                                  ? 'bg-blue-600/30 border border-blue-500'
                                  : 'bg-white/5 hover:bg-white/10'
                              }`}
                            >
                              <img 
                                src={team.logo_url} 
                                alt={team.name} 
                                className="w-8 h-8 object-contain"
                              />
                              <span className="font-medium text-sm">{team.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Standings with Member Cards */}
          <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">Standings</h2>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <p className="text-gray-400 text-sm">Loading members...</p>
              ) : groupMembers.length === 0 ? (
                <p className="text-gray-400 text-sm">No members found in this group.</p>
              ) : (
                <ul className="grid gap-4">
                  {groupMembers.map((member) => (
                    <li
                      key={member.user_id}
                      className="bg-white/10 p-4 rounded-xl flex items-center gap-4"
                    >
                      <img
                        src={member.profiles.profile_picture_url}
                        alt={member.profiles.username}
                        className="w-12 h-12 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <p className="font-semibold">{member.profiles.username}</p>
                        {member.is_admin && (
                          <p className="text-sm text-yellow-400">Admin</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Group Picks Overview */}
        <section className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
          <h2 className="text-xl font-semibold mb-4">Group Picks</h2>
          
          {/* Week Selector */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm font-medium text-gray-300">View Week:</label>
              <select 
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 18 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Week {i + 1}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Picks Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {groupMembers.map((member) => {
                  const memberSelections = groupSelections[member.user_id] || [];
                  const memberWeekPick = memberSelections.find(s => s.week === selectedWeek);
                  const selectedTeam = memberWeekPick?.teamId ? getSelectedTeam(memberWeekPick.teamId) : null;
                  
                  return (
                    <div key={member.user_id} className="bg-white/10 p-4 rounded-xl border border-white/20">
                      <div className="flex items-center gap-3 mb-4">
                        <img
                          src={member.profiles.profile_picture_url}
                          alt={member.profiles.username}
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                        <div className="flex-grow">
                          <p className="font-semibold text-sm">{member.profiles.username}</p>
                          {member.is_admin && (
                            <p className="text-xs text-yellow-400">Admin</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-300">Record</p>
                          <p className="font-mono text-sm">{/* TODO add record functionality here */}</p>
                        </div>
                      </div>

                      {/* Week Pick */}
                      <div className="border-t border-white/20 pt-4">
                        <p className="text-xs text-gray-300 mb-2">Week {selectedWeek} Pick</p>
                          
                        {selectedTeam ? (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                            <img 
                              src={selectedTeam.logo_url} 
                              alt={selectedTeam.name} 
                              className="w-8 h-8 object-contain"
                            />
                            <div className="flex-grow">
                              <p className="font-semibold text-sm">{selectedTeam.name}</p>
                            </div>
                            <div className="text-right">
                              {getStatusIcon(memberWeekPick?.status || 'pending')}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">No pick yet</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
          </div>
        </section>
      </div>
      
      {/* Leave Group Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Leave Group</h2>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                Are you sure you want to leave <strong>{groupName}</strong>?
              </p>
              
              <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-xl">
                <p className="text-red-200 text-sm font-medium mb-2">⚠️ This action is permanent</p>
                <ul className="text-red-200 text-sm space-y-1">
                  <li>• You will lose access to all group data and history</li>
                  <li>• You cannot rejoin without a new invitation</li>
                  <li>• All your selections and standings will be removed</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type <span className="font-bold text-red-400">LEAVE GROUP</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="LEAVE GROUP"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                disabled={isLeavingGroup}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeaveGroup}
                disabled={!isConfirmationValid || isLeavingGroup}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLeavingGroup ? "Leaving..." : "Leave Group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}