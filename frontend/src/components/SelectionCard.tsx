import React from 'react';
import type { Selection, NFLTeam } from '@/utils/types';

interface SelectionCardProps {
  selection: Selection;
  currentWeek: number;
  selectedTeam: NFLTeam | null;
  nflTeams: NFLTeam[];
  showTeamSelector: boolean;
  onToggleTeamSelector: (week: number) => void;
  onTeamSelection: (week: number, teamId: string | null) => Promise<void>;
  getStatusIcon: (status: 'win' | 'loss' | 'pending') => React.ReactNode;
}

export function SelectionCard({
  selection,
  currentWeek,
  selectedTeam,
  nflTeams,
  showTeamSelector,
  onToggleTeamSelector,
  onTeamSelection,
  getStatusIcon
}: SelectionCardProps) {

  
  const isLocked = currentWeek > selection.week || 
    (selection.locks_at !== null && new Date(selection.locks_at) < new Date());
  
  return (
    <div className={`bg-white/10 p-4 rounded-xl border border-white/20 ${
      isLocked ? 'opacity-75' : ''
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 text-center">
            <p className="text-sm font-medium text-gray-300">Week</p>
            <p className="text-lg font-bold">{selection.week}</p>
            {isLocked && (
              <div className="flex justify-center mt-1">
                <svg className="w-3 h-3 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"/>
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-grow">
            {selectedTeam ? (
              <div className="flex items-center gap-3">
                <img 
                  src={selectedTeam.logo_url} 
                  alt={selectedTeam.name} 
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
                <div className="flex-grow">
                  <p className="font-semibold text-sm md:text-base">{selectedTeam.name}</p>
                  {isLocked && (
                    <p className="text-xs text-yellow-400">Selection Locked</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {!isLocked ? (
                  <>
                    <button
                      className="w-8 h-8 md:w-10 md:h-10 bg-gray-600 rounded-full flex items-center justify-center relative group"
                      onClick={() => onToggleTeamSelector(selection.week)}
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                      </svg>
                      <span className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform"></span>
                    </button>
                    <p className="text-gray-400 text-sm md:text-base">Select Team</p>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm md:text-base">No Selection Made</p>
                      <p className="text-xs text-gray-600">Selection Period Ended</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-300">Result</p>
              {getStatusIcon(selection.status)}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-300">Points</p>
              <p className="font-mono text-sm">{selection.score}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isLocked ? (
              <>
                <button
                  onClick={() => onToggleTeamSelector(selection.week)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  title="Edit Selection"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                {selectedTeam && (
                  <button
                    onClick={() => onTeamSelection(selection.week, null)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    title="Clear Selection"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </>
            ) : (
              <div className="p-2 bg-gray-700 rounded-lg cursor-not-allowed" title="Selection Locked">
                <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"/>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-300">Result:</span>
          {getStatusIcon(selection.status)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-300">Score:</span>
          <span className="font-mono">{selection.score}</span>
        </div>
      </div>

      {/* Only show team selector if not locked */}
      {showTeamSelector && !isLocked && (
        <div className="mt-4 border-t border-white/20 pt-4">
          {nflTeams.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-400 text-sm">No teams available for selection</p>
              <p className="text-gray-500 text-xs">Games may have started or team is on bye</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {nflTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => onTeamSelection(selection.week, team.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedTeam?.id === team.id
                      ? 'bg-blue-600/30 border border-blue-500'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <img 
                    src={team.logo_url} 
                    alt={team.name} 
                    className="w-8 h-8 object-contain"
                  />
                  <span className="font-medium text-sm">{team.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show locked message if team selector is attempted on locked selection */}
      {showTeamSelector && isLocked && (
        <div className="mt-4 border-t border-white/20 pt-4">
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z"/>
              </svg>
            </div>
            <p className="text-yellow-400 text-sm font-medium">Selection Locked</p>
            <p className="text-gray-500 text-xs mt-1">
              {currentWeek > selection.week 
                ? "This week has already passed" 
                : "The selection deadline has ended"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}