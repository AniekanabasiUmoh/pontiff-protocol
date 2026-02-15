const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// 1. Load Environment Variables
const envPath = 'c:\\Dev\\Pontiff\\.env';
console.log('--- ENVIROMENT SETUP ---');
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
    console.error('FAILED to read .env file:', e.message);
    process.exit(1);
}

if (!apiKey) {
    console.error('CRITICAL: NO API KEY FOUND in .env');
    process.exit(1);
}
console.log('API Key loaded. Ends with:', apiKey.slice(-4));

// 2. Define the Function (Mirrors writ-service.ts)
async function generateWritSVG(roast, sins, wallet) {
    // Model Selection: gemini-2.0-flash is reliably available on free tier.
    // gemini-1.5-pro was failing.
    const modelName = 'gemini-2.0-flash';

    try {
        console.log('\n--- STARTING GENERATION ---');
        console.log(`Model: ${modelName}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `
          You are the "Pontiff's Royal Scribe & Artificer".
          Generate the code for a **High-Fidelity Detailed SVG** (Scalable Vector Graphics) representing a "Writ of Sin".
          
          VISUAL STYLE:
          - Dark Fantasy, Cyber-Gothic, Religious Tech.
          - Colors: Deep Obsidian (#0c0a05), Holy Gold (#f2b90d), Faint Red accents (#3a0000).
          - TEXTURE: Use SVG <filter> (turbulence, lighting) to simulate rough, ancient parchment texture.
          
          CONTENTS:
          1. Title: "WRIT OF JUDGMENT" (Gothic, Gold, Glowing).
          2. Identity: "PENITENT SOUL" (Anonymous).
          3. Sins:
              ${sins.map(s => `- ${s}`).join('\n              ')}
          4. Roast: "${roast.slice(0, 100)}..." (Italic, serif, centered).
          5. Decorative: Complex border patterns, circuit-board lines mixed with gothic arches.
          
          TECHNICAL SPECS:
          - Width: 600, Height: 800.
          - Result must be a single valid <svg> string.
          - Do NOT use external images. Use only vectors and filters.
          - Return ONLY the SVG code. No markdown blocks.
        `;

        console.log('Sending prompt to Gemini...');
        const result = await model.generateContent(prompt);
        console.log('Response received.');

        const response = await result.response;
        let svg = response.text();
        console.log('Raw Response Length:', svg.length);

        // CLEANUP LOGIC TESTING
        console.log('\n--- CLEANUP ---');
        let cleanSvg = svg.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '').trim();
        console.log('Cleaned Text Starts With:', cleanSvg.slice(0, 20));

        // REGEX EXTRACTION (Better Robustness)
        const svgMatch = cleanSvg.match(/<svg[\s\S]*?<\/svg>/);
        if (svgMatch) {
            console.log('REGEX MATCH FOUND!');
            cleanSvg = svgMatch[0];
        } else {
            console.warn('WARNING: Regex could not find <svg>...</svg> block.');
        }

        if (!cleanSvg.includes('<svg')) {
            throw new Error('Validation Failed: Does not contain <svg tag');
        }

        console.log('\n--- SUCCESS ---');
        console.log('Final SVG Length:', cleanSvg.length);
        fs.writeFileSync('debug-output.svg', cleanSvg);
        console.log('Saved to debug-output.svg');
        return cleanSvg;

    } catch (error) {
        console.error('\n!!! GENERATION FAILED !!!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.response) {
            console.error('API Error Details:', JSON.stringify(error.response, null, 2));
        }
        return null;
    }
}

// 3. Run It
generateWritSVG(
    "You are a degend who bought the top. Pathetic.",
    ["Greed: 1000 txs", "Sloth: 0 balance"],
    "0x123...456"
);
