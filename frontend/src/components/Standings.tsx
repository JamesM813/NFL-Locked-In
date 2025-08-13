import type { GroupMember } from '@/utils/types';

interface StandingsProps {
  loading: boolean;
  groupMembers: GroupMember[];
  memberScores?: { [key: string]: number };
}

export function Standings({ loading, groupMembers, memberScores = {} }: StandingsProps) {
  // Sort members by score (highest first)
  const sortedMembers = [...groupMembers].sort((a, b) => {
    const scoreA = memberScores[a.user_id] || 0;
    const scoreB = memberScores[b.user_id] || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
      <h2 className="text-xl font-semibold mb-4">Standings</h2>
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading members...</p>
        ) : groupMembers.length === 0 ? (
          <p className="text-gray-400 text-sm">No members found in this group.</p>
        ) : (
          <ul className="grid gap-4">
            {sortedMembers.map((member, index) => (
              <li
                key={member.user_id}
                className="bg-white/10 p-4 rounded-xl flex items-center gap-4"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full text-sm font-bold">
                  {index + 1}
                </div>
                <img
                  src={member.profiles.profile_picture_url}
                  alt={member.profiles.username}
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                />
                <div className="flex-1">
                  <p className="font-semibold">{member.profiles.username}</p>
                  {member.is_admin && (
                    <p className="text-sm text-yellow-400">Admin</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{memberScores[member.user_id] || 0}</p>
                  <p className="text-xs text-gray-400">Score</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}