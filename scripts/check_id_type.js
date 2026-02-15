const fs = require('fs');

try {
    let rawData = fs.readFileSync('c:\\Dev\\Pontiff\\final_schema_check_v3.json', 'utf8');
    rawData = rawData.replace(/^\uFEFF/, '');
    const schema = JSON.parse(rawData);

    const tb = schema.definitions['tournament_brackets'];

    console.log('=== tournament_brackets.id SCHEMA ===\n');
    console.log('Type:', tb.properties.id.type);
    console.log('Format:', tb.properties.id.format);
    console.log('Description:', tb.properties.id.description);

    console.log('\n=== FULL id PROPERTY ===');
    console.log(JSON.stringify(tb.properties.id, null, 2));

} catch (err) {
    console.error('Error:', err.message);
}
