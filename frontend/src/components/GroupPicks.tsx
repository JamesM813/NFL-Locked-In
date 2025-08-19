import React from 'react';
import type { GroupMember, NFLTeam, Selection } from '@/utils/types';

interface GroupPicksProps {
  selectedWeek: number;
  onWeekChange: (week: number) => void;
  groupMembers: GroupMember[];
  groupSelections: {[userId: string]: Selection[]};
  getSelectedTeam: (teamId: string | null) => NFLTeam | null;
  getStatusIcon: (status: 'win' | 'loss' | 'pending') => React.ReactNode;
}

export function GroupPicks({
  selectedWeek,
  onWeekChange,
  groupMembers,
  groupSelections,
  getSelectedTeam,
  getStatusIcon
}: GroupPicksProps) {
  return (
    <section className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
      <h2 className="text-xl font-semibold mb-4">Group Picks</h2>
      
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium text-gray-300">View Week:</label>
          <select 
            value={selectedWeek}
            onChange={(e) => onWeekChange(Number(e.target.value))}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 18 }, (_, i) => (
              <option key={i + 1} value={i + 1}>Week {i + 1}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {groupMembers.map((member) => {
              const memberSelections = groupSelections[member.user_id] || [];
              const memberWeekPick = memberSelections.find(s => s.week === selectedWeek);
              const selectedTeam = memberWeekPick?.teamId ? getSelectedTeam(memberWeekPick.teamId) : null;
              
              return (
                <div key={member.user_id} className="bg-white/10 p-4 rounded-xl border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={member.profiles.profile_picture_url}
                      alt={member.profiles.username}
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <div className="flex-grow">
                      <p className="font-semibold text-sm">{member.profiles.username}</p>
                      {member.is_admin && (
                        <p className="text-xs text-yellow-400">Admin</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-300"></p>
                      <p className="font-mono text-sm">{/* TODO: add record functionality eventually (record text above this line) */}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/20 pt-4">
                    <p className="text-xs text-gray-300 mb-2">Week {selectedWeek} Pick</p>
                      
                    {selectedTeam ? (
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <img 
                          src={selectedTeam.logo_url} 
                          alt={selectedTeam.name} 
                          className="w-8 h-8 object-contain"
                        />
                        <div className="flex-grow">
                          <p className="font-semibold text-sm">{selectedTeam.name}</p>
                        </div>
                        <div className="text-right">
                          {getStatusIcon(memberWeekPick?.status || 'pending')}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">No pick yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}