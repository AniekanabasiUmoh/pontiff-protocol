import { Server } from 'socket.io';
import { createServer } from 'http';
import Redis from 'ioredis';
import 'dotenv/config'; // Make sure to install dotenv or use -r dotenv/config

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PORT = parseInt(process.env.WS_PORT || '3001', 10);

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST']
    }
});

const redisSub = new Redis(REDIS_URL);

// Subscribe to world state updates
redisSub.subscribe('world-state-updates', (err) => {
    if (err) {
        console.error('Failed to subscribe to world-state-updates:', err);
    } else {
        console.log('Subscribed to world-state-updates channel');
    }
});

redisSub.on('message', (channel, message) => {
    if (channel === 'world-state-updates') {
        try {
            const data = JSON.parse(message);
            console.log('Broadcasting update:', data.type);
            io.emit('message', data); // Broadcast to all clients
        } catch (e) {
            console.error('Failed to parse Redis message:', e);
        }
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

httpServer.listen(PORT, () => {
    console.log(`WebSocket server running on port ${PORT}`);
});
