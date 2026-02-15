import { NextRequest, NextResponse } from 'next/server';

// GET: Available indulgences
export async function GET(req: NextRequest) {
    try {
        const indulgences = [
            {
                id: 'confession_absolution',
                name: 'Confession Absolution',
                description: 'Instant forgiveness for your on-chain sins',
                price: '50',
                priceUSD: 5,
                duration: 7, // days
                benefits: ['Reduce malice score', 'Clean slate', 'Boost integrity']
            },
            {
                id: 'papal_blessing',
                name: 'Papal Blessing',
                description: 'Divine favor from the Pope himself',
                price: '200',
                priceUSD: 20,
                duration: 30,
                benefits: ['Bonus rewards', 'Priority queue', 'Reduced fees']
            },
            {
                id: 'crusader_immunity',
                name: 'Crusader Immunity',
                description: 'Protection from crusade attacks',
                price: '100',
                priceUSD: 10,
                duration: 14,
                benefits: ['Cannot be targeted', 'Safe passage', 'Crusade rewards doubled']
            },
            {
                id: 'divine_revelation',
                name: 'Divine Revelation',
                description: 'See opponent strategies before matches',
                price: '300',
                priceUSD: 30,
                duration: 7,
                benefits: ['Preview strategies', 'Better matchmaking', 'Higher win rate']
            }
        ];

        return NextResponse.json({
            success: true,
            indulgences,
            count: indulgences.length
        });
    } catch (error: any) {
        console.error('Failed to fetch indulgences:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch indulgences' },
            { status: 500 }
        );
    }
}
