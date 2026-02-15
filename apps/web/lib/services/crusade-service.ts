import { createServerSupabase } from '@/lib/db/supabase-server';
import { logWorldEvent } from './world-event-service';

export interface Crusade {
    id: string;
    target_agent_handle: string;
    goal_type: string; // "Convert" | "Destroy"
    status: string;   // "Active" | "Victory" | "Defeat"
    start_time: Date;
    participants: any[];
}

export class CrusadeService {

    /**
     * Launches a new Crusade against a target agent.
     */
    static async createCrusade(target_agent_handle: string, goal_type: string = "Convert") {
        // Check if active crusade already exists
        const { data: existing, error: fetchError } = await createServerSupabase()
            .from('crusades')
            .select('*')
            .eq('target_agent_handle', target_agent_handle)
            .eq('status', 'Active')
            .single();

        if (existing) return existing;

        const { data: crusade, error: createError } = await createServerSupabase()
            .from('crusades')
            .insert([{
                target_agent_handle,
                goal_type,
                status: "Active",
                start_time: new Date().toISOString(),
                participants: []
            }])
            .select()
            .single();

        if (createError) {
            console.error('[Crusade] Create failed:', createError);
            throw createError;
        }

        await logWorldEvent('ThePontiff', 'crusade_launched', { target_agent_handle, goal_type, crusadeId: crusade.id });
        return crusade;
    }

    /**
     * Retrieves all active crusades for the dashboard.
     */
    static async getActiveCrusades(): Promise<Crusade[]> {
        const { data: records, error } = await createServerSupabase()
            .from('crusades')
            .select('*')
            .eq('status', 'Active')
            .order('start_time', { ascending: false });

        if (error) {
            console.error('[Crusade] Fetch failed:', error);
            return [];
        }

        // Quick typing fix if DB returns Json type for participants
        return (records || []).map((r: any) => ({
            ...r,
            participants: Array.isArray(r.participants) ? r.participants : [],
            start_time: new Date(r.start_time)
        }));
    }

    /**
     * Adds a participant to the crusade.
     */
    static async joinCrusade(crusadeId: string, agentWallet: string) {
        const { data: crusade, error } = await createServerSupabase()
            .from('crusades')
            .select('*')
            .eq('id', crusadeId)
            .single();

        if (!crusade) throw new Error("Crusade not found");

        const participants: string[] = Array.isArray(crusade.participants)
            ? crusade.participants as string[]
            : [];

        if (!participants.includes(agentWallet)) {
            participants.push(agentWallet);
            await createServerSupabase()
                .from('crusades')
                .update({ participants })
                .eq('id', crusadeId);
        }
        return { success: true, count: participants.length };
    }

    /**
     * Calculates real-time progress of a crusade.
     */
    static async getProgress(crusadeId: string): Promise<number> {
        const { data: crusade, error } = await createServerSupabase()
            .from('crusades')
            .select('*')
            .eq('id', crusadeId)
            .single();

        if (!crusade) return 0;

        if (crusade.status === 'Victory') return 100;
        if (crusade.status === 'Defeat') return 0;

        // Logic: Check if target agent has entries in Conversion or Debate tables
        // 1. Check Conversion (Instant 100% or high progress if partial)
        // Need to find agent ID first to query Conversion table linked by foreign key?
        // Or assumes we can query by handle match if relation allows. 
        // Conversion table uses `competitorAgentId`. We need to join.

        // Supabase join syntax:
        const { data: conversion } = await createServerSupabase()
            .from('conversions')
            .select('id, agent:competitor_agents!inner(twitter_handle)')
            .eq('competitor_agents.twitter_handle', crusade.target_agent_handle)
            .limit(1)
            .maybeSingle();

        if (conversion) return 100;

        // 2. Check Debates (Partial Progress)
        const { count: debates } = await createServerSupabase()
            .from('debates')
            .select('id', { count: 'exact', head: true })
            .eq('competitor_agent_id', crusade.target_agent_handle);

        const debateCount = debates || 0;

        // Simple heuristic: Each debate is 20% progress
        // Max 80% without conversion
        const progress = Math.min(debateCount * 20, 80);
        return progress;
    }

    /**
     * Distributes rewards to participants.
     */
    static async distributeRewards(crusadeId: string) {
        const { data: crusade, error } = await createServerSupabase()
            .from('crusades')
            .select('*')
            .eq('id', crusadeId)
            .single();

        if (!crusade || !crusade.participants) return;

        const participants = crusade.participants as string[];
        const rewardPerUser = 100; // 100 GUILT

        // In a real app, this triggers a batch transfer via Smart Contract
        // Here we just log it as a World Event
        for (const p of participants) {
            await logWorldEvent(p, 'reward_received', { amount: rewardPerUser, reason: `Crusade ${crusade.target_agent_handle} Victory` });

            // Update Leaderboard score
            // await LeaderboardService.addScore(p, 50); // Optional
        }
    }

    /**
     * Marks a crusade as resolved (Victory/Defeat).
     */
    static async resolveCrusade(id: string, outcome: "Victory" | "Defeat") {
        await createServerSupabase()
            .from('crusades')
            .update({
                status: outcome,
                end_time: new Date().toISOString()
            })
            .eq('id', id);

        // Fetch details for logging
        const { data: crusade } = await createServerSupabase().from('crusades').select('*').eq('id', id).single();
        if (crusade) {
            await logWorldEvent('ThePontiff', 'crusade_resolved', {
                target_agent_handle: crusade.target_agent_handle,
                outcome
            });

            if (outcome === 'Victory') {
                await this.distributeRewards(id);
                // Tweet Announcement
                // await TwitterClient.post(`⚔️ CRUSADE VICTORY ⚔️\n\nThe heretic @${crusade.target_agent_handle} has been vanquished!\nRewards distributed to ${Array.isArray(crusade.participants) ? crusade.participants.length : 0} faithful warriors.`);
            }
        }
    }
}
