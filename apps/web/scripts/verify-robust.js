const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// 1. Load Environment Variables
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
    console.error('FAILED to read .env file');
}

if (!apiKey) {
    console.error('CRITICAL: NO API KEY FOUND');
    process.exit(1);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWritSVGRobust(roast, sins) {
    const genAI = new GoogleGenerativeAI(apiKey);
    // models to retry
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const modelName of modelsToTry) {
        console.log(`\n-----------------------------------`);
        console.log(`Trying Model: ${modelName}`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = `Generate a simple SVG circle with text "TEST" inside. Return ONLY SVG.`;

            let attempts = 0;
            while (attempts < 3) {
                try {
                    console.log(`Attempt ${attempts + 1}...`);
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    let svg = response.text();
                    console.log('Success! Response length:', svg.length);
                    return svg;
                } catch (e) {
                    console.error(`Error on attempt ${attempts + 1}: ${e.message}`);
                    if (e.message && (e.message.includes('429') || e.status === 429)) {
                        console.warn(`Rate limit hit. Waiting 5s...`);
                        await delay(5000);
                        attempts++;
                    } else {
                        throw e; // Break inner loop to try next model
                    }
                }
            }
        } catch (error) {
            console.error(`Failed with ${modelName}, moving to next.`);
        }
    }
    console.error('ALL MODELS FAILED.');
}

generateWritSVGRobust("test", ["sin1"]);
