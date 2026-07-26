import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

interface AvatarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  fallbackAvatarUrl: string;
  presetAvatars: string[];
  uploading: boolean;
  onSelectPreset: (presetUrl: string) => void | Promise<void>;
  onUploadFile?: (file: File) => void | Promise<void>;
}

// Shared avatar chooser modal (presets grid + optional upload tile), used for
// both profile avatars (Profile page) and group avatars (SettingsModal).
export function AvatarPicker({
  isOpen,
  onClose,
  currentAvatarUrl,
  fallbackAvatarUrl,
  presetAvatars,
  uploading,
  onSelectPreset,
  onUploadFile
}: AvatarPickerProps) {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handlePresetClick = (presetUrl: string) => {
    setSelectedAvatar(presetUrl);
    onSelectPreset(presetUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadFile) {
      onUploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl border border-white/10 w-full max-w-md mx-4 transform transition-all duration-300 scale-100">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <h3 className="text-white text-xl md:text-2xl font-light tracking-tight">
            Choose Avatar
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 md:p-2 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex justify-center mb-6 md:mb-8">
          <div className="relative">
            <img
              src={selectedAvatar || currentAvatarUrl || fallbackAvatarUrl}
              alt="Current avatar"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 object-cover shadow-xl"
            />
            <div className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          {(presetAvatars.length > 0 || onUploadFile) && (
            <div className="grid grid-cols-4 gap-3 md:gap-4">
              {presetAvatars.map((presetUrl, i) => {
                const isSelected = selectedAvatar === presetUrl || currentAvatarUrl === presetUrl;
                return (
                  <div
                    key={presetUrl}
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
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                );
              })}

              {onUploadFile && (
                <label className="relative w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl cursor-pointer bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 flex flex-col items-center justify-center border-2 border-dashed border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1"></div>
                      <span className="text-xs text-white/70">Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-4 h-4 md:w-6 md:h-6 text-white/70 group-hover:text-white transition-colors mb-1" />
                      <span className="text-xs text-white/70 group-hover:text-white transition-colors">Upload</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl md:rounded-2xl"></div>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10">
          <p className="text-center text-xs md:text-sm text-gray-400">
            {onUploadFile
              ? "Choose from presets or upload your own image"
              : "Choose an avatar from the presets"}
          </p>
        </div>
      </div>
    </div>
  );
}
