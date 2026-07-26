import { useNFLSchedule } from './useNFLSchedule';
import { useGroupMembers } from './useGroupMembers';
import { useUserSelections } from './useUserSelections';

export function useGroupData(groupId: string, season: number, userId?: string) {
  const { nflTeams, getAvailableTeamsForUserWeek } = useNFLSchedule(season);
  const { loading, groupMembers, fetchGroupMembers } = useGroupMembers(groupId);
  const {
    selections,
    setSelections,
    groupSelections,
    fetchUserSelections,
    fetchGroupSelections
  } = useUserSelections(groupId, season, userId, groupMembers);

  return {
    loading,
    groupMembers,
    nflTeams,
    selections,
    groupSelections,
    setSelections,
    fetchGroupMembers,
    fetchUserSelections,
    fetchGroupSelections,
    getAvailableTeamsForUserWeek
  };
}
