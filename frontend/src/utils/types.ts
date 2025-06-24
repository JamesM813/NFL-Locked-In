export type Game = {
    id: string
    created_at: string
    api_game_id: string
    week: number
    game_time: string
    status: string
    home_team_id: string
    away_team_id: string
    winner_id: string | null
}
  
export type DateRange = {
    start: Date
    end: Date
}

export type userData = {
    id: string
    email: string
    username: string
    profile_picture_url: string
}

export type groupData = {
    id: string
    name: string
}
  