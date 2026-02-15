import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

// Dedicated Service for Hybrid Writ Generation
// Architecture: Pollinations (Background) + Sharp (Text Overlay)

export async function generateWritSVG(roast: string, sins: string[], wallet: string): Promise<string> {
  try {
    console.log('Generating Writ: Fetching Blank Scroll...');
    const scrollBuffer = await fetchBlankScroll();

    console.log('Generating Writ: Compositing Text...');
    const finalImageBuffer = await applyRoastToScroll(scrollBuffer, roast, sins, wallet);

    // Return binary string for the route handler
    return finalImageBuffer.toString('binary');
  } catch (error) {
    console.error('Hybrid Writ Generation Failed:', error);
    return generateFallbackSVG(roast);
  }
}

async function fetchBlankScroll(): Promise<Buffer> {
  // Pollinations: Blank Scroll, Flux Model, No Logo
  const prompt = "vertical empty ancient parchment paper texture, dark fantasy style, burnt edges, highly detailed, 8k resolution, no text, empty center";
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=1000&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Pollinations Failed: ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

async function applyRoastToScroll(imageBuffer: Buffer, roast: string, sins: string[], wallet: string): Promise<Buffer> {
  const width = 800;
  const height = 1000;

  // Text Wrapping Helper
  const wrapText = (text: string, maxCharsPerLine: number) => {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      // Safe check for long words
      if (currentLine.length + 1 + (words[i] ? words[i].length : 0) <= maxCharsPerLine) {
        currentLine += " " + words[i];
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const roastLines = wrapText(roast, 32);
  const date = new Date().toLocaleDateString();

  // SVG Overlay Construction
  const svgOverlay = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
            .title { fill: #3a0000; font-family: serif; font-size: 60px; font-weight: bold; text-anchor: middle; }
            .identity { fill: #555; font-family: monospace; font-size: 18px; text-anchor: middle; letter-spacing: 2px; }
            .roast { fill: #1a1a1a; font-family: serif; font-size: 32px; font-style: italic; text-anchor: middle; }
            .sins { fill: #8b0000; font-family: monospace; font-size: 16px; font-weight: bold; text-anchor: middle; }
            .footer { fill: #888; font-family: sans-serif; font-size: 12px; text-anchor: middle; }
        </style>
        
        <!-- Header -->
        <text x="${width / 2}" y="150" class="title">WRIT OF SIN</text>
        <text x="${width / 2}" y="190" class="identity">PENITENT SOUL: ${wallet.slice(0, 6)}...${wallet.slice(-4)}</text>
        
        <!-- Separator -->
        <line x1="200" y1="220" x2="600" y2="220" stroke="#8b0000" stroke-width="2" opacity="0.5"/>

        <!-- The Roast -->
        ${roastLines.map((line, i) =>
    `<text x="${width / 2}" y="${350 + (i * 45)}" class="roast">${line}</text>`
  ).join('')}

        <!-- Sins List -->
        <g transform="translate(0, 750)">
            <text x="${width / 2}" y="0" class="sins">PRIMARY TRANSGRESSIONS</text>
            ${sins.slice(0, 3).map((sin, i) =>
    `<text x="${width / 2}" y="${30 + (i * 25)}" class="sins" fill="#555" font-weight="normal">• ${sin.split(':')[0]} •</text>`
  ).join('')}
        </g>
        
        <!-- Footer / Seal Placeholder -->
        <circle cx="${width / 2}" cy="900" r="40" fill="none" stroke="#8b0000" stroke-width="3" opacity="0.3"/>
        <text x="${width / 2}" y="950" class="footer">VATICAN ARCHIVES // BLOCK ${Math.floor(Date.now() / 1000)}</text>
    </svg>
    `;

  // Composite using Sharp
  // CRITICAL FIX: Force resize to match SVG dimensions before compositing
  const image = await sharp(imageBuffer)
    .resize(width, height, { fit: 'fill' })
    .composite([
      { input: Buffer.from(svgOverlay), top: 0, left: 0 }
    ])
    .toFormat('png')
    .toBuffer();

  return image;
}

function generateFallbackSVG(roast?: string): string {
  // Keep standard fallback logic for extreme failure cases
  // A high-fidelity fallback that mimics the AI generation style
  const id = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
  const roastText = roast ? roast.slice(0, 70) + (roast.length > 70 ? '...' : '') : "The Pontiff has judged your soul unworthy.";

  return `
    <svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1a1a" />
          <stop offset="100%" stop-color="#050505" />
        </linearGradient>
        <linearGradient id="goldText" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f2b90d" />
          <stop offset="100%" stop-color="#b8860b" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#grad1)" stroke="#333" stroke-width="2"/>
      
      <!-- Inner Frame -->
      <rect x="20" y="20" width="560" height="760" fill="none" stroke="#f2b90d" stroke-width="2" opacity="0.8"/>
      <rect x="25" y="25" width="550" height="750" fill="none" stroke="#f2b90d" stroke-width="0.5" opacity="0.4"/>

      <!-- Corner Accents -->
      <path d="M20,100 L20,20 L100,20" fill="none" stroke="#f2b90d" stroke-width="4" filter="url(#glow)"/>
      <path d="M500,20 L580,20 L580,100" fill="none" stroke="#f2b90d" stroke-width="4" filter="url(#glow)"/>
      <path d="M20,700 L20,780 L100,780" fill="none" stroke="#f2b90d" stroke-width="4" filter="url(#glow)"/>
      <path d="M500,780 L580,780 L580,700" fill="none" stroke="#f2b90d" stroke-width="4" filter="url(#glow)"/>

      <!-- Title -->
      <text x="50%" y="150" font-family="serif" font-size="48" fill="url(#goldText)" text-anchor="middle" font-weight="bold" letter-spacing="4" filter="url(#glow)">WRIT OF SIN</text>
      
      <!-- Seal/Icon Area -->
      <circle cx="300" cy="400" r="120" fill="none" stroke="#f2b90d" stroke-width="1" opacity="0.1" stroke-dasharray="5,5"/>
      <circle cx="300" cy="400" r="90" fill="none" stroke="#f2b90d" stroke-width="2" opacity="0.2"/>
      <path d="M300,320 L300,480 M220,400 L380,400" stroke="#f2b90d" stroke-width="1" opacity="0.1"/>
      
      <!-- Identity -->
      <text x="50%" y="280" font-family="monospace" font-size="18" fill="#f2b90d" text-anchor="middle" letter-spacing="2" opacity="0.9">PENITENT SOUL #${id}</text>

      <!-- The Roach (Text) -->
      <foreignObject x="100" y="380" width="400" height="200">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: #f2b90d; font-family: serif; font-size: 24px; font-style: italic; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; opacity: 0.9;">
          "${roastText}"
        </div>
      </foreignObject>

      <!-- Footer -->
      <text x="50%" y="700" font-family="monospace" font-size="14" fill="#f2b90d" text-anchor="middle" letter-spacing="6" opacity="0.5">VATICAN ARCHIVES</text>
      
      <!-- Timestamp (Simulated) -->
      <text x="50%" y="740" font-family="monospace" font-size="10" fill="#ba8e23" text-anchor="middle">BLOCK ${Math.floor(Date.now() / 1000)}</text>
    </svg>
  `;
}
