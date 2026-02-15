/**
 * PvP Schema Audit Script
 * Queries live Supabase REST API (PostgREST OpenAPI spec) to get the actual
 * database schema, then checks compatibility with our PvP migration SQL.
 * Output: docs/schema_audit.json
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Tables we care about for PvP
const PVP_TABLES = [
    'agent_sessions',
    'pvp_matches',
    'matchmaking_queue',
    'user_balances',
    'balance_transactions',
    'game_seeds',
    'game_history'
];

interface ColumnInfo {
    type: string;
    format: string;
    description?: string;
    default?: any;
    maxLength?: number;
    enum?: string[];
}

interface TableSchema {
    [columnName: string]: ColumnInfo;
}

interface AuditResult {
    timestamp: string;
    supabaseUrl: string;
    totalTablesInDB: number;
    pvpTablesFound: string[];
    pvpTablesMissing: string[];
    schemas: Record<string, TableSchema>;
    compatibility: {
        agent_sessions_has_agent_mode: boolean;
        pvp_matches_exists: boolean;
        matchmaking_queue_exists: boolean;
        pvp_matches_columns: string[];
        matchmaking_queue_columns: string[];
        agent_sessions_columns: string[];
    };
    recommendations: string[];
}

async function auditSchema(): Promise<AuditResult> {
    console.log(`🔍 Querying Supabase schema at: ${SUPABASE_URL}`);
    console.log('─'.repeat(60));

    // Fetch PostgREST OpenAPI spec
    const response = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_KEY}`, {
        headers: {
            'apikey': SUPABASE_KEY!,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch schema: ${response.status} ${response.statusText}`);
    }

    const openApiSpec = await response.json();
    const definitions = openApiSpec.definitions || {};
    const allTableNames = Object.keys(definitions);

    console.log(`📊 Total tables found in database: ${allTableNames.length}`);
    console.log(`📋 Tables: ${allTableNames.join(', ')}`);
    console.log('─'.repeat(60));

    // Extract schemas for PvP-relevant tables
    const schemas: Record<string, TableSchema> = {};
    const pvpTablesFound: string[] = [];
    const pvpTablesMissing: string[] = [];

    for (const tableName of PVP_TABLES) {
        if (definitions[tableName]) {
            pvpTablesFound.push(tableName);
            const props = definitions[tableName].properties || {};
            schemas[tableName] = {};
            for (const [col, spec] of Object.entries(props)) {
                const s = spec as any;
                schemas[tableName][col] = {
                    type: s.type || 'unknown',
                    format: s.format || 'none',
                    ...(s.description && { description: s.description }),
                    ...(s.default !== undefined && { default: s.default }),
                    ...(s.maxLength && { maxLength: s.maxLength }),
                    ...(s.enum && { enum: s.enum })
                };
            }
            console.log(`✅ ${tableName}: ${Object.keys(schemas[tableName]).length} columns`);
            for (const [col, info] of Object.entries(schemas[tableName])) {
                console.log(`   ├─ ${col}: ${info.type} (${info.format})`);
            }
        } else {
            pvpTablesMissing.push(tableName);
            console.log(`❌ ${tableName}: NOT FOUND`);
        }
    }

    // Also capture any extra tables we didn't expect
    const extraTables = allTableNames.filter(t => !PVP_TABLES.includes(t));
    if (extraTables.length > 0) {
        console.log(`\n📎 Other tables in DB: ${extraTables.join(', ')}`);
    }

    // Compatibility checks
    const agentCols = Object.keys(schemas['agent_sessions'] || {});
    const pvpMatchCols = Object.keys(schemas['pvp_matches'] || {});
    const queueCols = Object.keys(schemas['matchmaking_queue'] || {});

    const compatibility = {
        agent_sessions_has_agent_mode: agentCols.includes('agent_mode'),
        pvp_matches_exists: pvpTablesFound.includes('pvp_matches'),
        matchmaking_queue_exists: pvpTablesFound.includes('matchmaking_queue'),
        pvp_matches_columns: pvpMatchCols,
        matchmaking_queue_columns: queueCols,
        agent_sessions_columns: agentCols,
    };

    // Recommendations
    const recommendations: string[] = [];

    if (!compatibility.pvp_matches_exists) {
        recommendations.push('RUN: Section 9 of 001_casino_tables.sql to create pvp_matches table');
    }
    if (!compatibility.matchmaking_queue_exists) {
        recommendations.push('RUN: Section 9 of 001_casino_tables.sql to create matchmaking_queue table');
    }
    if (!compatibility.agent_sessions_has_agent_mode) {
        recommendations.push('RUN: Section 9 of 001_casino_tables.sql to add agent_mode column to agent_sessions');
    }

    // Check for missing enhanced columns
    if (compatibility.pvp_matches_exists) {
        const needed = ['round_data', 'duration_ms', 'house_fee', 'elo_change_p1', 'elo_change_p2'];
        const missing = needed.filter(c => !pvpMatchCols.includes(c));
        if (missing.length > 0) {
            recommendations.push(`ENHANCE pvp_matches: Missing columns: ${missing.join(', ')} — will be added by 002_pvp_enhancements.sql`);
        }
    }

    if (agentCols.length > 0) {
        const neededAgentCols = ['pvp_wins', 'pvp_losses', 'elo_rating', 'pvp_earnings'];
        const missing = neededAgentCols.filter(c => !agentCols.includes(c));
        if (missing.length > 0) {
            recommendations.push(`ENHANCE agent_sessions: Missing PvP stats columns: ${missing.join(', ')} — will be added by 002_pvp_enhancements.sql`);
        }
    }

    if (recommendations.length === 0) {
        recommendations.push('✅ All PvP tables and columns are present. Schema is fully compatible.');
    }

    console.log('\n─'.repeat(60));
    console.log('🎯 RECOMMENDATIONS:');
    recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));

    return {
        timestamp: new Date().toISOString(),
        supabaseUrl: SUPABASE_URL!.replace(/\/\/(.{4}).*?(@|\.supabase)/, '//$1***$2'),
        totalTablesInDB: allTableNames.length,
        pvpTablesFound,
        pvpTablesMissing,
        schemas,
        compatibility,
        recommendations
    };
}

// Run
(async () => {
    try {
        const result = await auditSchema();

        // Write output
        const outputDir = path.join(__dirname, '../../docs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, 'schema_audit.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`\n📁 Full audit saved to: ${outputPath}`);

    } catch (error) {
        console.error('❌ Schema audit failed:', error);
        process.exit(1);
    }
})();
