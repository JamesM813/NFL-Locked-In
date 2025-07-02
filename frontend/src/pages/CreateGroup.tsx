import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useGroup } from "@/context/GroupContext";


export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [allowInvites, setAllowInvites] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const groupContext = useGroup()
  if (!groupContext) { throw new Error("useGroup must be used within a GroupProvider")}
  const { refetchGroups } = groupContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return; // Prevent submission if name is empty
    setIsLoading(true);
  
    try {
      // 1. Get user data once and reuse it
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found. Please log in again.");
  
      let profilePictureUrl: string | null = null;
  
      if (profilePicture) {
        // 2. Check if the file is a preset (size is 0) or a real upload
        const isPreset = profilePicture.size === 0;
  
        if (isPreset) {
          // 3. If it's a preset, just use its name (which is the path)
          profilePictureUrl = profilePicture.name;
        } else {
          // 4. If it's a real file, upload it to Supabase Storage
          const fileExt = profilePicture.name.split('.').pop();
          // Use crypto.randomUUID() for a more robust unique file name
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('group-avatars')
            .upload(fileName, profilePicture);
  
          if (uploadError) {
            throw uploadError;
          }
  
          const { data: { publicUrl } } = supabase.storage
            .from('group-avatars')
            .getPublicUrl(fileName);
            
          profilePictureUrl = publicUrl;
        }
      }
  
      const session = await supabase.auth.getSession();
      console.log("Session user ID (auth.uid()):", session.data.session?.user.id);
      console.log("User ID used in insert (admin_id):", user.id);

      // Insert group data into the 'groups' table
      const { data: groupData, error: groupUploadError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          group_picture_url: profilePictureUrl ?? 'https://b.fssta.com/uploads/application/nfl/headshots/327798.vresize.350.350.medium.7.png',
          allow_invites: allowInvites,
          admin_id: user.id // Reuse user object
        })
        .select()
        .single();
  
      if (groupUploadError) {
        throw groupUploadError;
      }
  
      // Add the admin user to the 'profile_groups' junction table
      const { error: profileGroupUploadError } = await supabase
        .from('profile_groups')
        .insert({
          user_id: user.id, // Reuse user object
          group_id: groupData.id,
          is_admin: true
        });
  
      if (profileGroupUploadError) {
        throw profileGroupUploadError;
      }
      await refetchGroups()
      navigate('/groups');
  
    } catch (error) {
      console.error('Error creating group:', error);
      // Optionally, show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-lg mx-auto bg-white/5 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
        <h1 className="text-3xl font-light mb-8 text-center tracking-tight">Create Group</h1>
        
        <div className="space-y-8">
          {/* Group Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
              placeholder="Enter group name"
            />
          </div>

          {/* Profile Picture Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Profile Picture
            </label>
            <div className="grid grid-cols-4 gap-4">
              {/* Preset Images */}
              {[1, 2, 3].map((i) => {
                const presetUrl = `/preset-group-avatars/avatar-${i}.png`; // update paths if needed
                return (
                  <div
                    key={i}
                    onClick={() => {
                      setProfilePicture(null);
                      // Set the URL directly so you can upload it later as needed
                      (document.getElementById("custom-file") as HTMLInputElement).value = "";
                      (setProfilePicture as any)(new File([], presetUrl)); // Fake File for logic
                    }}
                    className={`w-20 h-20 rounded-full cursor-pointer border-4 ${
                      profilePicture?.name === presetUrl ? "border-blue-500" : "border-transparent"
                    } overflow-hidden ring-1 ring-white/10 hover:ring-white/30 transition-all`}
                  >
                    <img src={presetUrl} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                  </div>
                );
              })}

              {/* Custom Upload Circle */}
              <label className="w-20 h-20 rounded-full cursor-pointer bg-white/5 hover:bg-white/10 flex items-center justify-center border-2 border-dashed border-white/20">
                <input
                  id="custom-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </label>
            </div>
            {profilePicture && profilePicture.name && !profilePicture.name.startsWith("/preset-avatars/") && (
              <p className="text-xs text-gray-500 mt-2">{profilePicture.name}</p>
            )}
          </div>

          {/* Settings with Apple-style toggles */}
          <div className="space-y-6">
            

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-300">
                  Allow Invites
                </div>
                <p className="text-xs text-gray-500">Members can invite others</p>
              </div>
              <button
                type="button"
                onClick={() => setAllowInvites(!allowInvites)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                  allowInvites ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                    allowInvites ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !groupName.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/groups')}
              disabled={isLoading}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}