import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  initialSettings: { groupName: string; isPublic: boolean };
  onClose: () => void;
  onSubmit: (settings: { groupName: string; isPublic: boolean }) => Promise<boolean>;
  onDeleteGroup?: () => void;
}

export function SettingsModal({
  isOpen,
  isSubmitting,
  initialSettings,
  onClose,
  onSubmit,
  onDeleteGroup
}: SettingsModalProps) {
  const [form, setForm] = useState(initialSettings);
  const [isPublic, setIsPublic] = useState(initialSettings.isPublic);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setForm(initialSettings);
    setIsPublic(initialSettings.isPublic);
  }, [initialSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit({ ...form, isPublic });
    if (success) {
      onClose();
    }
  };

  const handleClose = () => {
    setForm(initialSettings);
    setIsPublic(initialSettings.isPublic);
    setShowDeleteConfirmation(false);
    setDeleteConfirmationText("");
    onClose();
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Group Settings</h2>
        </div>

        {!showDeleteConfirmation ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={form.groupName}
                  onChange={(e) => setForm(prev => ({ ...prev, groupName: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter group name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Privacy Settings
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setIsPublic(!isPublic)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isPublic ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                          isPublic ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-3 text-sm text-gray-300">
                      {isPublic ? "Click to make the group private" : "Click to make the group public"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !form.groupName.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>

            {onDeleteGroup && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
                  <p className="text-sm text-gray-400">
                    Once you delete this group, there is no going back. This action cannot be undone.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all"
                  >
                    Delete Group
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400">Delete Group</h3>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">
                Are you sure you want to delete <strong>{form.groupName}</strong>?
              </p>
              
              <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-xl">
                <p className="text-red-200 text-sm font-medium mb-2">⚠️ This action is permanent</p>
                <ul className="text-red-200 text-sm space-y-1">
                  <li>• All group data and history will be permanently deleted</li>
                  <li>• All member picks and standings will be lost</li>
                  <li>• This cannot be undone</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type <span className="font-bold text-red-400">DELETE GROUP</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE GROUP"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteConfirmationText("");
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={!isDeleteConfirmationValid || isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete Group"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}