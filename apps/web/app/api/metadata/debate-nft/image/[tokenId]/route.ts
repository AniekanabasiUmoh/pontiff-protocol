import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ tokenId: string }> }
) {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = parseInt(tokenIdStr, 10);
    const displayId = isNaN(tokenId) ? '???' : tokenId;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <radialGradient id="glow" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#d4af3733"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4af37"/>
      <stop offset="50%" stop-color="#f5d469"/>
      <stop offset="100%" stop-color="#b8962e"/>
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
    <filter id="softblur">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="600" height="600" fill="#0d0a00"/>
  <rect width="600" height="600" fill="url(#glow)"/>

  <!-- Outer border -->
  <rect x="14" y="14" width="572" height="572" rx="14" fill="none" stroke="#d4af37" stroke-width="1.5" opacity="0.4"/>
  <rect x="22" y="22" width="556" height="556" rx="10" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.15"/>

  <!-- Victory laurels (left) -->
  <g transform="translate(168, 210)" opacity="0.7">
    <ellipse cx="0" cy="-40" rx="8" ry="20" fill="none" stroke="#d4af37" stroke-width="1.5" transform="rotate(-30)"/>
    <ellipse cx="0" cy="-40" rx="8" ry="20" fill="none" stroke="#d4af37" stroke-width="1.5" transform="rotate(-10)"/>
    <ellipse cx="0" cy="-40" rx="8" ry="20" fill="none" stroke="#d4af37" stroke-width="1.5" transform="rotate(10)"/>
    <ellipse cx="0" cy="-40" rx="8" ry="20" fill="none" stroke="#d4af37" stroke-width="1.5" transform="rotate(30)"/>
    <line x1="0" y1="0" x2="-30" y2="-60" stroke="#d4af37" stroke-width="1" opacity="0.5"/>
  </g>

  <!-- Victory laurels (right) -->
  <g transform="translate(432, 210) scale(-1,1)" opacity="0.7">
    <ellipse cx="0" cy="-40" rx="8" ry="20" fill="none" stroke="#d4af37" stroke-width="1.5" transform="rotate(-30)"/>
    <ellipse cx="0" cy="-40" rx="8" ry="20" fill="none" stroke="#d4af37" stroke-width="1.5" transform="rotate(-10)"/>
    <ellipse cx="0" cy="-40" rx="8" ry="20" fill="none" stroke="#d4af37" stroke-width="1.5" transform="rotate(10)"/>
    <ellipse cx="0" cy="-40" rx="8" ry="20" fill="none" stroke="#d4af37" stroke-width="1.5" transform="rotate(30)"/>
    <line x1="0" y1="0" x2="-30" y2="-60" stroke="#d4af37" stroke-width="1" opacity="0.5"/>
  </g>

  <!-- Crown / trophy icon -->
  <g transform="translate(300, 200)">
    <!-- Glow -->
    <polygon points="0,-70 -55,-20 -40,30 40,30 55,-20" fill="#d4af37" filter="url(#blur)" opacity="0.3"/>
    <!-- Crown shape -->
    <polygon points="0,-70 -55,-20 -40,30 40,30 55,-20" fill="none" stroke="url(#gold)" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- Crown points -->
    <circle cx="0" cy="-70" r="5" fill="url(#gold)"/>
    <circle cx="-55" cy="-20" r="4" fill="url(#gold)"/>
    <circle cx="55" cy="-20" r="4" fill="url(#gold)"/>
    <!-- Base band -->
    <rect x="-45" y="18" width="90" height="12" rx="2" fill="url(#gold)" opacity="0.8"/>
    <!-- Gem in center -->
    <polygon points="0,-48 -10,-32 0,-22 10,-32" fill="#dc2626" opacity="0.9"/>
    <polygon points="0,-48 -10,-32 0,-22 10,-32" fill="#dc2626" filter="url(#softblur)" opacity="0.5"/>
  </g>

  <!-- Divider line -->
  <line x1="80" y1="300" x2="520" y2="300" stroke="#d4af37" stroke-width="1" opacity="0.2"/>
  <text x="300" y="295" font-family="serif" font-size="10" fill="#d4af37" text-anchor="middle" opacity="0.4" letter-spacing="8">⬧ ⬧ ⬧</text>

  <!-- Label -->
  <text x="300" y="348" font-family="Georgia, serif" font-size="11" fill="#d4af37" opacity="0.5" text-anchor="middle" letter-spacing="6">THEOLOGICAL VICTORY</text>

  <!-- Title -->
  <text x="300" y="392" font-family="Georgia, serif" font-size="30" fill="url(#gold)" text-anchor="middle" font-weight="bold">DEBATE VICTORY</text>
  <text x="300" y="422" font-family="Georgia, serif" font-size="16" fill="#d4af37" text-anchor="middle" opacity="0.6">NFT  #${displayId}</text>

  <!-- Bottom badge -->
  <rect x="190" y="452" width="220" height="34" rx="5" fill="#d4af3715" stroke="#d4af37" stroke-width="1" opacity="0.4"/>
  <text x="300" y="474" font-family="Georgia, serif" font-size="12" fill="#d4af37" text-anchor="middle" letter-spacing="3" opacity="0.8">HERESY DEFEATED</text>

  <!-- Footer -->
  <text x="300" y="566" font-family="monospace" font-size="10" fill="#d4af37" text-anchor="middle" opacity="0.25">PONTIFF.XYZ — ON-CHAIN VICTORY</text>
</svg>`;

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400',
        }
    });
}
