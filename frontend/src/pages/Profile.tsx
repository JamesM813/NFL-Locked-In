// Modified Profile Page with Enhanced Modal Avatar Picker
import { useState, useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { profileData } from "@/utils/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, X, Upload, CheckCircle } from "lucide-react"
import { Dialog } from "@headlessui/react"

export default function Profile() {
  const [userData, setUserData] = useState<profileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        }
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

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
      alert("Error uploading image")
      console.error(e)
    } finally {
      setUploading(false)
      setIsModalOpen(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAvatar(e.target.files[0])
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

  const openModal = () => {
    setSelectedAvatar(userData?.profile_picture_url || null)
    setIsModalOpen(true)
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center text-white">Loading profile...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="relative backdrop-blur-sm bg-white/10 shadow-2xl border-0 text-white">
          <CardHeader>
            <div
              className="group absolute top-0 right-0 mt-4 mr-4 w-32 h-32 rounded-full cursor-pointer"
              onClick={openModal}
            >
              <img
                src={userData?.profile_picture_url || 'default-avatar.png'}
                alt="Profile picture"
                className="w-full h-full rounded-full border-2 border-white object-cover shadow-md"
              />
              <div className="absolute inset-0 w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {uploading ? <p className="text-sm">Uploading...</p> : <><Camera className="w-8 h-8 text-white mb-1" /><p className="text-xs font-semibold">Change</p></>}
              </div>
            </div>
            <CardTitle className="text-2xl">Profile</CardTitle>
            <CardDescription className="text-gray-300">Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-16 md:pt-4">
            <div>
              <p className="text-sm text-gray-400">Email:</p>
              <p className="text-lg">{userData?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Username:</p>
              <p className="text-lg">{userData?.username}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <Dialog.Title className="text-white text-2xl font-light tracking-tight">
                Choose Avatar
              </Dialog.Title>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Current Avatar Preview */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img
                  src={selectedAvatar || userData?.profile_picture_url || 'default-avatar.png'}
                  alt="Current avatar"
                  className="w-24 h-24 rounded-full border-4 border-white/20 object-cover shadow-xl"
                />
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            {/* Avatar Grid - 2 rows of 4 */}
            <div className="space-y-4">
              {/* First row */}
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => {
                  const presetUrl = supabase
                  .storage
                  .from("preset-avatars")
                  .getPublicUrl(`avatar-${i}.png`).data.publicUrl
                  const isSelected = selectedAvatar === presetUrl || userData?.profile_picture_url === presetUrl
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedAvatar(presetUrl)
                        handlePresetClick(presetUrl)
                      }}
                      className={`relative w-20 h-20 rounded-2xl cursor-pointer overflow-hidden group transition-all duration-300 hover:scale-105 ${
                        isSelected 
                          ? "ring-4 ring-blue-500 shadow-lg shadow-blue-500/25" 
                          : "ring-2 ring-white/10 hover:ring-white/30"
                      }`}
                    >
                      <img 
                        src={presetUrl} 
                        alt={`Avatar ${i}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                         
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )
                })}
              </div>

              {/* Second row */}
              <div className="grid grid-cols-4 gap-4">
                {[5, 6, 7].map((i) => {
                  const presetUrl = `/preset-avatars/avatar-${i}.png`
                  const isSelected = selectedAvatar === presetUrl || userData?.profile_picture_url === presetUrl
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedAvatar(presetUrl)
                        handlePresetClick(presetUrl)
                      }}
                      className={`relative w-20 h-20 rounded-2xl cursor-pointer overflow-hidden group transition-all duration-300 hover:scale-105 ${
                        isSelected 
                          ? "ring-4 ring-blue-500 shadow-lg shadow-blue-500/25" 
                          : "ring-2 ring-white/10 hover:ring-white/30"
                      }`}
                    >
                      <img 
                        src={presetUrl} 
                        alt={`Avatar ${i}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-blue-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )
                })}
                
                {/* Upload button in bottom right */}
                <label className="relative w-20 h-20 rounded-2xl cursor-pointer bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 flex flex-col items-center justify-center border-2 border-dashed border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1"></div>
                      <span className="text-xs text-white/70">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-6 h-6 text-white/70 group-hover:text-white transition-colors mb-1" />
                      <span className="text-xs text-white/70 group-hover:text-white transition-colors">Upload</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-gray-400">
                Choose from presets or upload your own image
              </p>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}