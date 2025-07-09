import { useGroup } from "@/context/GroupContext";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { GroupMember } from "@/utils/types";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

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
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchGroupMembers();

  }, [groupId, userInGroupData, ]);

  if (!userInGroupData) {
    return (
      <div className="p-6 text-white text-center">
        Group not found or you do not have access.
      </div>
    );
  }

  const group = userInGroupData.groups;

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

  const isConfirmationValid = confirmationText === "LEAVE GROUP";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <img
              src={group.group_picture_url || `https://placehold.co/80x80/1f2937/ffffff?text=${group.name.charAt(0)}`}
              alt={`${group.name} avatar`}
              className="w-16 h-16 rounded-full border-2 border-white/20 object-cover"
            />
            <div>
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <p className="text-gray-400 text-sm">Group ID: {group.id}</p>
            </div>
          </div>

          {/* Future buttons/actions (like invite or settings) */}
          <div className="flex gap-2">
            <button
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
              onClick={handleChangeSettings}
            >
              Group Settings
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all"
              onClick={handleInviteMembers}
              >
                Invite Members
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-all"
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
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selections Placeholder */}
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl min-h-[200px]">
            <h2 className="text-xl font-semibold mb-2">Selections</h2>
            <p className="text-gray-400 text-sm">
              This section can show group stats, activity, or announcements.
            </p>
          </div>

          {/* Standings with Member Cards */}
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl min-h-[200px]">
            <h2 className="text-xl font-semibold mb-4">Standings</h2>
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
                Are you sure you want to leave <strong>{group.name}</strong>?
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