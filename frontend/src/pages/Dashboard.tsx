import { useProfile } from "@/context/ProfileContext"
import { useGroup } from "@/context/GroupContext"
import type { profileData, profileGroupData } from "@/utils/types"
export default function Dashboard() {
  
  const profile: profileData | null = useProfile()
  const groups: profileGroupData[] | null = useGroup()

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <p className="text-white">Loading user data...</p>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <p className="text-gray-400">Welcome back! Here's what's going on.</p>
          </div>
          <div>

            <div><img src={profile.profile_picture_url} alt='Profile picture failed to load'  className="mt-4 mr-4 w-20 h-20 rounded-full border-2 border-white object-cover shadow-md"/></div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md h-64">
            <h2 className="text-xl font-semibold mb-2">Your Groups</h2>
            <div className="text-gray-500 text-sm"></div>
            <ul className="space-y-2">
              {groups && groups.length > 0 ? (
                groups.map((group) => (
                <li key={group.id} className="p-4 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={group.groups.group_picture_url || '/default-group-image.png'} 
                      alt={`${group.groups.name} picture`}
                      className="w-8 h-8 rounded-full object-cover border border-white/20"
                    />
                    <h3 className="text-lg font-semibold">{group.groups.name}</h3>
                  </div>
                </li>
                ))
              ) : (
                <p className="text-gray-500">No groups found.</p>
              )}
            </ul>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md h-64">
            <h2 className="text-xl font-semibold mb-2">Overview Chart</h2>
            <div className="text-gray-500 text-sm">Chart will render here...</div>
          </div>
        </section>


        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md">
            <p className="text-sm text-gray-400 mb-1"></p>
            <p className="text-2xl font-semibold">—</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md">
            <p className="text-sm text-gray-400 mb-1">Active Sessions</p>
            <p className="text-2xl font-semibold">—</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md">
            <p className="text-sm text-gray-400 mb-1">Tasks Completed</p>
            <p className="text-2xl font-semibold">—</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md">
            <p className="text-sm text-gray-400 mb-1">Revenue</p>
            <p className="text-2xl font-semibold">—</p>
          </div>
        </section>
      </div>
    </div>
  )
}
