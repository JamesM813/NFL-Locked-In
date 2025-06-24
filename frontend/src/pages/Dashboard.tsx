import { useProfile } from "@/context/ProfileContext"
import type { userData } from "@/utils/types"
export default function Dashboard() {
  
  const profile: userData | null = useProfile()

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

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md">
            <p className="text-sm text-gray-400 mb-1">Total Users</p>
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

        {/* Activity or Chart Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md h-64">
            <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
            <div className="text-gray-500 text-sm">Loading recent logs...</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md h-64">
            <h2 className="text-xl font-semibold mb-2">Overview Chart</h2>
            <div className="text-gray-500 text-sm">Chart will render here...</div>
          </div>
        </section>

      </div>
    </div>
  )
}
