export type Game = {
    id: string
    created_at: string
    api_game_id: string
    week: number
    game_time: string
    status: string
    home_team_id: string
    away_team_id: string
    locks_at: string
    winner_id: string | null
}
  
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
    status: 'win' | 'loss' | 'pending';
    score: string;
    locks_at: Date | null;
  }