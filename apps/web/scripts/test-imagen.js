const https = require('https');
const fs = require('fs');

const envPath = 'c:\\Dev\\Pontiff\\.env';
console.log('Reading .env from:', envPath);
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

console.log('Testing Imagen with API Key ending in:', apiKey.slice(-4));

function testModel(modelName) {
    return new Promise((resolve) => {
        console.log(`\n--- Testing Model: ${modelName} ---`);

        const data = JSON.stringify({
            instances: [
                { prompt: "A medieval scroll titled Writ of Sin" }
            ],
            parameters: {
                sampleCount: 1,
                aspectRatio: "3:4"
            }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${modelName}:predict?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log('BODY SNAPSHOT:', body.slice(0, 500));
                if (res.statusCode === 200) {
                    console.log('SUCCESS!');
                } else {
                    console.log('FAILED.');
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error('REQUEST ERROR:', e);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    await testModel('gemini-3-pro-image-preview');
    await testModel('gemini-2.0-flash-exp');
}

run();
