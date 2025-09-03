import { useProfile } from "@/context/ProfileContext"
import { useGroup } from "@/context/GroupContext"
import type { profileGroupData } from "@/utils/types"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

export default function Dashboard() {
  const profileContext = useProfile()
  const groupContext = useGroup()
  const navigator = useNavigate()

  if (!groupContext) throw new Error("useGroup must be used within a GroupProvider")
  if (!profileContext) throw new Error("useProfile must be used within a ProfileProvider")
  const { profile, refetchProfiles } = profileContext
  const { groups, refetchGroups } = groupContext 

  const [loading, setLoading] = useState(false)
  const [news, setNews] = useState<{id: string, title: string, source: string, time: string, type: string, image: string, url: string}[]>([])

  const changelog = [
    {
      version: "v1.0.0",
      date: "2025-08-22T14:35:00",
      type: "release",
      changes: [
        "Initial 2025 release",
        "Core gameplay functionality",
      ]
    },
        {
      version: "v1.0.1",
      date: "2025-09-03T14:35:00",
      type: "fix",
      changes: [
        "Fixed issue with used teams not being removed from selection list",
      ]
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'text-green-300 bg-green-500/20 border-green-500/30'
      case 'fix': return 'text-blue-300 bg-blue-500/20 border-blue-500/30'
      case 'release': return 'text-purple-300 bg-purple-500/20 border-purple-500/30'
      default: return 'text-gray-300 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return '✨'
      case 'fix': return '🔧'
      case 'release': return '🚀'
      default: return '📝'
    }
  }

  useEffect(() => {
    async function refetchData() {
      await refetchProfiles()
      await refetchGroups()
    }
    refetchData()
  }, [])

  useEffect(() => {
    async function fetchNews() {
      setLoading(true)
      try {
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=25')
        if (!response.ok) throw new Error('Failed to fetch news')
        const data = await response.json()

        if(data.articles.length > 0){
          //eslint-disable-next-line
          data.articles = data.articles.map((article: any) => ({
            id: article.id,
            title: article.headline,
            source: article.source?.name || 'ESPN',
            time: `${new Date(article.published).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${new Date(article.published).toLocaleDateString([], {month: 'numeric', day: 'numeric'})}`,
            type: article.type,
            image: article.images?.[0]?.url || '',
            url: article.links?.web?.href || '',
          }))
        }
        setNews(data.articles || [])
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          <p className="text-white text-lg">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold cursor-pointer hover:opacity-80 transition" onClick={() => navigator('/profile')}>{profile.username}</h1>
          <p className="text-gray-400">Welcome back! Here's what's going on.</p>
        </div>
        <div>
          <img
            src={profile.profile_picture_url}
            alt="Profile picture failed to load"
            className="mt-4 mr-4 w-20 h-20 rounded-full border-2 border-white object-cover shadow-md cursor-pointer hover:opacity-80 transition" 
            onClick={() => navigator('/profile')}
          />
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md h-[32rem]">
          <h2 className="text-xl font-semibold mb-4">Your Groups</h2>
          <div
            className="h-[calc(100%-3rem)] overflow-y-auto pr-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#4B5563 #374151",
            }}
          >
            <div className="space-y-3">
              {groups && groups.length > 0 ? (
                groups.map((group: profileGroupData) => (
                  <div
                    key={group.id}
                    className="bg-white/20 rounded-lg p-2 hover:bg-white/30 transition-colors cursor-pointer"
                    onClick={() => navigator("/group/" + group.group_id)}
                  >
                    <div className="flex space-x-2">
                      <div className="w-20 h-20 bg-gray-600 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={
                            group.groups.group_picture_url ||
                            "/default-group-image.png"
                          }
                          alt={`${group.groups.name} picture`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-s font-semibold text-white line-clamp-2 leading-tight">
                          {group.groups.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Group ID: {group.group_id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <p className="text-gray-500">No groups found.</p>
                  <button
                    className="px-4 py-2 mt-4 bg-gray-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    onClick={() => navigator('/groups')}
                  >
                    Join or create a group now!
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md h-[32rem]">
            <h2 className="text-xl font-semibold mb-4">NFL News</h2>
            <div
              className="h-[calc(100%-3rem)] overflow-y-auto pr-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#4B5563 #374151",
                scrollbarGutter: "stable",
              }}
            >
              <div className="space-y-3">
                {news.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white/20 rounded-lg p-2 hover:bg-white/30 transition-colors cursor-pointer"
                    onClick={() => window.open(article.url, "_blank")}
                  >
                    <div className="flex space-x-2">
                      <div className="w-20 h-20 bg-gray-600 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={article.image}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-s font-semibold text-white line-clamp-2 leading-tight">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {article.source} • {article.time} •{" "}
                          {article.type.replace(/([a-z])([A-Z])/g, "$1 $2")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-md">
        <div className="flex items-center space-x-2 mb-6">
          <h2 className="text-xl font-semibold">Recent Updates</h2>
          <span className="text-2xl">📋</span>
        </div>
        
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2" 
             style={{
               scrollbarWidth: "thin",
               scrollbarColor: "#4B5563 #374151",
             }}>
          {changelog.map((update, index) => (
            <div key={index} className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(update.type)}`}>
                    {getTypeIcon(update.type)} {update.type.toUpperCase()}
                  </span>
                  <span className="text-lg font-semibold">{update.version}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(update.date).toLocaleDateString([], { 
                    timeZone: 'America/New_York',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              
              <ul className="space-y-1">
                {update.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className="text-sm text-gray-300 flex items-start space-x-2">
                    <span className="text-gray-500 mt-1">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-6 shadow-md border border-yellow-500/30">
        <h2 className="text-xl font-semibold text-yellow-300 mb-2">Disclaimer</h2>
        <p className="text-sm text-yellow-200">
          This website is in active development. If you encounter any issues or have any comments
          or suggestions, please reach out at our <a href="/contact" className="underline text-yellow-300">contact page</a>, 
          and check back for updates!
        </p>
      </div>
    </div>
  </div>
);
}