import type { GroupMember, Selection } from '@/utils/types';

// Sums each member's selection scores for the standings table. Selections
// with no score yet (score === '-') count as 0.
export function calculateMemberScores(
  groupMembers: GroupMember[],
  groupSelections: { [userId: string]: Selection[] }
): { [userId: string]: number } {
  const scores: { [key: string]: number } = {};

  if (Array.isArray(groupMembers)) {
    groupMembers.forEach(member => {
      scores[member.user_id] = 0;
    });
  }

  if (groupSelections && typeof groupSelections === 'object') {
    Object.entries(groupSelections).forEach(([userId, userSelections]) => {
      if (Array.isArray(userSelections)) {
        userSelections.forEach(selection => {
          scores[userId] = (scores[userId] || 0) + (Number(selection.score) || 0);
        });
      }
    });
  }

  return scores;
}
