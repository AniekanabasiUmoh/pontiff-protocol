import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/db/supabase-server';
import { validators } from '@/lib/utils/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerSupabase();
  try {
    const { id } = await params;

    try {
      validators.uuid(id, 'Agent ID');
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    // Update status in database
    const { error } = await supabase
      .from('agent_sessions')
      .update({
        status: 'stopped',
        is_running: false, // Ensure persistence loop stops
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to stop agent:', error);
      return NextResponse.json(
        { error: 'Failed to update agent status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agentId: id,
      status: 'stopped',
      stoppedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to stop agent' },
      { status: 500 }
    );
  }
}
