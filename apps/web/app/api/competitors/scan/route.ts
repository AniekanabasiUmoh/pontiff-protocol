import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

export async function GET(req: NextRequest) {
    try {
        const supabase = createServerSupabase();
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const { data: competitors, error } = await supabase
            .from('competitors')
            .select('*')
            .order('last_seen', { ascending: false })
            .limit(limit);

        if (error) {
            console.log('Competitors query error (expected):', error.message);
            return NextResponse.json({
                success: true,
                competitors: [],
                count: 0,
                message: 'Competitors table not found'
            });
        }

        return NextResponse.json({
            success: true,
            competitors: competitors || [],
            count: competitors?.length || 0
        });
    } catch (error: any) {
        console.error('Failed to scan competitors:', error);
        return NextResponse.json({
            success: true,
            competitors: [],
            count: 0,
            message: 'Competitors not available'
        });
    }
}
