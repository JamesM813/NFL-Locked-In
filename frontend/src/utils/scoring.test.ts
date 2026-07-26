import { describe, expect, it } from 'vitest';
import { calculateMemberScores } from './scoring';
import type { GroupMember, Selection } from './types';

function member(userId: string): GroupMember {
  return {
    user_id: userId,
    is_admin: false,
    profiles: { id: userId, username: userId, profile_picture_url: '' }
  };
}

function selection(week: number, score: number | string): Selection {
  return { week, teamId: 'team-1', status: 'correct', score, locks_at: null };
}

describe('calculateMemberScores', () => {
  it('returns zero for every member when there are no selections', () => {
    const scores = calculateMemberScores([member('a'), member('b')], {});
    expect(scores).toEqual({ a: 0, b: 0 });
  });

  it('sums numeric scores per member', () => {
    const scores = calculateMemberScores([member('a'), member('b')], {
      a: [selection(1, 10), selection(2, 6)],
      b: [selection(1, 4)]
    });
    expect(scores).toEqual({ a: 16, b: 4 });
  });

  it("treats unscored selections ('-') as zero", () => {
    const scores = calculateMemberScores([member('a')], {
      a: [selection(1, 10), selection(2, '-'), selection(3, '-')]
    });
    expect(scores).toEqual({ a: 10 });
  });

  it('coerces numeric strings from the database', () => {
    const scores = calculateMemberScores([member('a')], {
      a: [selection(1, '7'), selection(2, 3)]
    });
    expect(scores).toEqual({ a: 10 });
  });

  it('keeps members with no selections at zero', () => {
    const scores = calculateMemberScores([member('a'), member('b')], {
      a: [selection(1, 5)]
    });
    expect(scores).toEqual({ a: 5, b: 0 });
  });

  it('includes selections from users missing from the member list', () => {
    const scores = calculateMemberScores([member('a')], {
      ghost: [selection(1, 8)]
    });
    expect(scores).toEqual({ a: 0, ghost: 8 });
  });

  it('handles empty inputs', () => {
    expect(calculateMemberScores([], {})).toEqual({});
  });
});
