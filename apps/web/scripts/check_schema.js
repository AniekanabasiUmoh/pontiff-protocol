
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://rwilifqotgmqkbzkzudh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aWxpZnFvdGdtcWbiemt6dWRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5OTk0MywiZXhwIjoyMDg1Nzc1OTQzfQ.Xnashy8Kql3-scnsoallfrhY2vk2O1pPUx4LybWYcXQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
    console.log('Checking agent_sessions schema...');

    // method 1: try to select * and see keys (works if rows exist)
    const { data: rows, error } = await supabase.from('agent_sessions').select('*').limit(1);

    if (error) {
        console.error('Error selecting data:', error);
    } else {
        console.log('Row data (keys indicate columns):');
        if (rows.length > 0) {
            console.log(Object.keys(rows[0]));
            console.log('Sample row:', rows[0]);
        } else {
            console.log('No rows found. Attempting to infer columns from error or CSV export...');
            const { data: csv, error: csvError } = await supabase.from('agent_sessions').select('*').limit(0).csv();
            if (csvError) console.error('CSV Error:', csvError);
            else console.log('CSV Headers:', csv);
        }
    }
}

checkSchema();
