const fs = require('fs');

try {
    let rawData = fs.readFileSync('c:\\Dev\\Pontiff\\final_schema_check_v3.json', 'utf8');
    rawData = rawData.replace(/^\uFEFF/, '');
    const schema = JSON.parse(rawData);

    const table = 'tournament_registrations';
    const def = schema.definitions[table];

    if (!def) {
        console.log(`❌ Table '${table}' NOT FOUND.`);
    } else {
        console.log(`✅ Table '${table}' FOUND.`);
        console.log("Columns:", JSON.stringify(Object.keys(def.properties), null, 2));
    }

} catch (err) {
    console.error("Error:", err.message);
}
