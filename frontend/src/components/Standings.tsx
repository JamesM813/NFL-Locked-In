import type { GroupMember } from '@/utils/types';

interface StandingsProps {
  loading: boolean;
  groupMembers: GroupMember[];
}

export function Standings({ loading, groupMembers }: StandingsProps) {
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
            {groupMembers.map((member) => (
              <li
                key={member.user_id}
                className="bg-white/10 p-4 rounded-xl flex items-center gap-4"
              >
                <img
                  src={member.profiles.profile_picture_url}
                  alt={member.profiles.username}
                  className="w-12 h-12 rounded-full object-cover border border-white/20"
                />
                <div>
                  <p className="font-semibold">{member.profiles.username}</p>
                  {member.is_admin && (
                    <p className="text-sm text-yellow-400">Admin</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}