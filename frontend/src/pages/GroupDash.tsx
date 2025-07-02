import { useGroup } from "@/context/GroupContext"
import { useParams } from "react-router-dom"

export default function GroupDash() {
  const { groupId } = useParams()
  const groupContext = useGroup()
  if (!groupContext) {
    throw new Error("useGroup must be used within a GroupProvider")
  }
  if (!groupId) {
    throw new Error("Group ID is required")
  }

  const { groups } = groupContext
  const userInGroupData = groups?.find(group => group.group_id === Number(groupId))

  if (!userInGroupData) {
    return (
      <div className="p-6 text-white text-center">
        Group not found or you do not have access.
      </div>
    )
  }

  const group = userInGroupData.groups


  function handleChangeSettings() {
    if(!userInGroupData?.is_admin){
        alert("You do not have permission to change group settings! Ask your group's admin to do this.")
        return
    } else {
        console.log("Change group settings clicked")
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Group Header */}
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
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all" onClick={() => handleChangeSettings()}>
              Group Settings
            </button>
          </div>
        </header>

        {/* Group Content Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl min-h-[200px]">
            <h2 className="text-xl font-semibold mb-2">Selections</h2>
            <p className="text-gray-400 text-sm">This section can show group stats, activity, or announcements.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl min-h-[200px]">
            <h2 className="text-xl font-semibold mb-2">Standings</h2>
            <p className="text-gray-400 text-sm">List of group members will go here.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
