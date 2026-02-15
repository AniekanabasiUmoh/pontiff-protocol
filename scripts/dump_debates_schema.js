const fs = require('fs');

try {
    let rawData = fs.readFileSync('c:\\Dev\\Pontiff\\final_schema_check_v3.json', 'utf8');
    rawData = rawData.replace(/^\uFEFF/, ''); // Strip BOM
    const schema = JSON.parse(rawData);

    const debates = schema.definitions.debates;
    if (!debates) {
        console.log("❌ Table 'debates' NOT FOUND in schema.");
    } else {
        console.log("✅ Table 'debates' FOUND.");
        console.log("Columns:", JSON.stringify(Object.keys(debates.properties), null, 2));
    }

    // Also check for any table containing 'competitor' column
    console.log("\nSearching for 'competitor' columns across all tables:");
    Object.keys(schema.definitions).forEach(tableName => {
        const props = Object.keys(schema.definitions[tableName].properties || {});
        const competitors = props.filter(p => p.toLowerCase().includes('competitor'));
        if (competitors.length > 0) {
            console.log(`  Table '${tableName}': ${competitors.join(', ')}`);
        }
    });

} catch (err) {
    console.error("Error:", err.message);
}
