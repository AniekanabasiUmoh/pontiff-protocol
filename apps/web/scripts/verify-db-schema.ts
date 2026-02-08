import path from 'path';
import dotenv from 'dotenv';

// Configure dotenv BEFORE importing supabase
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('Verifying Supabase connection and schema...');

    // Dynamic import to ensure config is loaded
    const { supabase } = await import('../lib/db/supabase');

    // Test vatican_entrants
    const { data: entrants, error: errorEntrants } = await supabase.from('vatican_entrants').select('*').limit(1);
    if (errorEntrants) {
        console.error('Error connecting to vatican_entrants:', errorEntrants);
    } else {
        console.log('✅ Successfully connected to vatican_entrants. Row count:', entrants?.length ?? 0);
    }

    // Test indulgences (new table)
    const { data: indulgences, error: errorIndulgences } = await supabase.from('indulgences').select('*').limit(1);
    if (errorIndulgences) {
        console.error('Error connecting to indulgences:', errorIndulgences);
    } else {
        console.log('✅ Successfully connected to indulgences.');
    }

    // Test games
    const { data: games, error: errorGames } = await supabase.from('games').select('*').limit(1);
    if (errorGames) {
        console.error('Error connecting to games:', errorGames);
    } else {
        console.log('✅ Successfully connected to games.');
    }
}

main().catch(console.error);
