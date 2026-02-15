export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            vatican_entrants: {
                Row: {
                    id: string
                    wallet_address: string
                    entry_time: string
                    mon_paid: string
                }
                Insert: {
                    id?: string
                    wallet_address: string
                    entry_time?: string
                    mon_paid: string
                }
                Update: {
                    id?: string
                    wallet_address?: string
                    entry_time?: string
                    mon_paid?: string
                }
            }
            competitor_agents: {
                Row: {
                    id: string
                    handle: string
                    name: string | null
                    token_symbol: string | null
                    contract_address: string | null
                    status: string
                    threat_level: string
                    is_shadow: boolean
                    guilt_paid: string
                    market_cap: string
                    holders: number
                    last_interaction: string
                    metadata: Json | null
                }
                Insert: {
                    id?: string
                    handle: string
                    name?: string | null
                    token_symbol?: string | null
                    contract_address?: string | null
                    status: string
                    threat_level?: string
                    is_shadow?: boolean
                    guilt_paid?: string
                    market_cap?: string
                    holders?: number
                    last_interaction?: string
                    metadata?: Json | null
                }
                Update: {
                    id?: string
                    handle?: string
                    name?: string | null
                    token_symbol?: string | null
                    contract_address?: string | null
                    status?: string
                    threat_level?: string
                    is_shadow?: boolean
                    guilt_paid?: string
                    market_cap?: string
                    holders?: number
                    last_interaction?: string
                    metadata?: Json | null
                }
            }
            crusades: {
                Row: {
                    id: string
                    target_agent_id: string | null
                    target_agent_handle: string | null
                    goal_type: string
                    status: string
                    start_time: string
                    end_time: string | null
                    participants: Json | null
                    description: string | null
                }
                Insert: {
                    id?: string
                    target_agent_id?: string | null
                    target_agent_handle?: string | null
                    goal_type: string
                    status: string
                    start_time?: string
                    end_time?: string | null
                    participants?: Json | null
                    description?: string | null
                }
                Update: {
                    id?: string
                    target_agent_id?: string | null
                    target_agent_handle?: string | null
                    goal_type?: string
                    status?: string
                    start_time?: string
                    end_time?: string | null
                    participants?: Json | null
                    description?: string | null
                }
            }
            debates: {
                Row: {
                    id: string
                    competitor_agent_id: string
                    tweet_id: string
                    our_argument: string
                    their_argument: string | null
                    status: string
                    exchanges: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    competitor_agent_id: string
                    tweet_id: string
                    our_argument: string
                    their_argument?: string | null
                    status: string
                    exchanges?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    competitor_agent_id?: string
                    tweet_id?: string
                    our_argument?: string
                    their_argument?: string | null
                    status?: string
                    exchanges?: number
                    created_at?: string
                }
            }
            conversions: {
                Row: {
                    id: string
                    competitor_agent_id: string
                    type: string
                    amount: string | null
                    evidence: Json | null
                    timestamp: string
                }
                Insert: {
                    id?: string
                    competitor_agent_id: string
                    type: string
                    amount?: string | null
                    evidence?: Json | null
                    timestamp?: string
                }
                Update: {
                    id?: string
                    competitor_agent_id?: string
                    type?: string
                    amount?: string | null
                    evidence?: Json | null
                    timestamp?: string
                }
            }
            leaderboard_entries: {
                Row: {
                    id: string
                    wallet_address: string
                    category: string
                    score: number
                    metadata: Json | null
                    last_updated: string
                }
                Insert: {
                    id?: string
                    wallet_address: string
                    category: string
                    score: number
                    metadata?: Json | null
                    last_updated?: string
                }
                Update: {
                    id?: string
                    wallet_address?: string
                    category?: string
                    score?: number
                    metadata?: Json | null
                    last_updated?: string
                }
            }
            games: {
                Row: {
                    id: string
                    player1: string
                    player2: string
                    game_type: string
                    wager: string
                    status: string
                    winner: string | null
                    result: Json | null
                    created_at: string
                    completed_at: string | null
                }
                Insert: {
                    id?: string
                    player1: string
                    player2: string
                    game_type: string
                    wager: string
                    status: string
                    winner?: string | null
                    result?: Json | null
                    created_at?: string
                    completed_at?: string | null
                }
                Update: {
                    id?: string
                    player1?: string
                    player2?: string
                    game_type?: string
                    wager?: string
                    status?: string
                    winner?: string | null
                    result?: Json | null
                    created_at?: string
                    completed_at?: string | null
                }
            }
            world_events: {
                Row: {
                    id: string
                    agent_wallet: string | null
                    event_type: string
                    event_data: Json
                    timestamp: string
                }
                Insert: {
                    id?: string
                    agent_wallet?: string | null
                    event_type: string
                    event_data: Json
                    timestamp?: string
                }
                Update: {
                    id?: string
                    agent_wallet?: string | null
                    event_type?: string
                    event_data?: Json
                    timestamp?: string
                }
            }
            indulgences: {
                Row: {
                    id: string
                    wallet_address: string
                    token_id: string | null
                    tier: string
                    price_paid: string
                    tx_hash: string | null
                    purchased_at: string
                }
                Insert: {
                    id?: string
                    wallet_address: string
                    token_id?: string | null
                    tier: string
                    price_paid: string
                    tx_hash?: string | null
                    purchased_at?: string
                }
                Update: {
                    id?: string
                    wallet_address?: string
                    token_id?: string | null
                    tier?: string
                    price_paid?: string
                    tx_hash?: string | null
                    purchased_at?: string
                }
            }
            staking_records: {
                Row: {
                    id: string
                    wallet_address: string
                    amount: string
                    action: string
                    tx_hash: string | null
                    timestamp: string
                }
                Insert: {
                    id?: string
                    wallet_address: string
                    amount: string
                    action: string
                    tx_hash?: string | null
                    timestamp?: string
                }
                Update: {
                    id?: string
                    wallet_address?: string
                    amount?: string
                    action?: string
                    tx_hash?: string | null
                    timestamp?: string
                }
            }
            betrayal_events: {
                Row: {
                    id: string
                    epoch_number: number
                    traitor_address: string
                    stake_slashed: string | null
                    outcome: string | null
                    timestamp: string
                }
                Insert: {
                    id?: string
                    epoch_number: number
                    traitor_address: string
                    stake_slashed?: string | null
                    outcome?: string | null
                    timestamp?: string
                }
                Update: {
                    id?: string
                    epoch_number?: number
                    traitor_address?: string
                    stake_slashed?: string | null
                    outcome?: string | null
                    timestamp?: string
                }
            }
            confessions: {
                Row: {
                    id: string
                    wallet_address: string
                    sins: Json | null
                    roast_text: string | null
                    stake_amount: string | null
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    wallet_address: string
                    sins?: Json | null
                    roast_text?: string | null
                    stake_amount?: string | null
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    wallet_address?: string
                    sins?: Json | null
                    roast_text?: string | null
                    stake_amount?: string | null
                    status?: string
                    created_at?: string
                }
            }
            rate_limits: {
                Row: {
                    key: string
                    count: number
                    window_start: string
                    updated_at: string
                }
                Insert: {
                    key: string
                    count?: number
                    window_start?: string
                    updated_at?: string
                }
                Update: {
                    key?: string
                    count?: number
                    window_start?: string
                    updated_at?: string
                }
            }
        }
    }
}

