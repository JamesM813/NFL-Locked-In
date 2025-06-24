import type { profileGroupData } from "@/utils/types"
import { useGroup } from "@/context/GroupContext"

export default function Groups(){

    const groups: profileGroupData[] | null = useGroup()
    if (!groups) {
        console.log('No groups found')
    }
    return (
        <div>
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
          </section>
        </div>
    )
}