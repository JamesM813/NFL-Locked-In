interface LeaveGroupModalProps {
  isOpen: boolean;
  isLeaving: boolean;
  groupName: string;
  confirmationText: string;
  onConfirmationChange: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export function LeaveGroupModal({
  isOpen,
  isLeaving,
  groupName,
  confirmationText,
  onConfirmationChange,
  onClose,
  onConfirm
}: LeaveGroupModalProps) {
  const isConfirmationValid = confirmationText === "LEAVE GROUP";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">Leave Group</h2>
        </div>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            Are you sure you want to leave <strong>{groupName}</strong>?
          </p>
          
          <div className="bg-red-600/20 border border-red-600/30 p-4 rounded-xl">
            <p className="text-red-200 text-sm font-medium mb-2">⚠️ This action is permanent</p>
            <ul className="text-red-200 text-sm space-y-1">
              <li>• You will lose access to all group data and history</li>
              <li>• You cannot rejoin without a new invitation</li>
              <li>• All your selections and standings will be removed</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type <span className="font-bold text-red-400">LEAVE GROUP</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => onConfirmationChange(e.target.value)}
              placeholder="LEAVE GROUP"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLeaving}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmationValid || isLeaving}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLeaving ? "Leaving..." : "Leave Group"}
          </button>
        </div>
      </div>
    </div>
  );
}