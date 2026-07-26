import type { NFLTeam, ScheduleGame, Selection } from '@/utils/types';

// A team is pickable for a given week when it has a game that week, the game
// hasn't locked yet, and the user hasn't already used the team in an earlier
// week. Selections are expected to be season-scoped by the caller.
export function getAvailableTeamsForWeek(
  nflTeams: NFLTeam[],
  nflSchedule: ScheduleGame[],
  week: number,
  userSelections: Selection[],
  now: Date = new Date()
): NFLTeam[] {
  const weekGames = nflSchedule.filter((game) => game.week === week);

  const usedTeamIds = userSelections
    .filter((sel) => sel.teamId !== null && sel.week < week)
    .map((sel) => sel.teamId);

  return nflTeams.filter((team) => {
    const teamGame = weekGames.find(
      (game) => game.home_team_id === team.id || game.away_team_id === team.id
    );
    if (!teamGame) return false;

    if (new Date(teamGame.locks_at) <= now) return false;

    if (usedTeamIds.includes(team.id)) return false;

    return true;
  });
}
