import { supabase } from "@/lib/supabase"
import type { userData } from "@/utils/types"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera } from "lucide-react"

export default function Profile() {
  const [userData, setUserData] = useState<userData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('No user found')
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select(`*`)
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching user data:', error)
        } else if (data) {
          const profileData: userData = {
            id: user.id,
            email: user.email || '',
            username: data.username,
            profile_picture_url: data.profile_picture_url
          }
          setUserData(profileData)
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  const handlePictureClick = () => {
    if (!uploading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !userData) {
      return
    }

    const file = event.target.files[0]
    const fileExt = file.name.split('.').pop()
    const filePath = `${userData.id}-${Math.random()}.${fileExt}`

    try {
      setUploading(true)
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      
      if (!publicUrl) {
          throw new Error("Could not get public URL for the uploaded file.")
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', userData.id)

      if (updateError) {
        throw updateError
      }
      
      setUserData(prevData => prevData ? { ...prevData, profile_picture_url: publicUrl } : null)

    } catch (error) {
      console.error('Error uploading profile picture:', error)
      alert('Error uploading profile picture. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
        <p className="text-white">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="relative backdrop-blur-sm bg-white/10 shadow-2xl border-0 text-white">
          <CardHeader>
            <div
              className="group absolute top-0 right-0 mt-4 mr-4 w-32 h-32 rounded-full cursor-pointer"
              onClick={handlePictureClick}
            >
              <img
                src={userData?.profile_picture_url || 'default-avatar.png'}
                alt="Profile picture"
                className="w-full h-full rounded-full border-2 border-white object-cover shadow-md"
              />
              <div
                className="absolute inset-0 w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                {uploading ? (
                   <p className="text-sm">Uploading...</p>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-white mb-1" />
                    <p className="text-xs font-semibold">Change</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
            
            <CardTitle className="text-2xl">Profile</CardTitle>
            <CardDescription className="text-gray-300">Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-16 md:pt-4">
            {userData ? (
              <>
                <div>
                  <p className="text-sm text-gray-400">Email:</p>
                  <p className="text-lg">{userData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Username:</p>
                  <p className="text-lg">{userData.username}</p>
                </div>
              </>
            ) : (
              <p className="text-red-400">No user data found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}