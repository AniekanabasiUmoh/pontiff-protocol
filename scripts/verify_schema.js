const fs = require('fs');

try {
    let rawData = fs.readFileSync('c:\\Dev\\Pontiff\\final_schema_check.json', 'utf8');
    // Strip BOM if present
    rawData = rawData.replace(/^\uFEFF/, '');

    const schema = JSON.parse(rawData);

    const defs = schema.definitions;
    if (!defs) {
        console.error("ERROR: No definitions found in schema file.");
        process.exit(1);
    }

    console.log("Schema loaded. Checking definitions...");

    const checkTable = (tableName, requiredCols) => {
        console.log(`\nChecking table: ${tableName}`);
        if (!defs[tableName]) {
            console.log(`  ❌ MISSING TABLE: ${tableName}`);
            return;
        }

        const props = defs[tableName].properties || {};
        const cols = Object.keys(props);
        console.log(`  Found ${cols.length} columns.`);

        requiredCols.forEach(col => {
            if (cols.includes(col)) {
                console.log(`  ✅ Found column: ${col}`);
            } else {
                console.log(`  ❌ MISSING COLUMN: ${col}`);
                // Check for loose matches (case insensitive or alias)
                const match = cols.find(c => c.toLowerCase() === col.toLowerCase().replace(/_/g, ''));
                if (match) console.log(`     (Did you mean: ${match}?)`);
            }
        });
    };

    // 1. Check Cardinal Memberships (snake_case vs camelCase verification)
    checkTable('cardinal_memberships', [
        'wallet_address',
        'last_renewed_at',
        'cancelled_at',
        'walletAddress',
        'lastRenewedAt',
        'cancelledAt'
    ]);

    // 2. Check Competitor Agents
    checkTable('competitor_agents', ['twitter_handle', 'narrative', 'verification_method']);

    // 3. Check Debates
    checkTable('debates', ['winner_wallet', 'status']);

    // 4. Check Tournaments
    checkTable('tournaments', ['entry_fee', 'prize_pool', 'start_date']);

} catch (err) {
    console.error("An error occurred:", err.message);
}
