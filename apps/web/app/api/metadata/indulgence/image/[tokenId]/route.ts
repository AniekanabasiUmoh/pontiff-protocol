import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TIERS: Record<number, { name: string; bg: string; accent: string; glow: string; border: string }> = {
    0: { name: 'Minor',        bg: '#0a1a0f', accent: '#4ade80', glow: '#4ade8066', border: '#166534' },
    1: { name: 'Mortal',       bg: '#1a1500', accent: '#facc15', glow: '#facc1566', border: '#854d0e' },
    2: { name: 'Cardinal',     bg: '#1a0a00', accent: '#f97316', glow: '#f9731666', border: '#9a3412' },
    3: { name: 'Unforgivable', bg: '#1a0000', accent: '#dc2626', glow: '#dc262666', border: '#7f1d1d' },
};

function getTier(tokenId: number) {
    return TIERS[tokenId % 4] || TIERS[0];
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ tokenId: string }> }
) {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = parseInt(tokenIdStr, 10);
    const tier = getTier(isNaN(tokenId) ? 0 : tokenId);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="${tier.glow}"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="600" height="600" fill="${tier.bg}"/>
  <rect width="600" height="600" fill="url(#glow)"/>

  <!-- Border frame -->
  <rect x="16" y="16" width="568" height="568" rx="12" fill="none" stroke="${tier.border}" stroke-width="2" opacity="0.6"/>
  <rect x="24" y="24" width="552" height="552" rx="8" fill="none" stroke="${tier.accent}" stroke-width="1" opacity="0.2"/>

  <!-- Cross symbol -->
  <g transform="translate(300, 220)">
    <rect x="-6" y="-80" width="12" height="160" rx="3" fill="${tier.accent}" opacity="0.9"/>
    <rect x="-50" y="-20" width="100" height="12" rx="3" fill="${tier.accent}" opacity="0.9"/>
    <!-- Glow behind cross -->
    <rect x="-6" y="-80" width="12" height="160" rx="3" fill="${tier.accent}" filter="url(#blur)" opacity="0.4"/>
    <rect x="-50" y="-20" width="100" height="12" rx="3" fill="${tier.accent}" filter="url(#blur)" opacity="0.4"/>
  </g>

  <!-- Decorative circles -->
  <circle cx="300" cy="220" r="110" fill="none" stroke="${tier.accent}" stroke-width="1" opacity="0.15"/>
  <circle cx="300" cy="220" r="130" fill="none" stroke="${tier.accent}" stroke-width="1" opacity="0.08"/>

  <!-- Corner ornaments -->
  <text x="44" y="60" font-family="serif" font-size="28" fill="${tier.accent}" opacity="0.4">✦</text>
  <text x="536" y="60" font-family="serif" font-size="28" fill="${tier.accent}" opacity="0.4" text-anchor="end">✦</text>
  <text x="44" y="578" font-family="serif" font-size="28" fill="${tier.accent}" opacity="0.4">✦</text>
  <text x="536" y="578" font-family="serif" font-size="28" fill="${tier.accent}" opacity="0.4" text-anchor="end">✦</text>

  <!-- Title -->
  <text x="300" y="388" font-family="Georgia, serif" font-size="13" fill="${tier.accent}" opacity="0.5" text-anchor="middle" letter-spacing="6">PONTIFICAL ABSOLUTION</text>

  <!-- NFT Name -->
  <text x="300" y="430" font-family="Georgia, serif" font-size="32" fill="${tier.accent}" text-anchor="middle" font-weight="bold">INDULGENCE</text>
  <text x="300" y="462" font-family="Georgia, serif" font-size="18" fill="${tier.accent}" text-anchor="middle" opacity="0.7">#${isNaN(tokenId) ? '???' : tokenId}</text>

  <!-- Tier badge -->
  <rect x="220" y="492" width="160" height="32" rx="4" fill="${tier.accent}" opacity="0.15" stroke="${tier.accent}" stroke-width="1" opacity="0.3"/>
  <text x="300" y="513" font-family="Georgia, serif" font-size="14" fill="${tier.accent}" text-anchor="middle" letter-spacing="3">${tier.name.toUpperCase()} SIN</text>

  <!-- Token ID small -->
  <text x="300" y="566" font-family="monospace" font-size="10" fill="${tier.accent}" text-anchor="middle" opacity="0.3">PONTIFF.XYZ — ON-CHAIN ABSOLUTION</text>
</svg>`;

    return new NextResponse(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400',
        }
    });
}
