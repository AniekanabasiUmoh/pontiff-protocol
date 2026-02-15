const fs = require('fs');
const sharp = require('sharp'); // Check if this loads
const path = require('path');

async function testHybridGeneration() {
    console.log('1. Testing Sharp Import...');
    console.log(`Sharp Version: ${require('sharp/package.json').version}`);

    console.log('2. Fetching Blank Scroll from Pollinations...');
    const prompt = "vertical empty ancient parchment paper texture, dark fantasy style, burnt edges, highly detailed, 8k resolution, no text, empty center";
    const encodedPrompt = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=1000&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const scrollBuffer = Buffer.from(arrayBuffer);
        console.log(`Scroll Fetched. Size: ${scrollBuffer.length} bytes`);

        fs.writeFileSync('debug_scroll_raw.jpg', scrollBuffer);
        console.log('Saved raw scroll to debug_scroll_raw.jpg');

        console.log('3. creating SVG Overlay...');
        const width = 800;
        const height = 1000;
        const roast = "This is a debug roast to test text wrapping and composition functionality.";

        const svgOverlay = `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
            <style>
                .title { fill: #3a0000; font-family: serif; font-size: 60px; font-weight: bold; text-anchor: middle; }
                .roast { fill: #1a1a1a; font-family: serif; font-size: 32px; font-style: italic; text-anchor: middle; }
            </style>
            <text x="${width / 2}" y="150" class="title">WRIT OF SIN</text>
            <text x="${width / 2}" y="500" class="roast">${roast}</text>
        </svg>
        `;

        console.log('4. Compositing with Sharp...');
        const finalImage = await sharp(scrollBuffer)
            .composite([
                { input: Buffer.from(svgOverlay), top: 0, left: 0 }
            ])
            .toFormat('png')
            .toBuffer();

        console.log(`Composition Success! Final Size: ${finalImage.length}`);
        fs.writeFileSync('debug_writ_final.png', finalImage);
        console.log('Saved final image to debug_writ_final.png');

    } catch (e) {
        console.error('ERROR:', e);
    }
}

testHybridGeneration();
