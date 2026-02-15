const https = require('https');
const fs = require('fs');

const SUPABASE_URL = 'https://rwilifqotgmqkbzkzudh.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
    process.exit(1);
}

const options = {
    hostname: 'rwilifqotgmqkbzkzudh.supabase.co',
    path: '/rest/v1/',
    method: 'GET',
    headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        // This gives us the OpenAPI spec which contains definitions
        console.log("Status:", res.statusCode);
        if (res.statusCode === 200) {
            const definitions = JSON.parse(data).definitions;
            if (definitions && definitions.debates) {
                console.log("DEBATES TABLE SCHEMA:");
                console.log("DEBATES TABLE SCHEMA (Full properties):");
                console.log(JSON.stringify(definitions.debates.properties, null, 2));
            } else {
                console.log("Could not find 'debates' definition in root response, trying Swagger endpoint...");
                fetchSwagger();
            }
        } else {
            console.log("Failed to fetch root, trying Swagger...");
            fetchSwagger();
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();

function fetchSwagger() {
    const swaggerOptions = {
        hostname: 'rwilifqotgmqkbzkzudh.supabase.co',
        path: '/rest/v1/?apikey=' + SERVICE_KEY, // Sometimes acts as swagger
        method: 'GET',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    };

    // Actually, the most reliable way to get schema is an invalid query or introspection.
    // Let's try to just select 1 row from debates and show keys
    const queryOptions = {
        hostname: 'rwilifqotgmqkbzkzudh.supabase.co',
        path: '/rest/v1/debates?select=*&limit=1',
        method: 'GET',
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Range': '0-0'
        }
    };

    const queryReq = https.request(queryOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log("\n=== LIVE ROW DATA (Keys) ===");
            try {
                const json = JSON.parse(data);
                if (Array.isArray(json) && json.length > 0) {
                    console.log(Object.keys(json[0]).join(', '));
                    console.log("\nSample Row:", JSON.stringify(json[0], null, 2));
                } else {
                    console.log("No rows returned or error:", data);
                }
            } catch (e) {
                console.log("Raw output:", data);
            }
        });
    });
    queryReq.end();
}
