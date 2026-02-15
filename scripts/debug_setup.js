
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables manually
const envFile = fs.readFileSync('apps/web/.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Listing Debate IDs...');

    const { data: debates, error } = await supabase
        .from('debates')
        .select('id')
        .limit(20);

    if (error) {
        console.error('Error fetching:', error);
    } else {
        console.log(`Found ${debates.length} debates.`);
        debates.forEach((d, i) => console.log(`${i}: ${d.id}`));
    }
}

inspect();
