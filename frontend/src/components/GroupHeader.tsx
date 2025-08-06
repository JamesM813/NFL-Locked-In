interface GroupHeaderProps {
  groupName: string;
  groupSize: number;
  groupId: string;
  groupPictureURL: string;
  onChangeSettings: () => void;
  onInviteMembers: () => void;
  onLeaveGroup: () => void;
}

export function GroupHeader({
  groupName,
  groupSize,
  groupId,
  groupPictureURL,
  onChangeSettings,
  onInviteMembers,
  onLeaveGroup
}: GroupHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-center space-x-4">
        <img
          src={groupPictureURL}
          alt={`${groupName} avatar`}
          className="w-16 h-16 rounded-full border-2 border-white/20 object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold">{groupName}</h1>
          <p className="text-gray-400 text-sm">Group Members: {groupSize}/10</p>
          <p className="text-gray-400 text-sm">Group ID: {groupId}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all text-sm md:text-base"
          onClick={onChangeSettings}
        >
          Group Settings
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all text-sm md:text-base"
          onClick={onInviteMembers}
        >
          Invite Members
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl transition-all text-sm md:text-base"
          onClick={onLeaveGroup}
        >
          Leave Group
        </button>
      </div>
    </header>
  );
}