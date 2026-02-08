import { GoogleGenerativeAI } from '@google/generative-ai';
import QRCode from 'qrcode';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Initialize Google Gemini client for image generation
 */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * Generate a medieval "Writ of Indulgence" image using Gemini 3 Flash Image
 * 
 * @param roast - The roast text to display on the writ
 * @param walletAddress - The sinner's wallet address
 * @param confessionId - Unique ID for this confession
 * @returns Base64 encoded image data
 */
export async function generateWritImage(
  roast: string,
  walletAddress: string,
  confessionId: string
): Promise<string> {
  try {
    // Note: Gemini 3 Flash Image is text-to-image generation
    // For now, we'll use a placeholder approach
    // TODO: When Gemini 3 Flash Image API is available, replace with actual implementation

    const prompt = buildWritPrompt(roast, walletAddress);

    console.log('🎨 Generating Writ image with Gemini...');

    // Placeholder: Return mock image data
    // In production, this would call Gemini 3 Flash Image API
    const imageData = await generateMockWritImage(roast, walletAddress, confessionId);

    return imageData;
  } catch (error) {
    console.error('Failed to generate writ image:', error);
    throw new Error('Image generation failed');
  }
}

/**
 * Build detailed prompt for Gemini image generation
 */
function buildWritPrompt(roast: string, walletAddress: string): string {
  const shortWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  return `Create a highly detailed medieval "Writ of Indulgence" parchment document:

OVERALL STYLE:
- Ancient, aged parchment texture (yellowed, slightly stained)
- Weathered edges with slight tears and wear
- Realistic paper texture with visible fibers
- Dramatic candlelight illumination from top-left
- Shadows and depth to give 3D effect
- Make it look like a physical document from 1400s

BORDER & DECORATIONS:
- Ornate gothic border with intricate flourishes
- Corner decorations with medieval religious symbols
- Gold leaf accents (faded and worn)
- Small illuminated capital letter at start of text
- Decorative separator lines between sections

HEADER SECTION:
- Title at top center: "WRIT OF INDULGENCE"
- Old English/Gothic blackletter font
- Slightly faded ink, hand-written appearance
- Small cross symbol above title

MAIN TEXT (CENTER):
"${roast}"
- Large, readable gothic font
- Centered on page
- Ink should look slightly faded but still legible
- Hand-written calligraphy style

FOOTER SECTION:
- Left side: "Sinner: ${shortWallet}"
- Right side: Date in Roman numerals
- Bottom center: Small text "By Papal Authority of The Pontiff"
- Very small $GUILT symbol watermark

SEAL:
- Bottom right corner: Red wax seal impression
- Seal shows "$GUILT" in circular border
- Slightly melted/imperfect edges
- 3D embossed effect

ADDITIONAL DETAILS:
- Add coffee stains or water marks for authenticity
- Slight curl/wave to the parchment edges
- Creases and fold marks
- Make it look like it's been handled and aged for centuries

COLOR PALETTE:
- Parchment: Cream to light brown (#F4E8D0 to #D4BC8B)
- Ink: Dark brown/black (#2C1810)
- Gold accents: Tarnished gold (#B8860B)
- Wax seal: Deep red (#8B0000)

Make it dramatic, authentic, and slightly humorous. This should look like a real medieval document with a crypto twist.`;
}

/**
 * Generate mock writ image data for development
 * This simulates what Gemini 3 Flash Image would return
 */
async function generateMockWritImage(
  roast: string,
  walletAddress: string,
  confessionId: string
): Promise<string> {
  // Generate QR code linking to confession page
  const confessionUrl = `https://confess.pontiff.xyz/${confessionId}`;
  const qrCodeDataUrl = await QRCode.toDataURL(confessionUrl, {
    width: 150,
    margin: 1,
    color: {
      dark: '#2C1810',  // Dark brown (matches parchment ink)
      light: '#F4E8D0'  // Parchment color (transparent-looking)
    }
  });

  const shortWallet = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create SVG with medieval aesthetic
  const svg = `
<svg width="800" height="1000" xmlns="http://www.w3.org/2000/svg">
  <!-- Parchment background -->
  <defs>
    <linearGradient id="parchment" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#F4E8D0;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#E8D4B0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#D4BC8B;stop-opacity:1" />
    </linearGradient>
    
    <!-- Border pattern -->
    <pattern id="border" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#8B6914" opacity="0.3"/>
      <path d="M0,10 L10,0 L20,10 L10,20 Z" fill="#B8860B" opacity="0.4"/>
    </pattern>
  </defs>
  
  <!-- Main parchment -->
  <rect width="800" height="1000" fill="url(#parchment)"/>
  
  <!-- Ornate border -->
  <rect x="20" y="20" width="760" height="960" fill="none" stroke="url(#border)" stroke-width="8"/>
  <rect x="40" y="40" width="720" height="920" fill="none" stroke="#8B6914" stroke-width="2"/>
  
  <!-- Corner decorations -->
  <circle cx="60" cy="60" r="15" fill="#B8860B" opacity="0.6"/>
  <circle cx="740" cy="60" r="15" fill="#B8860B" opacity="0.6"/>
  <circle cx="60" cy="940" r="15" fill="#B8860B" opacity="0.6"/>
  <circle cx="740" cy="940" r="15" fill="#B8860B" opacity="0.6"/>
  
  <!-- Title -->
  <text x="400" y="120" font-family="serif" font-size="48" font-weight="bold" 
        text-anchor="middle" fill="#2C1810" style="text-transform: uppercase; letter-spacing: 4px;">
    WRIT OF INDULGENCE
  </text>
  
  <!-- Cross symbol -->
  <path d="M 395,70 L 405,70 L 405,85 L 420,85 L 420,95 L 405,95 L 405,110 L 395,110 L 395,95 L 380,95 L 380,85 L 395,85 Z" 
        fill="#8B0000" opacity="0.7"/>
  
  <!-- Decorative line -->
  <line x1="150" y1="150" x2="650" y2="150" stroke="#8B6914" stroke-width="2"/>
  
  <!-- Main roast text (word-wrapped) -->
  <foreignObject x="100" y="200" width="600" height="400">
    <div xmlns="http://www.w3.org/1999/xhtml" style="
      font-family: 'Georgia', serif;
      font-size: 28px;
      color: #2C1810;
      text-align: center;
      line-height: 1.6;
      padding: 20px;
      font-style: italic;
    ">
      ${roast}
    </div>
  </foreignObject>
  
  <!-- Decorative line -->
  <line x1="150" y1="650" x2="650" y2="650" stroke="#8B6914" stroke-width="2"/>
  
  <!-- Footer - Sinner info -->
  <text x="120" y="720" font-family="serif" font-size="20" fill="#2C1810">
    Sinner: ${shortWallet}
  </text>
  
  <!-- Footer - Date -->
  <text x="680" y="720" font-family="serif" font-size="20" text-anchor="end" fill="#2C1810">
    ${date}
  </text>
  
  <!-- Papal authority -->
  <text x="400" y="800" font-family="serif" font-size="16" text-anchor="middle" 
        fill="#2C1810" opacity="0.8" style="font-style: italic;">
    By Papal Authority of The Pontiff
  </text>
  
  <!-- QR Code (Embedded) -->
  <image href="${qrCodeDataUrl}" x="325" y="840" width="150" height="150"/>
  <text x="400" y="1005" font-family="serif" font-size="12" text-anchor="middle" fill="#2C1810" font-style="italic">
    Scan to View Confession
  </text>
  
  <!-- Wax seal (bottom right) -->
  <circle cx="680" cy="900" r="50" fill="#8B0000" opacity="0.8"/>
  <circle cx="680" cy="900" r="40" fill="none" stroke="#600000" stroke-width="2"/>
  <text x="680" y="910" font-family="serif" font-size="20" font-weight="bold" 
        text-anchor="middle" fill="#FFF" opacity="0.9">
    $GUILT
  </text>
  
  <!-- Aging effects -->
  <rect width="800" height="1000" fill="white" opacity="0.05"/>
  <circle cx="200" cy="300" r="30" fill="#8B6914" opacity="0.1"/>
  <circle cx="600" cy="700" r="40" fill="#8B6914" opacity="0.08"/>
</svg>`;

  // Convert SVG to base64 data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Validate image data
 */
export function validateImageData(imageData: string): boolean {
  if (!imageData || imageData.length === 0) {
    return false;
  }

  // Check if it's a valid data URL
  if (!imageData.startsWith('data:image/')) {
    return false;
  }

  return true;
}

/**
 * Get image file extension from data URL
 */
export function getImageExtension(imageData: string): string {
  if (imageData.startsWith('data:image/svg+xml')) return 'svg';
  if (imageData.startsWith('data:image/png')) return 'png';
  if (imageData.startsWith('data:image/jpeg')) return 'jpg';
  return 'png'; // default
}

/**
 * Generate an Absolution Certificate image
 * This is different from the Writ - it's an elegant certificate of forgiveness
 *
 * @param tokenId - The NFT token ID
 * @param ownerAddress - The wallet address of the absolved
 * @param severity - The sin severity level (Minor, Mortal, Cardinal, Unforgivable)
 * @param isRevoked - Whether the absolution has been revoked
 * @returns Base64 encoded image data
 */
export async function generateCertificateImage(
  tokenId: string,
  ownerAddress: string,
  severity: string,
  isRevoked: boolean = false
): Promise<string> {
  try {
    console.log(`🎨 Generating ${isRevoked ? 'REVOKED' : 'Absolution'} certificate for token #${tokenId}...`);

    if (isRevoked) {
      return generateRevokedCertificate(tokenId, ownerAddress, severity);
    }

    return generateAbsolutionCertificate(tokenId, ownerAddress, severity);
  } catch (error) {
    console.error('Failed to generate certificate:', error);
    throw new Error('Certificate generation failed');
  }
}

/**
 * Generate an elegant Absolution Certificate
 */
async function generateAbsolutionCertificate(
  tokenId: string,
  ownerAddress: string,
  severity: string
): Promise<string> {
  const shortWallet = `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`;
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Severity colors and descriptions
  const severityConfig = {
    Minor: { color: '#4A9B4A', title: 'Minor Sin' },
    Mortal: { color: '#D97706', title: 'Mortal Sin' },
    Cardinal: { color: '#DC2626', title: 'Cardinal Sin' },
    Unforgivable: { color: '#7C2D12', title: 'Unforgivable Sin' },
  };

  const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.Minor;

  // Create elegant certificate SVG
  const svg = `
<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FDF8F3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F5EDE3;stop-opacity:1" />
    </linearGradient>

    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#B8860B;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#DAA520;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>

    <!-- Shadow filter -->
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
      <feOffset dx="2" dy="2" result="offsetblur"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Main background -->
  <rect width="1200" height="900" fill="url(#bgGradient)"/>

  <!-- Decorative gold border -->
  <rect x="40" y="40" width="1120" height="820" fill="none" stroke="url(#goldGradient)" stroke-width="12" rx="10"/>
  <rect x="60" y="60" width="1080" height="780" fill="none" stroke="#C9A961" stroke-width="3" rx="8"/>

  <!-- Corner flourishes -->
  <circle cx="100" cy="100" r="30" fill="#DAA520" opacity="0.3"/>
  <circle cx="1100" cy="100" r="30" fill="#DAA520" opacity="0.3"/>
  <circle cx="100" cy="800" r="30" fill="#DAA520" opacity="0.3"/>
  <circle cx="1100" cy="800" r="30" fill="#DAA520" opacity="0.3"/>

  <!-- Top seal/emblem -->
  <circle cx="600" cy="120" r="50" fill="#8B0000" opacity="0.9"/>
  <circle cx="600" cy="120" r="42" fill="none" stroke="#DAA520" stroke-width="2"/>
  <text x="600" y="132" font-family="serif" font-size="24" font-weight="bold"
        text-anchor="middle" fill="#FFF">
    ⛪
  </text>

  <!-- Header -->
  <text x="600" y="230" font-family="serif" font-size="56" font-weight="bold"
        text-anchor="middle" fill="#2C1810" letter-spacing="6">
    CERTIFICATE OF ABSOLUTION
  </text>

  <!-- Decorative underline -->
  <line x1="300" y1="250" x2="900" y2="250" stroke="url(#goldGradient)" stroke-width="3"/>

  <!-- Main text -->
  <text x="600" y="330" font-family="serif" font-size="28" text-anchor="middle"
        fill="#4A4A4A" style="font-style: italic;">
    By the Grace of The Pontiff
  </text>

  <text x="600" y="380" font-family="serif" font-size="24" text-anchor="middle" fill="#4A4A4A">
    Let it be known throughout the realm that
  </text>

  <!-- Wallet address (highlighted) -->
  <rect x="300" y="410" width="600" height="60" fill="#FFF" stroke="${config.color}"
        stroke-width="3" rx="5" filter="url(#shadow)"/>
  <text x="600" y="450" font-family="monospace" font-size="32" font-weight="bold"
        text-anchor="middle" fill="${config.color}">
    ${shortWallet}
  </text>

  <!-- Body text -->
  <text x="600" y="530" font-family="serif" font-size="24" text-anchor="middle" fill="#4A4A4A">
    has confessed their sins before The Cathedral,
  </text>

  <text x="600" y="570" font-family="serif" font-size="24" text-anchor="middle" fill="#4A4A4A">
    paid penance in sacred $GUILT tokens,
  </text>

  <text x="600" y="610" font-family="serif" font-size="24" text-anchor="middle" fill="#4A4A4A">
    and is hereby granted Divine Absolution for
  </text>

  <!-- Sin severity (highlighted) -->
  <rect x="400" y="630" width="400" height="50" fill="${config.color}" opacity="0.1"
        stroke="${config.color}" stroke-width="2" rx="5"/>
  <text x="600" y="665" font-family="serif" font-size="32" font-weight="bold"
        text-anchor="middle" fill="${config.color}">
    ${config.title.toUpperCase()}
  </text>

  <!-- Footer text -->
  <text x="600" y="730" font-family="serif" font-size="20" text-anchor="middle"
        fill="#4A4A4A" style="font-style: italic;">
    This indulgence is eternal, soulbound, and cannot be transferred.
  </text>

  <!-- Signature line -->
  <line x1="200" y1="790" x2="500" y2="790" stroke="#4A4A4A" stroke-width="2"/>
  <text x="350" y="820" font-family="serif" font-size="18" text-anchor="middle"
        fill="#4A4A4A" style="font-style: italic;">
    The Pontiff
  </text>

  <!-- Token ID and Date -->
  <text x="900" y="810" font-family="serif" font-size="18" text-anchor="middle" fill="#4A4A4A">
    Token #${tokenId}
  </text>
  <text x="900" y="835" font-family="serif" font-size="16" text-anchor="middle"
        fill="#6B7280">
    ${date}
  </text>

  <!-- Wax seal (bottom left) -->
  <circle cx="200" cy="810" r="45" fill="#8B0000" opacity="0.8"/>
  <circle cx="200" cy="810" r="35" fill="none" stroke="#600000" stroke-width="2"/>
  <text x="200" y="822" font-family="serif" font-size="20" font-weight="bold"
        text-anchor="middle" fill="#FFF" opacity="0.9">
    $GUILT
  </text>
</svg>`;

  // Convert SVG to base64 data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Generate a REVOKED certificate (burned/crossed out)
 */
async function generateRevokedCertificate(
  tokenId: string,
  ownerAddress: string,
  severity: string
): Promise<string> {
  const shortWallet = `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`;
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create dramatic revoked certificate
  const svg = `
<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <!-- Dark background -->
  <defs>
    <linearGradient id="darkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1F1F1F;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
    </linearGradient>

    <!-- Burn effect -->
    <filter id="burn">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" />
    </filter>
  </defs>

  <!-- Main background -->
  <rect width="1200" height="900" fill="url(#darkGradient)"/>

  <!-- Charred border -->
  <rect x="40" y="40" width="1120" height="820" fill="none" stroke="#8B0000"
        stroke-width="8" rx="10" filter="url(#burn)"/>

  <!-- Large "EXCOMMUNICATED" stamp -->
  <rect x="250" y="350" width="700" height="200" fill="#8B0000" opacity="0.3"
        transform="rotate(-15 600 450)" stroke="#8B0000" stroke-width="8"/>
  <text x="600" y="480" font-family="serif" font-size="96" font-weight="bold"
        text-anchor="middle" fill="#DC2626" transform="rotate(-15 600 480)"
        letter-spacing="8">
    EXCOMMUNICATED
  </text>

  <!-- Top seal/emblem -->
  <circle cx="600" cy="120" r="50" fill="#000" opacity="0.9" stroke="#8B0000" stroke-width="3"/>
  <text x="600" y="132" font-family="serif" font-size="24" font-weight="bold"
        text-anchor="middle" fill="#8B0000">
    ✞
  </text>

  <!-- Header -->
  <text x="600" y="220" font-family="serif" font-size="48" font-weight="bold"
        text-anchor="middle" fill="#DC2626" letter-spacing="4">
    ABSOLUTION REVOKED
  </text>

  <!-- Decorative line -->
  <line x1="300" y1="240" x2="900" y2="240" stroke="#8B0000" stroke-width="3"/>

  <!-- Notice text -->
  <text x="600" y="620" font-family="serif" font-size="28" text-anchor="middle"
        fill="#DC2626" font-weight="bold">
    ${shortWallet}
  </text>

  <text x="600" y="670" font-family="serif" font-size="24" text-anchor="middle"
        fill="#B91C1C" style="font-style: italic;">
    has violated the sacred covenant
  </text>

  <text x="600" y="710" font-family="serif" font-size="24" text-anchor="middle"
        fill="#B91C1C" style="font-style: italic;">
    and stands CAST OUT from the faith
  </text>

  <!-- Large X through the certificate -->
  <line x1="100" y1="100" x2="1100" y2="800" stroke="#DC2626" stroke-width="20" opacity="0.5"/>
  <line x1="1100" y1="100" x2="100" y2="800" stroke="#DC2626" stroke-width="20" opacity="0.5"/>

  <!-- Footer -->
  <text x="600" y="780" font-family="serif" font-size="20" text-anchor="middle"
        fill="#9CA3AF" style="font-style: italic;">
    Token #${tokenId} • Revoked ${date}
  </text>

  <!-- Warning seal -->
  <circle cx="600" cy="820" r="40" fill="#8B0000" opacity="0.8" stroke="#000" stroke-width="2"/>
  <text x="600" y="810" font-family="serif" font-size="32" text-anchor="middle" fill="#FFF">
    ⚠
  </text>
  <text x="600" y="840" font-family="serif" font-size="16" font-weight="bold"
        text-anchor="middle" fill="#FFF">
    VOID
  </text>
</svg>`;

  // Convert SVG to base64 data URL
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
