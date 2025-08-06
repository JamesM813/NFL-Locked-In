import React from 'react';
import type { Selection, NFLTeam } from '@/utils/types';

interface SelectionCardProps {
  selection: Selection;
  selectedTeam: NFLTeam | null;
  nflTeams: NFLTeam[];
  showTeamSelector: boolean;
  onToggleTeamSelector: (week: number) => void;
  onTeamSelection: (week: number, teamId: string | null) => Promise<void>;
  getStatusIcon: (status: 'win' | 'loss' | 'pending') => React.ReactNode;
}

export function SelectionCard({
  selection,
  selectedTeam,
  nflTeams,
  showTeamSelector,
  onToggleTeamSelector,
  onTeamSelection,
  getStatusIcon
}: SelectionCardProps) {
  return (
    <div className="bg-white/10 p-4 rounded-xl border border-white/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-12 text-center">
            <p className="text-sm font-medium text-gray-300">Week</p>
            <p className="text-lg font-bold">{selection.week}</p>
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
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
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
              <p className="text-xs text-gray-300">Score</p>
              <p className="font-mono text-sm">{selection.score}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onToggleTeamSelector(selection.week)}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            
            {selectedTeam && (
              <button
                onClick={() => onTeamSelection(selection.week, null)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
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

      {showTeamSelector && (
        <div className="mt-4 border-t border-white/20 pt-4">
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
        </div>
      )}
    </div>
  );
}