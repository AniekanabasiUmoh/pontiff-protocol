import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ tokenId: string }> }
) {
    const { tokenId: tokenIdStr } = await params;
    const tokenId = parseInt(tokenIdStr, 10);

    if (isNaN(tokenId) || tokenId < 0) {
        return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
    }

    // Defaults
    let topic = 'A Great Theological Debate';
    let winner = '0x0000000000000000000000000000000000000000';
    let debateDate = new Date().toISOString();
    let exchanges = 0;
    let agentHandle = 'Unknown Heretic';

    try {
        const supabase = createServerSupabase();
        const { data } = await supabase
            .from('debates')
            .select(`
                topic, winner_wallet, ended_at, exchanges, nft_token_id,
                competitor_agents (twitter_handle, name)
            `)
            .eq('nft_token_id', String(tokenId))
            .single();

        if (data) {
            topic = data.topic || topic;
            winner = data.winner_wallet || winner;
            debateDate = data.ended_at || debateDate;
            exchanges = data.exchanges || exchanges;
            const agent = (data as any).competitor_agents;
            agentHandle = agent?.twitter_handle || agent?.name || agentHandle;
        }
    } catch {
        // DB lookup optional
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://api.pontiff.xyz'}/api/metadata/debate-nft/image/${tokenId}`;
    const shortWinner = winner.slice(0, 6) + '...' + winner.slice(-4);

    return NextResponse.json({
        name: `Debate Victory NFT #${tokenId}`,
        description: `A Victory NFT awarded to the winner of a Theological Debate on The Pontiff Protocol. Topic: "${topic}". The heretic ${agentHandle} was defeated after ${exchanges} exchanges. Victory is eternal, inscribed on-chain.`,
        image: imageUrl,
        external_url: `https://api.pontiff.xyz/debates/${tokenId}`,
        attributes: [
            { trait_type: 'Debate Topic',    value: topic        },
            { trait_type: 'Opponent',        value: agentHandle  },
            { trait_type: 'Exchanges',       value: exchanges    },
            { trait_type: 'Victor',          value: shortWinner  },
            { trait_type: 'Token ID',        value: tokenId      },
            { display_type: 'date', trait_type: 'Victory Date', value: Math.floor(new Date(debateDate).getTime() / 1000) },
        ],
    }, {
        headers: {
            'Cache-Control': 'public, max-age=3600',
            'Content-Type': 'application/json',
        }
    });
}
