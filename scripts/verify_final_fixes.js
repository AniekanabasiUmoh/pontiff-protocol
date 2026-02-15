const fs = require('fs');

try {
    let rawData = fs.readFileSync('c:\\Dev\\Pontiff\\final_schema_check_v3.json', 'utf8');
    rawData = rawData.replace(/^\uFEFF/, '');
    const schema = JSON.parse(rawData);

    let sqlContent = fs.readFileSync('c:\\Dev\\Pontiff\\docs\\audit\\FIX_FINAL_4.sql', 'utf8');

    console.log('=== FINAL VERIFICATION OF FIXES ===\n');

    // Check tournament_brackets
    const tb = schema.definitions['tournament_brackets'];
    if (!tb) {
        console.log('❌ tournament_brackets table NOT FOUND');
        process.exit(1);
    }

    const tbCols = Object.keys(tb.properties);
    console.log('✅ tournament_brackets columns:', tbCols.join(', '));

    // Verify columns we use in SQL
    const requiredTBCols = ['id', 'tournament_id', 'bracket_number', 'round_number', 'player1_wallet', 'player2_wallet', 'winner_wallet', 'status'];
    const missingTBCols = requiredTBCols.filter(col => !tbCols.includes(col));

    if (missingTBCols.length > 0) {
        console.log('❌ Missing columns in tournament_brackets:', missingTBCols.join(', '));
        process.exit(1);
    }

    console.log('✅ All required tournament_brackets columns exist\n');

    // Check debates table for winner_wallet
    const debates = schema.definitions['debates'];
    const debatesCols = Object.keys(debates.properties);

    if (!debatesCols.includes('winner_wallet')) {
        console.log('❌ debates table missing winner_wallet column');
        process.exit(1);
    }

    console.log('✅ debates.winner_wallet column exists\n');

    // Check if SQL still references old 'matches' table
    if (sqlContent.includes('CREATE TABLE IF NOT EXISTS matches')) {
        console.log('❌ SQL still contains CREATE TABLE matches - should be removed');
        process.exit(1);
    }

    console.log('✅ SQL no longer creates matches table\n');

    // Verify SQL uses correct table
    if (!sqlContent.includes('INSERT INTO tournament_brackets')) {
        console.log('❌ SQL does not insert into tournament_brackets');
        process.exit(1);
    }

    console.log('✅ SQL correctly uses tournament_brackets\n');

    console.log('🎉 ALL VERIFICATIONS PASSED - Safe to execute SQL');

} catch (err) {
    console.error('❌ Verification error:', err.message);
    process.exit(1);
}
