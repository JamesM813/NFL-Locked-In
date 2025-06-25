import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";


export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [allowInvites, setAllowInvites] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    console.log('Auth user ID:', user?.id);


    try {
      let profilePictureUrl = null;

      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('group-avatars') // You'll need to create this bucket
          .upload(fileName, profilePicture);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('group-avatars')
          .getPublicUrl(fileName);
          
        profilePictureUrl = publicUrl;
      }

      const { data: groupData, error: groupUploadError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          group_picture_url: profilePictureUrl,
          allow_invites: allowInvites,
          admin_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (groupUploadError) {
        throw groupUploadError;
      }
      console.log('Group created successfully:', groupData);

      const { data, error } = await supabase
      .from('profile_groups')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        group_id: groupData.id,
        is_admin: true
      })
      navigate('/groups')
      
    } catch (error) {
  
      console.error('Error creating group:', error );

    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setProfilePicture(e.dataTransfer.files[0]);
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

          {/* Profile Picture Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Profile Picture
            </label>
            <div
              className={`relative w-full h-32 rounded-xl border-2 border-dashed transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-white/20 hover:border-white/30'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                {profilePicture ? (
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-green-400">{profilePicture.name}</p>
                    <p className="text-xs text-gray-500">Click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-white/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-sm">Drop image here or click to browse</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
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