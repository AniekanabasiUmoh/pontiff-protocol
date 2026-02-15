const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRPSGames() {
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('game_type', 'RPS')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\n RPS Games Found: ${data?.length || 0}\n`);

    if (data && data.length > 0) {
        data.forEach(g => {
            const outcome = g.result?.outcome || 'N/A';
            const player = g.player1?.slice(0, 10) || 'unknown';
            const wager = g.wager ? `${parseInt(g.wager) / 1e18} GUILT` : 'unknown';
            const date = new Date(g.created_at).toLocaleString();
            console.log(`  - Player: ${player}... | Outcome: ${outcome} | Wager: ${wager} | ${date}`);
        });
    } else {
        console.log('  No RPS games found in database. Seed data needed.');
    }
}

checkRPSGames().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
