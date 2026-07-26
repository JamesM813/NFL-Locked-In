import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { profileData } from "@/utils/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, X, Pencil, Check } from "lucide-react"
import { AvatarPicker } from "@/components/AvatarPicker"
import { toast } from "react-hot-toast"

const PRESET_AVATAR_URLS = [1, 2, 3, 4, 5, 6, 7].map((i) =>
  supabase
    .storage
    .from("preset-avatars")
    .getPublicUrl(`avatar-${i}.png`).data.publicUrl
)

export default function Profile() {
  const [userData, setUserData] = useState<profileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [newUsername, setNewUsername] = useState("")

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('profiles')
          .select(`*`)
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setUserData({
            id: user.id,
            email: user.email || '',
            username: data.username,
            profile_picture_url: data.profile_picture_url,
          })
          setNewUsername(data.username || '')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  const handleUsernameSave = async () => {
    if (!userData || !newUsername.trim()) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.trim() })
        .eq('id', userData.id)

      if (error) throw error

      setUserData(prev => prev ? { ...prev, username: newUsername.trim() } : prev)
      setIsEditingUsername(false)
    } catch (err) {
      console.error("Error updating username:", err)
      toast.error("Failed to update username. Please try again.")
    }
  }

  const handleUsernameCancel = () => {
    setNewUsername(userData?.username || "")
    setIsEditingUsername(false)
  }

  const handleUsernameEdit = () => {
    setNewUsername(userData?.username || "")
    setIsEditingUsername(true)
  }

  const uploadAvatar = async (file: File) => {
    if (!userData) return

    const fileExt = file.name.split('.').pop()
    const filePath = `${userData.id}-${Math.random()}.${fileExt}`

    try {
      setUploading(true)
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      if (!publicUrl) throw new Error("No public URL")

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userData.id)

      if (updateError) throw updateError

      setUserData(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null)
    } catch (e) {
      toast.error("Error uploading image")
      console.error(e)
    } finally {
      setUploading(false)
      setIsModalOpen(false)
    }
  }

  const handlePresetClick = async (presetUrl: string) => {
    if (!userData) return

    const { error } = await supabase
      .from('profiles')
      .update({ profile_picture_url: presetUrl })
      .eq('id', userData.id)

    if (!error) setUserData(prev => prev ? { ...prev, profile_picture_url: presetUrl } : null)
    setIsModalOpen(false)
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center text-white">Loading profile...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="relative backdrop-blur-sm bg-white/10 shadow-2xl border-0 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Profile</CardTitle>
            <CardDescription className="text-gray-300">Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="flex flex-col items-center mb-6">
              <div
                className="relative group w-32 h-32 mb-2 cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              >
                <img
                  src={userData?.profile_picture_url || 'default-avatar.png'}
                  alt="Profile picture"
                  className="w-full h-full rounded-full border-2 border-white object-cover shadow-md"
                />
                <div className="absolute inset-0 w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {uploading ? (
                    <p className="text-sm">Uploading...</p>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-white mb-1" />
                      <p className="text-xs font-semibold">Change</p>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={() => setIsModalOpen(true)}>
                Click to change
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Email:</p>
                <p className="text-lg break-all">{userData?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Username:</p>
                <div className="flex items-center gap-3">
                  {isEditingUsername ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="flex-1 text-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                        placeholder="Enter username"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUsernameSave()
                          if (e.key === 'Escape') handleUsernameCancel()
                        }}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleUsernameSave}
                          className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 hover:border-green-500/50 text-green-400 hover:text-green-300 transition-all duration-200 backdrop-blur-sm"
                          aria-label="Save username"
                          disabled={!newUsername.trim() || newUsername.trim() === userData?.username}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleUsernameCancel}
                          className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all duration-200 backdrop-blur-sm"
                          aria-label="Cancel edit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                    <p className="text-lg">{userData?.username}</p>
                    <button
                      onClick={handleUsernameEdit}
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 opacity-60 group-hover:opacity-100"
                      aria-label="Edit username"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AvatarPicker
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentAvatarUrl={userData?.profile_picture_url}
        fallbackAvatarUrl="default-avatar.png"
        presetAvatars={PRESET_AVATAR_URLS}
        uploading={uploading}
        onSelectPreset={handlePresetClick}
        onUploadFile={uploadAvatar}
      />
    </div>
  )
}
