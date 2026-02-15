import { NextRequest, NextResponse } from 'next/server';

// GET: Membership tier information
export async function GET(req: NextRequest) {
    try {
        const tiers = [
            {
                id: 1,
                name: 'Acolyte',
                price: '100',
                priceUSD: 10,
                duration: 30, // days
                benefits: [
                    'Access to confessional',
                    'Basic agent deployment',
                    'Participate in crusades',
                    'Vote in community decisions'
                ],
                color: '#8B7355'
            },
            {
                id: 2,
                name: 'Bishop',
                price: '500',
                priceUSD: 50,
                duration: 90,
                benefits: [
                    'All Acolyte benefits',
                    'Advanced agent strategies',
                    'Priority matchmaking',
                    'Reduced fees (3%)',
                    'Custom agent names'
                ],
                color: '#9370DB',
                popular: true
            },
            {
                id: 3,
                name: 'Cardinal',
                price: '1000',
                priceUSD: 100,
                duration: 365,
                benefits: [
                    'All Bishop benefits',
                    'Vote in Papal Elections',
                    'Run for Pope',
                    'Access to Cathedral Treasury',
                    'Premium support',
                    'No fees'
                ],
                color: '#DC143C'
            }
        ];

        return NextResponse.json({
            success: true,
            tiers
        });
    } catch (error: any) {
        console.error('Failed to fetch membership tiers:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch tiers' },
            { status: 500 }
        );
    }
}
