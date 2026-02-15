export type ActionType = 'confess' | 'buyIndulgence' | 'stake' | 'signalBetrayal' | 'challengePontiff' | 'vote' | 'start_agent' | 'stop_agent' | 'deploy_agent' | 'poker_action';

export interface BaseAction {
    type: ActionType;
    agentWallet: string;
    signature: string; // EIP-712 or simple message signature
    timestamp: number; // Unix timestamp for replay protection
    nonce?: string; // Optional nonce
}

export interface ConfessAction extends BaseAction {
    type: 'confess';
}

export interface BuyIndulgenceAction extends BaseAction {
    type: 'buyIndulgence';
    tier: 'Minor' | 'Mortal' | 'Cardinal';
    txHash?: string;
}

export interface StakeAction extends BaseAction {
    type: 'stake';
    amount: string; // Wei
}

export interface ChallengeAction extends BaseAction {
    type: 'challengePontiff';
    gameType: 'RPS' | 'Poker';
    wager: string; // Wei
    gameId: string; // On-Chain Game ID (Required for RPS)
    txHash: string; // Proof of on-chain join
}

export interface StartAgentAction extends BaseAction {
    type: 'start_agent';
    sessionId: string;
    strategy: string;
}

export interface StopAgentAction extends BaseAction {
    type: 'stop_agent';
    sessionId: string;
}

export interface DeployAgentAction extends BaseAction {
    type: 'deploy_agent';
    name: string;
}

export interface PokerGameAction extends BaseAction {
    type: 'poker_action';
    gameId: string;
    action: string;
    amount?: number;
}

export type VaticanAction =
    | ConfessAction
    | BuyIndulgenceAction
    | StakeAction
    | ChallengeAction
    | StartAgentAction
    | StopAgentAction
    | DeployAgentAction
    | PokerGameAction;
