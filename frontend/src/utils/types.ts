export type Game = {
    id: string
    created_at: string
    api_game_id: string
    season: number
    week: number
    game_time: string
    status: string
    home_team_id: string
    away_team_id: string
    locks_at: string
    winner_id: string | null
}
  
export type ScheduleGame = Pick<Game, 'week' | 'home_team_id' | 'away_team_id' | 'locks_at'>

export type DateRange = {
    start: Date
    end: Date
}

export type profileData = {
    id: string
    email: string
    username: string
    profile_picture_url: string
}

export type groupData = {
    id: number
    name: string
    group_picture_url: string
    allow_invites: boolean
    is_public: boolean
    admin_id: string
    group_size: number
}

export type profileGroupData = {
    id: number
    user_id: string
    group_id: number
    is_admin: boolean
    groups: groupData
    group_size: number
}
  

export type GroupMember = {
    user_id: string;
    is_admin: boolean;
    profiles: {
      id: string;
      username: string;
      profile_picture_url: string;
    };
  }

export type NFLTeam = {
    id: string;
    logo_url: string;
    name: string;
  }
  
export type Selection = {
    week: number;
    teamId: string | null;
    status: 'correct' | 'incorrect' | 'pending';
    score: number | string;
    locks_at: string | null;
  }

// Row shape returned by user_picks queries in useUserSelections
export type UserPickRow = {
    user_id: string;
    week: number;
    team_id: string | null;
    status: 'correct' | 'incorrect' | 'pending' | null;
    score: number | null;
    locks_at: string | null;
  }

// Row shape of the group_member_counts view used for public group discovery
export type publicGroupData = {
    id: number;
    name: string;
    group_picture_url: string | null;
    group_size: number;
    is_public: boolean;
  }