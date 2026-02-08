import { NextResponse } from 'next/server';
import { DashboardService } from '@/lib/services/dashboard-service';

export async function GET() {
    try {
        const metrics = await DashboardService.getMetrics();
        const activity = await DashboardService.getRecentActivity();

        return NextResponse.json({
            metrics,
            activity
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
