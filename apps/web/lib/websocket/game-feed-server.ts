import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { redis } from '../redis';

/**
 * Module 11: WebSocket Live Game Feed Server
 *
 * Provides real-time updates for:
 * - Game completions
 * - Leaderboard changes
 * - Debate results
 * - World state updates
 */
export class GameFeedServer {
    private io: SocketIOServer;
    private connectedClients: Set<string> = new Set();

    constructor(httpServer: HTTPServer) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupEventHandlers();
        this.subscribeToRedis();
    }

    private setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`[WebSocket] Client connected: ${socket.id}`);
            this.connectedClients.add(socket.id);

            // Subscribe to game feed
            socket.on('subscribe:games', () => {
                socket.join('game-feed');
                console.log(`[WebSocket] ${socket.id} subscribed to game feed`);
                this.sendWelcomeMessage(socket);
            });

            // Subscribe to leaderboard updates
            socket.on('subscribe:leaderboard', () => {
                socket.join('leaderboard');
                console.log(`[WebSocket] ${socket.id} subscribed to leaderboard`);
            });

            // Subscribe to debate updates
            socket.on('subscribe:debates', () => {
                socket.join('debates');
                console.log(`[WebSocket] ${socket.id} subscribed to debates`);
            });

            // Subscribe to world state
            socket.on('subscribe:world-state', () => {
                socket.join('world-state');
                console.log(`[WebSocket] ${socket.id} subscribed to world state`);
            });

            // Unsubscribe handlers
            socket.on('unsubscribe:games', () => {
                socket.leave('game-feed');
                console.log(`[WebSocket] ${socket.id} unsubscribed from game feed`);
            });

            socket.on('unsubscribe:leaderboard', () => {
                socket.leave('leaderboard');
                console.log(`[WebSocket] ${socket.id} unsubscribed from leaderboard`);
            });

            socket.on('unsubscribe:debates', () => {
                socket.leave('debates');
                console.log(`[WebSocket] ${socket.id} unsubscribed from debates`);
            });

            socket.on('unsubscribe:world-state', () => {
                socket.leave('world-state');
                console.log(`[WebSocket] ${socket.id} unsubscribed from world state`);
            });

            // Ping/pong for connection health
            socket.on('ping', () => {
                socket.emit('pong');
            });

            // Disconnect handler
            socket.on('disconnect', () => {
                console.log(`[WebSocket] Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });
        });
    }

    private async subscribeToRedis() {
        try {
            // Subscribe to game updates channel
            await redis.subscribe('game-updates', (err) => {
                if (err) {
                    console.error('[WebSocket] Failed to subscribe to game-updates:', err);
                } else {
                    console.log('[WebSocket] Subscribed to game-updates channel');
                }
            });

            // Subscribe to leaderboard updates
            await redis.subscribe('leaderboard-updates', (err) => {
                if (err) {
                    console.error('[WebSocket] Failed to subscribe to leaderboard-updates:', err);
                } else {
                    console.log('[WebSocket] Subscribed to leaderboard-updates channel');
                }
            });

            // Subscribe to debate results
            await redis.subscribe('debate-results', (err) => {
                if (err) {
                    console.error('[WebSocket] Failed to subscribe to debate-results:', err);
                } else {
                    console.log('[WebSocket] Subscribed to debate-results channel');
                }
            });

            // Subscribe to world state updates
            await redis.subscribe('world-state-updates', (err) => {
                if (err) {
                    console.error('[WebSocket] Failed to subscribe to world-state-updates:', err);
                } else {
                    console.log('[WebSocket] Subscribed to world-state-updates channel');
                }
            });

            // Handle incoming Redis messages
            redis.on('message', (channel, message) => {
                this.handleRedisMessage(channel, message);
            });

        } catch (error) {
            console.error('[WebSocket] Redis subscription error:', error);
        }
    }

    private handleRedisMessage(channel: string, message: string) {
        try {
            const data = JSON.parse(message);

            switch (channel) {
                case 'game-updates':
                    this.io.to('game-feed').emit('game:new', data);
                    console.log('[WebSocket] Broadcasted game update:', data.gameId);
                    break;

                case 'leaderboard-updates':
                    this.io.to('leaderboard').emit('leaderboard:update', data);
                    console.log('[WebSocket] Broadcasted leaderboard update');
                    break;

                case 'debate-results':
                    this.io.to('debates').emit('debate:result', data);
                    console.log('[WebSocket] Broadcasted debate result:', data.debateId);
                    break;

                case 'world-state-updates':
                    this.io.to('world-state').emit('worldState:update', data);
                    console.log('[WebSocket] Broadcasted world state update');
                    break;

                default:
                    console.warn('[WebSocket] Unknown channel:', channel);
            }
        } catch (error) {
            console.error('[WebSocket] Error handling Redis message:', error);
        }
    }

    private sendWelcomeMessage(socket: any) {
        socket.emit('welcome', {
            message: 'Connected to The Pontiff Live Feed',
            timestamp: new Date().toISOString(),
            channels: ['games', 'leaderboard', 'debates', 'world-state']
        });
    }

    /**
     * Broadcast game result to all connected clients
     */
    public broadcastGame(gameData: any) {
        this.io.to('game-feed').emit('game:new', gameData);
        console.log('[WebSocket] Manual broadcast - game:', gameData.gameId);
    }

    /**
     * Broadcast leaderboard update
     */
    public broadcastLeaderboard(leaderboardData: any) {
        this.io.to('leaderboard').emit('leaderboard:update', leaderboardData);
        console.log('[WebSocket] Manual broadcast - leaderboard');
    }

    /**
     * Broadcast debate result
     */
    public broadcastDebate(debateData: any) {
        this.io.to('debates').emit('debate:result', debateData);
        console.log('[WebSocket] Manual broadcast - debate:', debateData.debateId);
    }

    /**
     * Broadcast world state update
     */
    public broadcastWorldState(worldState: any) {
        this.io.to('world-state').emit('worldState:update', worldState);
        console.log('[WebSocket] Manual broadcast - world state');
    }

    /**
     * Get connection statistics
     */
    public getStats() {
        return {
            connectedClients: this.connectedClients.size,
            rooms: {
                gameFeed: this.io.sockets.adapter.rooms.get('game-feed')?.size || 0,
                leaderboard: this.io.sockets.adapter.rooms.get('leaderboard')?.size || 0,
                debates: this.io.sockets.adapter.rooms.get('debates')?.size || 0,
                worldState: this.io.sockets.adapter.rooms.get('world-state')?.size || 0
            }
        };
    }

    /**
     * Shutdown server gracefully
     */
    public async shutdown() {
        console.log('[WebSocket] Shutting down...');
        await redis.unsubscribe();
        this.io.close();
        console.log('[WebSocket] Server closed');
    }
}

// Singleton instance
let gameFeedServerInstance: GameFeedServer | null = null;

export function initializeGameFeedServer(httpServer: HTTPServer): GameFeedServer {
    if (!gameFeedServerInstance) {
        gameFeedServerInstance = new GameFeedServer(httpServer);
        console.log('[WebSocket] Game Feed Server initialized');
    }
    return gameFeedServerInstance;
}

export function getGameFeedServer(): GameFeedServer | null {
    return gameFeedServerInstance;
}
