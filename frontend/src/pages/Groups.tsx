import React, { useState } from "react"
import { useGroup } from "@/context/GroupContext"
import { useProfile } from "@/context/ProfileContext"
import { Plus, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"


export default function Groups() {

  const groupContext = useGroup()
  const profileContext = useProfile()
  if (!groupContext) { throw new Error("useGroup must be used within a GroupProvider")}
  if (!profileContext) { throw new Error("useProfile must be used within a ProfileProvider")}
  const { groups, refetchGroups } = groupContext
  const { profile } = profileContext
  
  const navigator = useNavigate()
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  function handleCreateGroup() {
    navigator('/create-group')
  }

  function handleOpenJoinModal() {
    setIsJoinModalOpen(true)
    setErrorMessage("")
    setJoinCode("")
  }

  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const {data: joinCodeData, error: joinError} = await supabase
      .from('group_join_codes')
      .select('*')
      .eq('join_code', joinCode)
      .single()

    if (joinError) {
      setErrorMessage("Invalid join code. Please try again.")
      setIsLoading(false)
      return
    }

    if (!joinCodeData) {
      setErrorMessage("Group not found. Please check the join code.")
      setIsLoading(false)
      return
    }

    if( new Date(joinCodeData.expires_at) < new Date() ) {
      setErrorMessage("This join code has expired. Please contact the group admin for a new code.")
      setIsLoading(false)
      return
    }
    
    const { data: groupData, error: groupDataError} = await supabase
    .from('groups')
    .select('group_size')
    .eq('id', joinCodeData.group_id)
    .single()

    if(groupDataError) setErrorMessage("Failed to retrieve group data. Please try again later.")
    if (groupData && groupData.group_size >= 10) {
      setErrorMessage("This group is already full. Please try another group.")
      setIsLoading(false)
      return
    }

    if (joinCodeData.join_code == joinCode) {

      const { data: profileGroupData, error: profileGroupError } = await supabase
        .from('profile_groups')
        .select('*')
        .eq('group_id', joinCodeData.group_id)
        

        for (const group of profileGroupData!) {
          if (group.user_id === profile?.id) {
            setErrorMessage("You are already a member of this group.")
            setIsLoading(false)
            return
          }
        }
        
      if (profileGroupError) {
        setErrorMessage("Failed to join the group. Please try again later.")
        setIsLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('profile_groups')
        .insert({
          user_id: profile?.id,
          group_id: joinCodeData.group_id
        })
      if (insertError) {
        setErrorMessage("Failed to join the group. Please try again later.")
        setIsLoading(false)
        return
      }
      await refetchGroups()
      setIsJoinModalOpen(false)
    }
    setIsLoading(false)
  }


  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
        <div className="max-w-7xl mx-auto space-y-8">

          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
              <p className="text-gray-400 mt-1">Manage, create, or join your groups</p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleOpenJoinModal}
                className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Join Group</span>
              </button>

              <button
                type="button"
                onClick={handleCreateGroup}
                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Group</span>
              </button>
            </div>
          </header>


          {/* Groups Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 min-h-[300px]">
            <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
            {groups && groups.length > 0 ? (
              <ul className="space-y-3">
                {groups.map((group) => (
                  <li key={group.id}>
                    <button
                      onClick={() => navigator(`/group/${group.group_id}`)}
                      className="w-full text-left p-4 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={
                            group.groups.group_picture_url ||
                            `https://placehold.co/64x64/1f2937/ffffff?text=${group.groups.name.charAt(0)}`
                          }
                          alt={`${group.groups.name} picture`}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                        />
                        <div>
                          <h3 className="text-lg font-semibold">{group.groups.name}</h3>
                          <p className="text-gray-400 text-sm">Group Members: {group.groups.group_size}/10</p>
                          <p className="text-sm text-gray-400">Group ID: {group.groups.id}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>You haven't joined any groups yet.</p>
              </div>
            )}
            </div>

            {/* Placeholder for future section */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10 min-h-[300px]">
              <h2 className="text-xl font-semibold mb-4">Group Activity</h2>
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Activity feed coming soon...</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Join Group Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8">
            <button 
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-white text-2xl font-light text-center mb-2">Join a Group</h2>
            <p className="text-gray-400 text-center mb-6">Enter the 6-digit code to join.</p>

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))} // Only allow digits
                maxLength={6}
                className="w-full text-center text-3xl text-white tracking-[0.5em] font-mono bg-white/5 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="000000"
              />

              {errorMessage && (
                <p className="text-red-400 text-sm text-center">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {isLoading ? 'Joining...' : 'Join Group'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}