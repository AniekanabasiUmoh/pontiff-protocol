import { createClient } from '@supabase/supabase-js';

function getDb() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );
}

interface RateLimitConfig {
    limit: number;
    windowSeconds: number;
}

const RATELIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    'confess': { limit: 5, windowSeconds: 60 },
    'challenge': { limit: 5, windowSeconds: 60 },
    'casino_rps': { limit: 30, windowSeconds: 60 },
    'deploy_agent': { limit: 3, windowSeconds: 3600 },
    'default': { limit: 20, windowSeconds: 60 }
};

export async function checkRateLimit(identifier: string, actionType: string = 'default'): Promise<{ success: boolean; remaining: number; resetTime?: number }> {
    const config = RATELIMIT_CONFIGS[actionType] || RATELIMIT_CONFIGS['default'];
    // Sanitize identifier to avoid key issues (e.g., ":" in IPv6)
    const key = `ratelimit:${actionType}:${identifier}`;

    try {
        const { data, error } = await getDb().rpc('check_rate_limit', {
            identify_key: key,
            window_limit: config.limit,
            window_seconds: config.windowSeconds
        });

        if (error) {
            console.error("Rate limit RPC error:", error);
            // Fail open
            return { success: true, remaining: 1 };
        }

        // data is explicit array or object depending on RPC return?
        // function returns table(allowed boolean, remaining int, reset_time timestamptz)
        // RPC returns array of objects for table return
        const result = Array.isArray(data) ? data[0] : data;

        if (!result) return { success: true, remaining: 1 };

        return {
            success: result.allowed,
            remaining: result.remaining,
            resetTime: new Date(result.reset_time).getTime()
        };

    } catch (error) {
        console.error("Rate limit exception:", error);
        return { success: true, remaining: 1 };
    }
}
