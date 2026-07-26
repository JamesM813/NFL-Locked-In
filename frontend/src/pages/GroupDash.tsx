import { supabase } from "@/lib/supabase";
import { useGroupDashboard } from "@/hooks/useGroupDashboard";
import { GroupHeader } from "@/components/GroupHeader";
import { SelectionsList } from "@/components/SelectionsList";
import { Standings } from "@/components/Standings";
import { GroupPicks } from "@/components/GroupPicks";
import { SettingsModal } from "@/components/SettingsModal";
import { LeaveGroupModal } from "@/components/LeaveGroupModal";

const PRESET_GROUP_AVATARS = [1, 2, 3, 4].map((i) =>
  supabase
    .storage
    .from("preset-group-avatars")
    .getPublicUrl(`avatar-${i}.png`).data.publicUrl
);

const getStatusIcon = (status: 'correct' | 'incorrect' | 'pending') => {
  switch (status) {
    case 'correct':
      return (
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'incorrect':
      return (
        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
  }
};

export default function GroupDash() {
  const {
    userInGroupData,
    groupSize,
    currentWeek,
    viewingSeason,
    setViewingSeason,
    availableSeasons,
    isCurrentSeason,
    selectedWeek,
    setSelectedWeek,
    loading,
    groupMembers,
    selections,
    groupSelections,
    memberScores,
    getAvailableTeamsForUserWeek,
    getSelectedTeam,
    showTeamSelector,
    toggleTeamSelector,
    handleTeamSelection,
    settingsModal,
    isSubmittingSettings,
    handleChangeSettings,
    handleCloseSettings,
    handleSubmitSettings,
    handleSelectPresetAvatar,
    handleUploadProfilePicture,
    handleDeleteGroup,
    handleInviteMembersClick,
    leaveGroup,
    handleLeaveGroupClick,
    handleConfirmLeaveGroup,
    handleCloseLeaveModal,
    handleConfirmationTextChange
  } = useGroupDashboard();

  if (!userInGroupData) {
    return (
      <div className="p-6 text-white text-center">
        Group not found or you do not have access.
      </div>
    );
  }

  const group = userInGroupData.groups;
  const groupName = group.name;
  const groupPictureURL = group.group_picture_url || `https://placehold.co/80x80/1f2937/ffffff?text=${groupName.charAt(0)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black p-4 md:p-8 text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        <GroupHeader
          groupName={groupName}
          groupSize={groupSize}
          groupId={String(group.id)}
          groupPictureURL={groupPictureURL}
          onChangeSettings={handleChangeSettings}
          onInviteMembers={handleInviteMembersClick}
          onLeaveGroup={handleLeaveGroupClick}
        />

        {leaveGroup.message && (
          <div className="bg-blue-600/20 border border-blue-600/30 p-4 rounded-xl">
            <p className="text-blue-200">{leaveGroup.message}</p>
          </div>
        )}

        {availableSeasons.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-300">Season:</label>
            <select
              value={viewingSeason}
              onChange={(e) => setViewingSeason(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableSeasons.map((season) => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </div>
        )}

        {!isCurrentSeason && (
          <div className="bg-yellow-600/20 border border-yellow-600/30 p-4 rounded-xl">
            <p className="text-yellow-200">
              Viewing the {viewingSeason} season. Past seasons are read-only.
            </p>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SelectionsList
            selections={selections}
            currentWeek={currentWeek}
            getAvailableTeamsForUserWeek={getAvailableTeamsForUserWeek}
            showTeamSelector={showTeamSelector}
            onToggleTeamSelector={toggleTeamSelector}
            onTeamSelection={handleTeamSelection}
            getStatusIcon={getStatusIcon}
            getSelectedTeam={getSelectedTeam}
            readOnly={!isCurrentSeason}
          />

          <Standings
            loading={loading}
            groupMembers={groupMembers}
            memberScores={memberScores}
          />
        </section>

        <GroupPicks
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
          groupMembers={groupMembers}
          groupSelections={groupSelections}
          getSelectedTeam={getSelectedTeam}
          getStatusIcon={getStatusIcon}
          currentWeek={currentWeek}
        />

        <SettingsModal
          isOpen={settingsModal.isOpen}
          isSubmitting={isSubmittingSettings}
          initialSettings={settingsModal.form}
          onClose={handleCloseSettings}
          onSubmit={handleSubmitSettings}
          onSelectPresetAvatar={handleSelectPresetAvatar}
          onUploadProfilePicture={handleUploadProfilePicture}
          onDeleteGroup={userInGroupData?.is_admin ? handleDeleteGroup : undefined}
          presetAvatars={PRESET_GROUP_AVATARS}
        />

        <LeaveGroupModal
          isOpen={leaveGroup.isModalOpen}
          isLeaving={leaveGroup.isLeaving}
          groupName={groupName}
          confirmationText={leaveGroup.confirmationText}
          onConfirmationChange={handleConfirmationTextChange}
          onClose={handleCloseLeaveModal}
          onConfirm={handleConfirmLeaveGroup}
        />
      </div>
    </div>
  );
}
