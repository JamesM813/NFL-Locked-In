import type { profileGroupData } from "@/utils/types"
import { useGroup } from "@/context/GroupContext"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"


export default function Groups() {
  const groups: profileGroupData[] | null = useGroup()
  const navigator = useNavigate()


  function handleCreateGroup() {
    navigator('/create-group')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Groups</h1>
            <p className="text-gray-400">Manage and view your groups</p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition">
            <Plus className="w-4 h-4" />
            <button type="button" onClick={handleCreateGroup}>Create New Group</button>
          </button>
        </header>

        {/* Groups Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md min-h-[300px]">
            <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
            {groups && groups.length > 0 ? (
              <ul className="space-y-3">
                {groups.map((group) => (
                  <li
                    key={group.id}
                    className="p-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={group.groups.group_picture_url || '/default-group-image.png'}
                        alt={`${group.groups.name} picture`}
                        className="w-10 h-10 rounded-full object-cover border border-white/20"
                      />
                      <div>
                        <h3 className="text-lg font-semibold">{group.groups.name}</h3>
                        <p className="text-sm text-gray-400">Group ID: {group.groups.id}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No groups found.</p>
            )}
          </div>

          {/* Placeholder for future section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md min-h-[300px]">
            <h2 className="text-xl font-semibold mb-4">Group Activity</h2>
            <p className="text-gray-500 text-sm">Coming soon...</p>
          </div>
        </section>
      </div>
    </div>
  )
}
