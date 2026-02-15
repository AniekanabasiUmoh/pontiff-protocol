import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';

/**
 * POST /api/agents/[id]/pause
 * Pause an active agent session
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = createServerSupabase();
        const { id } = await params;

        // Fetch the agent session
        const { data: session, error: fetchError } = await supabase
            .from('bot_sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !session) {
            return NextResponse.json(
                { success: false, error: 'Agent session not found' },
                { status: 404 }
            );
        }

        // Verify session is active
        if (session.status !== 'active') {
            return NextResponse.json(
                { success: false, error: `Cannot pause agent with status: ${session.status}` },
                { status: 400 }
            );
        }

        // Update status to paused
        const { data: updatedSession, error: updateError } = await supabase
            .from('bot_sessions')
            .update({
                status: 'paused',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Pause Agent Error:', updateError);
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 }
            );
        }

        // TODO: Emit Socket.IO event for real-time updates
        // io.emit('agent:paused', { sessionId: id, wallet: session.session_wallet });

        return NextResponse.json({
            success: true,
            sessionId: id,
            status: 'paused',
            message: 'Agent paused successfully'
        });

    } catch (error: any) {
        console.error('Pause Agent Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
