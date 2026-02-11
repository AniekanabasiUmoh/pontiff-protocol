import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/agents/[id]/resume
 * Resume a paused agent session
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
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

        // Verify session is paused
        if (session.status !== 'paused') {
            return NextResponse.json(
                { success: false, error: `Cannot resume agent with status: ${session.status}` },
                { status: 400 }
            );
        }

        // Update status to active
        const { data: updatedSession, error: updateError } = await supabase
            .from('bot_sessions')
            .update({
                status: 'active',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Resume Agent Error:', updateError);
            return NextResponse.json(
                { success: false, error: updateError.message },
                { status: 500 }
            );
        }

        // TODO: Emit Socket.IO event for real-time updates
        // io.emit('agent:resumed', { sessionId: id, wallet: session.session_wallet });

        return NextResponse.json({
            success: true,
            sessionId: id,
            status: 'active',
            message: 'Agent resumed successfully'
        });

    } catch (error: any) {
        console.error('Resume Agent Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
