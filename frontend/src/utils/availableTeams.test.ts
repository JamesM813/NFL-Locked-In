import { describe, expect, it } from 'vitest';
import { getAvailableTeamsForWeek } from './availableTeams';
import type { NFLTeam, ScheduleGame, Selection } from './types';

const NOW = new Date('2025-09-10T12:00:00Z');
const FUTURE = '2025-09-14T16:30:00Z'; // locks after NOW
const PAST = '2025-09-07T16:30:00Z'; // locked before NOW

function team(id: string): NFLTeam {
  return { id, name: `Team ${id}`, logo_url: '' };
}

function game(week: number, home: string, away: string, locksAt: string): ScheduleGame {
  return { week, home_team_id: home, away_team_id: away, locks_at: locksAt };
}

function pick(week: number, teamId: string | null): Selection {
  return { week, teamId, status: 'pending', score: '-', locks_at: null };
}

const TEAMS = [team('A'), team('B'), team('C'), team('D'), team('E')];

describe('getAvailableTeamsForWeek', () => {
  it('returns both sides of an unlocked game', () => {
    const schedule = [game(1, 'A', 'B', FUTURE)];
    const result = getAvailableTeamsForWeek(TEAMS, schedule, 1, [], NOW);
    expect(result.map((t) => t.id)).toEqual(['A', 'B']);
  });

  it('excludes teams with no game that week (bye)', () => {
    const schedule = [game(1, 'A', 'B', FUTURE), game(2, 'C', 'D', FUTURE)];
    const result = getAvailableTeamsForWeek(TEAMS, schedule, 1, [], NOW);
    expect(result.map((t) => t.id)).not.toContain('C');
    expect(result.map((t) => t.id)).not.toContain('E');
  });

  it('excludes teams whose game has already locked', () => {
    const schedule = [game(1, 'A', 'B', FUTURE), game(1, 'C', 'D', PAST)];
    const result = getAvailableTeamsForWeek(TEAMS, schedule, 1, [], NOW);
    expect(result.map((t) => t.id)).toEqual(['A', 'B']);
  });

  it('excludes teams the user picked in earlier weeks', () => {
    const schedule = [game(2, 'A', 'B', FUTURE), game(2, 'C', 'D', FUTURE)];
    const selections = [pick(1, 'A')];
    const result = getAvailableTeamsForWeek(TEAMS, schedule, 2, selections, NOW);
    expect(result.map((t) => t.id)).toEqual(['B', 'C', 'D']);
  });

  it('does not exclude the pick made for the same week (allows re-picking)', () => {
    const schedule = [game(1, 'A', 'B', FUTURE)];
    const selections = [pick(1, 'A')];
    const result = getAvailableTeamsForWeek(TEAMS, schedule, 1, selections, NOW);
    expect(result.map((t) => t.id)).toEqual(['A', 'B']);
  });

  it('does not exclude teams picked in later weeks', () => {
    const schedule = [game(1, 'A', 'B', FUTURE)];
    const selections = [pick(5, 'A')];
    const result = getAvailableTeamsForWeek(TEAMS, schedule, 1, selections, NOW);
    expect(result.map((t) => t.id)).toEqual(['A', 'B']);
  });

  it('ignores empty selections (teamId null)', () => {
    const schedule = [game(2, 'A', 'B', FUTURE)];
    const selections = [pick(1, null)];
    const result = getAvailableTeamsForWeek(TEAMS, schedule, 2, selections, NOW);
    expect(result.map((t) => t.id)).toEqual(['A', 'B']);
  });

  it('returns an empty list when every game that week is locked', () => {
    const schedule = [game(1, 'A', 'B', PAST), game(1, 'C', 'D', PAST)];
    const result = getAvailableTeamsForWeek(TEAMS, schedule, 1, [], NOW);
    expect(result).toEqual([]);
  });
});
