import React, { useState, useEffect, useRef } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  initialSettings: { 
    groupName: string; 
    isPublic: boolean;
    profilePictureUrl?: string;
  };
  onClose: () => void;
  onSubmit: (settings: { 
    groupName: string; 
    isPublic: boolean; 
    profilePictureUrl?: string;
  }) => Promise<boolean>;
  onDeleteGroup?: () => void;
  onUploadProfilePicture?: (file: File) => Promise<string>;
  onSelectPresetAvatar?: (presetUrl: string) => Promise<void>;
  presetAvatars?: string[];
}

export function SettingsModal({
  isOpen,
  isSubmitting,
  initialSettings,
  onClose,
  onSubmit,
  onDeleteGroup,
  onUploadProfilePicture,
  onSelectPresetAvatar,
  presetAvatars = []
}: SettingsModalProps) {
  const [form, setForm] = useState(initialSettings);
  const [isPublic, setIsPublic] = useState(initialSettings.isPublic);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(initialSettings);
    setIsPublic(initialSettings.isPublic);
  }, [initialSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit({ 
      ...form, 
      isPublic,
      profilePictureUrl: form.profilePictureUrl 
    });
    if (success) {
      onClose();
    }
  };

  const handleClose = () => {
    setForm(initialSettings);
    setIsPublic(initialSettings.isPublic);
    setShowDeleteConfirmation(false);
    setDeleteConfirmationText("");
    setShowAvatarModal(false);
    setSelectedAvatar(null);
    onClose();
  };

  const uploadAvatar = async (file: File) => {
    if (!onUploadProfilePicture) return;

    try {
      setUploadingAvatar(true);
      const newAvatarUrl = await onUploadProfilePicture(file);
      setForm(prev => ({ ...prev, profilePictureUrl: newAvatarUrl }));
      setSelectedAvatar(newAvatarUrl);
    } catch (e) {
      alert("Error uploading image");
      console.error(e);
    } finally {
      setUploadingAvatar(false);
      setShowAvatarModal(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAvatar(e.target.files[0]);
    }
  };

  const handlePresetClick = async (presetUrl: string) => {
    if (onSelectPresetAvatar) {
      try {
        setUploadingAvatar(true);
        await onSelectPresetAvatar(presetUrl);
        setForm(prev => ({ ...prev, profilePictureUrl: presetUrl }));
        setSelectedAvatar(presetUrl);
      } catch (error) {
        console.error('Failed to update preset avatar:', error);
        alert("Error updating avatar");
      } finally {
        setUploadingAvatar(false);
        setShowAvatarModal(false);
      }
    } else {
      // Fallback - just update form state (will be saved when user clicks "Save Settings")
      setForm(prev => ({ ...prev, profilePictureUrl: presetUrl }));
      setSelectedAvatar(presetUrl);
      setShowAvatarModal(false);
    }
  };

  const openAvatarModal = () => {
    setSelectedAvatar(form.profilePictureUrl || null);
    setShowAvatarModal(true);
  };

  const handleDeleteGroup = async () => {
    if (deleteConfirmationText !== "DELETE GROUP" || !onDeleteGroup) return;
    
    setIsDeleting(true);
    try {
      await onDeleteGroup();
      handleClose();
    } catch (error) {
      console.error("Failed to delete group:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeleteConfirmationValid = deleteConfirmationText === "DELETE GROUP";

  if (!isOpen) return null;

  if (showAvatarModal) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl border border-white/10 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h3 className="text-white text-xl md:text-2xl font-light tracking-tight">
              Choose Avatar
            </h3>
            <button
              onClick={() => setShowAvatarModal(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 md:p-2 rounded-full hover:bg-white/10"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center mb-6 md:mb-8">
            <div className="relative">
              <img
                src={selectedAvatar || form.profilePictureUrl || '/default-group-avatar.png'}
                alt="Current avatar"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 object-cover shadow-xl"
              />
              <div className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>

          <div className="space-y-3 md:space-y-4">
            {presetAvatars.length > 0 && (
              <div className="grid grid-cols-4 gap-3 md:gap-4">
                {presetAvatars.map((presetUrl, i) => {
                  const isSelected = selectedAvatar === presetUrl || form.profilePictureUrl === presetUrl;
                  return (
                    <div
                      key={i}
                      onClick={() => handlePresetClick(presetUrl)}
                      className={`relative w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl cursor-pointer overflow-hidden group transition-all duration-300 hover:scale-105 ${
                        isSelected 
                          ? "ring-3 md:ring-4 ring-blue-500 shadow-lg shadow-blue-500/25" 
                          : "ring-1 md:ring-2 ring-white/10 hover:ring-white/30"
                      }`}
                    >
                      <img 
                        src={presetUrl} 
                        alt={`Avatar ${i + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  );
                })}
              </div>
            )}

            {onUploadProfilePicture && (
              <div className="flex justify-center">
                <label className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl cursor-pointer bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 flex flex-col items-center justify-center border-2 border-dashed border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {uploadingAvatar ? (
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1"></div>
                      <span className="text-xs text-white/70">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="w-6 h-6 md:w-8 md:h-8 text-white/70 group-hover:text-white transition-colors mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-white/70 group-hover:text-white transition-colors">Upload</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl md:rounded-2xl"></div>
                </label>
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10">
            <p className="text-center text-xs md:text-sm text-gray-400">
              {presetAvatars.length > 0 ? "Choose from presets or upload your own image" : "Upload a custom image for your group"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl border border-white/10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-light tracking-tight text-white">
              {showDeleteConfirmation ? 'Delete Group' : 'Group Settings'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 md:p-2 rounded-full hover:bg-white/10"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!showDeleteConfirmation ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Group Picture
                </label>
                <div className="flex flex-col items-center mb-6">
                  <div 
                    className="relative group w-24 h-24 md:w-32 md:h-32 mb-3 cursor-pointer"
                    onClick={openAvatarModal}
                  >
                    <img
                      src={form.profilePictureUrl || '/default-group-avatar.png'}
                      alt="Group picture"
                      className="w-full h-full rounded-full border-2 border-white/20 object-cover shadow-md"
                    />
                    <div className="absolute inset-0 w-full h-full rounded-full bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {uploadingAvatar ? (
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1"></div>
                          <p className="text-xs text-white">Uploading...</p>
                        </div>
                      ) : (
                        <>
                          <svg className="w-6 h-6 md:w-8 md:h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-xs font-semibold text-white">Change</p>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors" onClick={openAvatarModal}>
                    Click to change group picture
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Group Name
                </label>
                <input
                  type="text"
                  value={form.groupName}
                  onChange={(e) => setForm(prev => ({ ...prev, groupName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  placeholder="Enter group name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Privacy Settings
                </label>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-white/10">
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isPublic ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <span className="text-white font-medium">
                          {isPublic ? "Public Group" : "Private Group"}
                        </span>
                        <p className="text-sm text-gray-400">
                          {isPublic ? "Anyone can find and join this group" : "Only invited members can join"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPublic(!isPublic)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isPublic 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' 
                          : 'bg-gray-600/50 backdrop-blur-sm'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out ${
                          isPublic ? 'translate-x-6 shadow-blue-500/25' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !form.groupName.trim()}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-blue-500/40"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    "Save Settings"
                  )}
                </button>
              </div>
            </form>

            {onDeleteGroup && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">
                    Once you delete this group, there is no going back. This action cannot be undone.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 hover:shadow-red-500/40"
                  >
                    Delete Group
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-lg text-gray-300">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-white bg-white/10 px-2 py-1 rounded backdrop-blur-sm">
                  {form.groupName}
                </span>
                ?
              </p>
            </div>

            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-300 font-medium">This action is permanent</p>
              </div>
              <ul className="text-red-200 text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  All group data and history will be permanently deleted
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  All member picks and standings will be lost
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  This cannot be undone
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Type{" "}
                <span className="font-bold text-red-400 bg-red-500/20 px-2 py-1 rounded backdrop-blur-sm">
                  DELETE GROUP
                </span>{" "}
                to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE GROUP"
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-red-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteConfirmationText("");
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={!isDeleteConfirmationValid || isDeleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-red-500/40"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  "Delete Group"
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10">
          <p className="text-center text-xs md:text-sm text-gray-400">
            {showDeleteConfirmation 
              ? "This action cannot be undone" 
              : "Saved changes will take effect immediately."
            }
          </p>
        </div>
      </div>
    </div>
  );
}