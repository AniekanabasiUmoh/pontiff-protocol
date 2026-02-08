import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { supabase } from './utils/database';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
    io = new SocketIOServer(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Subscribe to world state updates
        socket.on('subscribe:world', () => {
            socket.join('world-state');
            console.log(`${socket.id} subscribed to world state`);
        });

        // Subscribe to specific game updates
        socket.on('subscribe:game', (gameId: string) => {
            socket.join(`game:${gameId}`);
            console.log(`${socket.id} subscribed to game ${gameId}`);
        });

        // Subscribe to leaderboard updates
        socket.on('subscribe:leaderboard', () => {
            socket.join('leaderboard');
            console.log(`${socket.id} subscribed to leaderboard`);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    // Listen to Supabase Realtime for database changes
    setupRealtimeListeners();

    return io;
}

function setupRealtimeListeners() {
    // Listen to Game table changes
    supabase
        .channel('game-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, (payload: any) => {
            if (io) {
                io.to('world-state').emit('game:update', payload.new);
                if (payload.new?.id) {
                    io.to(`game:${payload.new.id}`).emit('game:state', payload.new);
                }
            }
        })
        .subscribe();

    // Listen to Leaderboard changes
    supabase
        .channel('leaderboard-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_entries' }, (payload: any) => {
            if (io) {
                io.to('leaderboard').emit('leaderboard:update', payload.new);
                io.to('world-state').emit('world:update', { type: 'leaderboard' });
            }
        })
        .subscribe();

    // Listen to WorldEvent changes
    supabase
        .channel('event-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'world_events' }, (payload: any) => {
            if (io) {
                io.to('world-state').emit('event:new', payload.new);
            }
        })
        .subscribe();
}

export function broadcastWorldStateUpdate(data: any) {
    if (io) {
        io.to('world-state').emit('world:update', data);
    }
}

export function broadcastGameUpdate(gameId: string, data: any) {
    if (io) {
        io.to(`game:${gameId}`).emit('game:state', data);
    }
}

export { io };
