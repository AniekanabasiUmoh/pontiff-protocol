import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Module 11: Client-side WebSocket Hook
 *
 * Real-time game feed hook for live updates
 */

export interface GameFeedItem {
    gameId: string;
    player1: string;
    player2: string;
    gameType: 'RPS' | 'POKER' | 'JUDAS' | 'DEBATE';
    result: string;
    wager: string;
    payout?: string;
    winner?: string;
    timestamp: string;
}

export interface LeaderboardUpdate {
    category: 'Saint' | 'Sinner' | 'Heretic';
    topEntries: Array<{
        rank: number;
        address: string;
        score: number;
    }>;
    timestamp: string;
}

export interface DebateResult {
    debateId: number;
    winner: 'pontiff' | 'competitor';
    pontiffScore: number;
    competitorScore: number;
    timestamp: string;
}

export interface WorldStateUpdate {
    treasuryBalance: string;
    totalEntrants: number;
    activeGames: number;
    betrayalPercentage: number;
    timestamp: string;
}

export function useGameFeed() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [gameFeed, setGameFeed] = useState<GameFeedItem[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUpdate | null>(null);
    const [latestDebate, setLatestDebate] = useState<DebateResult | null>(null);
    const [worldState, setWorldState] = useState<WorldStateUpdate | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
        console.log('[useGameFeed] Connecting to:', wsUrl);

        const socketInstance = io(wsUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: maxReconnectAttempts
        });

        socketInstance.on('connect', () => {
            console.log('[useGameFeed] Connected to WebSocket');
            setConnected(true);
            reconnectAttempts.current = 0;

            // Auto-subscribe to all feeds
            socketInstance.emit('subscribe:games');
            socketInstance.emit('subscribe:leaderboard');
            socketInstance.emit('subscribe:debates');
            socketInstance.emit('subscribe:world-state');
        });

        socketInstance.on('disconnect', () => {
            console.log('[useGameFeed] Disconnected from WebSocket');
            setConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('[useGameFeed] Connection error:', error);
            reconnectAttempts.current++;

            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.error('[useGameFeed] Max reconnection attempts reached');
                socketInstance.close();
            }
        });

        socketInstance.on('welcome', (data) => {
            console.log('[useGameFeed] Welcome message:', data);
        });

        socketInstance.on('game:new', (gameData: GameFeedItem) => {
            console.log('[useGameFeed] New game:', gameData);
            setGameFeed((prev) => [gameData, ...prev].slice(0, 50)); // Keep last 50 games
        });

        socketInstance.on('leaderboard:update', (data: LeaderboardUpdate) => {
            console.log('[useGameFeed] Leaderboard update');
            setLeaderboard(data);
        });

        socketInstance.on('debate:result', (data: DebateResult) => {
            console.log('[useGameFeed] Debate result:', data);
            setLatestDebate(data);
        });

        socketInstance.on('worldState:update', (data: WorldStateUpdate) => {
            console.log('[useGameFeed] World state update');
            setWorldState(data);
        });

        socketInstance.on('pong', () => {
            // Connection health check response
        });

        setSocket(socketInstance);

        return socketInstance;
    }, []);

    useEffect(() => {
        const socketInstance = connect();

        // Ping interval to keep connection alive
        const pingInterval = setInterval(() => {
            if (socketInstance.connected) {
                socketInstance.emit('ping');
            }
        }, 30000); // Every 30 seconds

        return () => {
            clearInterval(pingInterval);
            socketInstance.disconnect();
        };
    }, [connect]);

    const subscribeToGames = useCallback(() => {
        if (socket) {
            socket.emit('subscribe:games');
        }
    }, [socket]);

    const unsubscribeFromGames = useCallback(() => {
        if (socket) {
            socket.emit('unsubscribe:games');
        }
    }, [socket]);

    const subscribeToLeaderboard = useCallback(() => {
        if (socket) {
            socket.emit('subscribe:leaderboard');
        }
    }, [socket]);

    const unsubscribeFromLeaderboard = useCallback(() => {
        if (socket) {
            socket.emit('unsubscribe:leaderboard');
        }
    }, [socket]);

    const subscribeToDebates = useCallback(() => {
        if (socket) {
            socket.emit('subscribe:debates');
        }
    }, [socket]);

    const unsubscribeFromDebates = useCallback(() => {
        if (socket) {
            socket.emit('unsubscribe:debates');
        }
    }, [socket]);

    const subscribeToWorldState = useCallback(() => {
        if (socket) {
            socket.emit('subscribe:world-state');
        }
    }, [socket]);

    const unsubscribeFromWorldState = useCallback(() => {
        if (socket) {
            socket.emit('unsubscribe:world-state');
        }
    }, [socket]);

    return {
        connected,
        gameFeed,
        leaderboard,
        latestDebate,
        worldState,
        subscribeToGames,
        unsubscribeFromGames,
        subscribeToLeaderboard,
        unsubscribeFromLeaderboard,
        subscribeToDebates,
        unsubscribeFromDebates,
        subscribeToWorldState,
        unsubscribeFromWorldState
    };
}
