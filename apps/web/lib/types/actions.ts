export type ActionType = 'confess' | 'buyIndulgence' | 'stake' | 'signalBetrayal' | 'challengePontiff' | 'vote';

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

export type VaticanAction =
    | ConfessAction
    | BuyIndulgenceAction
    | StakeAction
    | ChallengeAction;
