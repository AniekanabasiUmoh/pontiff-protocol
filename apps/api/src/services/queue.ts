import Queue from 'bull';
import dotenv from 'dotenv';
import { postWritTweet } from './twitter';
import { supabase } from '../utils/database';

dotenv.config();

// Interface for Tweet Job
interface TweetJobData {
    confessionId: string;
    roast: string;
    walletAddress: string;
}

// Initialize Queue
// Redis connection is required. If running locally without Redis, this might fail unless mocked or using cloud Redis.
// For Hackathon local dev without Redis: We might need a fallback.
// Assuming Redis is available or we use a simple in-memory queue for dev if redis fails.

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const tweetQueue = new Queue<TweetJobData>('pontiff-tweets', REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
    }
});

// Process Jobs
tweetQueue.process(async (job) => {
    const { confessionId, roast, walletAddress } = job.data;
    console.log(`Job ${job.id}: Processing tweet for confession ${confessionId}`);

    try {
        // 1. Post to Twitter
        const tweetId = await postWritTweet(roast, confessionId, walletAddress);

        if (tweetId) {
            // 2. Update Supabase with tweet_id (Task 5.5 Persistence)
            try {
                await supabase
                    .from('confessions')
                    .update({ tweet_id: tweetId })
                    .eq('id', confessionId);
                console.log(`Job ${job.id}: Tweet persisted to DB`);
            } catch (dbError) {
                console.warn(`Job ${job.id}: DB persistence warning (column missing?)`, dbError);
                // Non-critical: Don't fail the job if just DB update fails
            }

            console.log(`Job ${job.id}: Tweet posted successfully (ID: ${tweetId})`);
            return { success: true, tweetId };
        } else {
            throw new Error('Failed to post tweet (returned null)');
        }
    } catch (error) {
        console.error(`Job ${job.id}: Failed`, error);
        throw error;
    }
});

// Queue Events
tweetQueue.on('completed', (job, result) => {
    console.log(`✅ Queue Job ${job.id} completed! Tweet ID: ${result.tweetId}`);
});

tweetQueue.on('failed', (job, err) => {
    console.error(`❌ Queue Job ${job.id} failed: ${err.message}`);
});

/**
 * Add a tweet job to the queue
 */
export async function queueTweet(data: TweetJobData) {
    try {
        const job = await tweetQueue.add(data, {
            delay: 5000 // 5s delay to feel natural
        });
        console.log(`📥 Added to Tweet Queue: Job ${job.id}`);
        return job;
    } catch (error) {
        console.error('Failed to add to queue:', error);
        // Fallback: Try to tweet immediately if queue fails (e.g. no Redis)
        console.log('⚠️ Queue failed, attempting direct post...');
        postWritTweet(data.roast, data.confessionId, data.walletAddress);
        return null;
    }
}
