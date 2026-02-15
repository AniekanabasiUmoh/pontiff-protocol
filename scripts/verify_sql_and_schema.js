const fs = require('fs');

try {
    // 1. Load Schema
    console.log("Loading schema v3...");
    let rawData = fs.readFileSync('c:\\Dev\\Pontiff\\final_schema_check_v3.json', 'utf8');
    rawData = rawData.replace(/^\uFEFF/, '');
    const schema = JSON.parse(rawData);
    const defs = schema.definitions || {};

    // 2. Load SQL
    console.log("Loading SQL script...");
    const sqlContent = fs.readFileSync('c:\\Dev\\Pontiff\\docs\\audit\\FIX_FINAL_4.sql', 'utf8');

    // 3. Extract Inserts
    const insertRegex = /INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)/gi;
    let match;
    let errors = [];
    let warnings = [];

    while ((match = insertRegex.exec(sqlContent)) !== null) {
        const tableName = match[1];
        const columns = match[2].split(',').map(c => c.trim().replace(/['"`]/g, '')); // cleanup quotes

        console.log(`\nChecking INSERT definition for table: '${tableName}'`);

        // Handle locally created tables
        if (tableName === 'matches') {
            if (sqlContent.includes('CREATE TABLE IF NOT EXISTS matches')) {
                console.log(`  ℹ️ Table '${tableName}' is created in script. Skipping schema check.`);
                continue;
            }
        }

        if (!defs[tableName]) {
            errors.push(`❌ Table '${tableName}' does not exist in schema.`);
            continue;
        }

        const schemaCols = Object.keys(defs[tableName].properties || {});

        columns.forEach(col => {
            // Remove comments if any
            const cleanCol = col.split('--')[0].trim();
            if (schemaCols.includes(cleanCol)) {
                console.log(`  ✅ Column '${cleanCol}': FOUND`);
            } else {
                console.log(`  ❌ Column '${cleanCol}': NOT FOUND`);
                errors.push(`Column '${cleanCol}' not found in table '${tableName}'`);

                // Fuzzy match suggestion
                const suggestion = schemaCols.find(c => c.toLowerCase() === cleanCol.toLowerCase());
                if (suggestion) console.log(`     (Did you mean '${suggestion}'?)`);
            }
        });
    }

    if (errors.length > 0) {
        console.error("\nVerification FAILED with " + errors.length + " errors.");
        process.exit(1);
    } else {
        console.log("\n✅ Verification PASSED. SQL is compatible with schema.");
    }

} catch (err) {
    console.error("Script error:", err.message);
}
