import React from 'react';
import { SelectionCard } from './SelectionCard';
import type { Selection, NFLTeam } from '@/utils/types';

interface SelectionsListProps {
  selections: Selection[];
  nflTeams: NFLTeam[];
  showTeamSelector: { [key: number]: boolean };
  onToggleTeamSelector: (week: number) => void;
  onTeamSelection: (week: number, teamId: string | null) => Promise<void>;
  getStatusIcon: (status: 'win' | 'loss' | 'pending') => React.ReactNode;
  getSelectedTeam: (teamId: string | null) => NFLTeam | null;
}

export function SelectionsList({
  selections,
  nflTeams,
  showTeamSelector,
  onToggleTeamSelector,
  onTeamSelection,
  getStatusIcon,
  getSelectedTeam
}: SelectionsListProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-2xl border border-white/10 shadow-2xl">
      <h2 className="text-xl font-semibold mb-4">Selections</h2>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {selections.map((selection) => {
          const selectedTeam = getSelectedTeam(selection.teamId);
          const isExpanded = showTeamSelector[selection.week] || false;
          
          return (
            <SelectionCard
              key={selection.week}
              selection={selection}
              selectedTeam={selectedTeam}
              nflTeams={nflTeams}
              showTeamSelector={isExpanded}
              onToggleTeamSelector={onToggleTeamSelector}
              onTeamSelection={onTeamSelection}
              getStatusIcon={getStatusIcon}
            />
          );
        })}
      </div>
    </div>
  );
}