const fs = require('fs');

try {
    let rawData = fs.readFileSync('c:\\Dev\\Pontiff\\final_schema_check_v2.json', 'utf8');
    rawData = rawData.replace(/^\uFEFF/, ''); // Strip BOM
    const schema = JSON.parse(rawData);
    const defs = schema.definitions;

    const tables = ['debates', 'tournaments', 'matches'];

    console.log("Verifying schema for FIX_FINAL_4.sql...");

    tables.forEach(table => {
        if (defs[table]) {
            console.log(`✅ Table '${table}' FOUND.`);
            const cols = Object.keys(defs[table].properties || {});
            // Check specific columns needed
            if (table === 'debates') {
                ['winner_wallet', 'status', 'round'].forEach(c =>
                    console.log(`   - ${c}: ${cols.includes(c) ? 'OK' : 'MISSING'}`));
            }
            if (table === 'tournaments') {
                ['start_date', 'status'].forEach(c =>
                    console.log(`   - ${c}: ${cols.includes(c) ? 'OK' : 'MISSING'}`));
            }
        } else {
            console.log(`⚠️ Table '${table}' NOT FOUND in schema (will be created if script handles it).`);
        }
    });

} catch (err) {
    console.error("Error:", err.message);
}
