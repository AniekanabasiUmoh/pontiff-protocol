const fs = require('fs');

// Read schema
let rawData = fs.readFileSync('c:\\Dev\\Pontiff\\schema_verification_final.json', 'utf8');
rawData = rawData.replace(/^\uFEFF/, '');
const schema = JSON.parse(rawData);

// Tables we need to verify
const tables = ['tournament_brackets', 'debates'];

console.log('=== SCHEMA VERIFICATION FOR FIXES ===\n');

tables.forEach(tableName => {
    const def = schema.definitions[tableName];
    if (!def) {
        console.log(`❌ Table '${tableName}' NOT FOUND`);
        return;
    }

    console.log(`✅ Table '${tableName}' found`);
    console.log(`Columns: ${Object.keys(def.properties).join(', ')}\n`);
});
