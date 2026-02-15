const https = require('https');
const fs = require('fs');

const envPath = 'c:\\Dev\\Pontiff\\.env';
let apiKey = '';

try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
        if (line.startsWith('GOOGLE_API_KEY=')) {
            apiKey = line.split('=')[1].trim();
        } else if (line.startsWith('GEMINI_API_KEY=') && !apiKey) {
            apiKey = line.split('=')[1].trim();
        }
    }
} catch (e) {
    console.error('Could not read .env file');
}

if (!apiKey) {
    console.error('NO API KEY FOUND');
    process.exit(1);
}

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models?key=${apiKey}`,
    method: 'GET'
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const data = JSON.parse(body);
            if (data.models) {
                console.log('AVAILABLE MODELS (FULL):');
                // Print names only to save space but ensure we see them all
                console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
            } else {
                console.log('NO MODELS FOUND OR ERROR:', body);
            }
        } catch (e) {
            console.error('PARSE ERROR:', e);
            console.log('RAW BODY:', body);
        }
    });
});

req.on('error', (e) => {
    console.error('REQUEST ERROR:', e);
});

req.end();
