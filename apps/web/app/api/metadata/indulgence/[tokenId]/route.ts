import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

const SIN_TIERS: Record<number, { name: string; color: string; rarity: string; price: string }> = {
    0: { name: 'Minor',        color: '#4ade80', rarity: 'Common',    price: '50 GUILT'  },
    1: { name: 'Mortal',       color: '#facc15', rarity: 'Uncommon',  price: '100 GUILT' },
    2: { name: 'Cardinal',     color: '#f97316', rarity: 'Rare',      price: '250 GUILT' },
    3: { name: 'Unforgivable', color: '#dc2626', rarity: 'Legendary', price: '500 GUILT' },
};

function getTierFromTokenId(tokenId: number) {
    // Assign tier based on token ID ranges (can be made dynamic from DB)
    if (tokenId % 4 === 3) return SIN_TIERS[3];
    if (tokenId % 4 === 2) return SIN_TIERS[2];
    if (tokenId % 4 === 1) return SIN_TIERS[1];
    return SIN_TIERS[0];
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ tokenId: string }> }
) {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = parseInt(tokenIdStr, 10);

    if (isNaN(tokenId) || tokenId < 0) {
        return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    // Try to look up real data from DB
    let absolvedWallet = '0x0000000000000000000000000000000000000000';
    let sinType = 'Unknown';
    let tier = getTierFromTokenId(tokenId);

    try {
        const supabase = createServerSupabase();
        const { data } = await supabase
            .from('indulgences')
            .select('wallet_address, sin_type, tier')
            .eq('token_id', tokenId)
            .single();

        if (data) {
            absolvedWallet = data.wallet_address || absolvedWallet;
            sinType = data.sin_type || sinType;
            const dbTierIndex = ['minor', 'mortal', 'cardinal', 'unforgivable'].indexOf(
                (data.tier || '').toLowerCase()
            );
            if (dbTierIndex >= 0) tier = SIN_TIERS[dbTierIndex];
        }
    } catch {
        // DB lookup optional — fall back to derived values
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://api.pontiff.xyz'}/api/metadata/indulgence/image/${tokenId}`;

    return NextResponse.json({
        name: `Pontiff Indulgence #${tokenId}`,
        description: `A sacred Indulgence of ${tier.name} sin, granted by The Pontiff. This soul has been absolved and recorded on-chain. ${tier.name === 'Unforgivable' ? 'Even the unforgivable may find mercy — at a price.' : 'May they sin no more.'}`,
        image: imageUrl,
        external_url: `https://api.pontiff.xyz/indulgences/${tokenId}`,
        attributes: [
            { trait_type: 'Tier',            value: tier.name     },
            { trait_type: 'Rarity',          value: tier.rarity   },
            { trait_type: 'Sin Type',        value: sinType       },
            { trait_type: 'Price Paid',      value: tier.price    },
            { trait_type: 'Absolved Wallet', value: absolvedWallet },
            { trait_type: 'Token ID',        value: tokenId       },
            { display_type: 'date', trait_type: 'Absolution Date', value: Math.floor(Date.now() / 1000) },
        ],
    }, {
        headers: {
            'Cache-Control': 'public, max-age=3600',
            'Content-Type': 'application/json',
        }
    });
}
