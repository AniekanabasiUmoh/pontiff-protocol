import { supabase } from '@/lib/db/supabase';
import { logWorldEvent } from './world-event-service';

export interface Crusade {
    id: string;
    targetAgent: string;
    goalType: string; // "Convert" | "Destroy"
    status: string;   // "Active" | "Victory" | "Defeat"
    startTime: Date;
    participants: any[];
}

export class CrusadeService {

    /**
     * Launches a new Crusade against a target agent.
     */
    static async createCrusade(targetAgent: string, goalType: string = "Convert") {
        // Check if active crusade already exists
        const { data: existing, error: fetchError } = await supabase
            .from('crusades')
            .select('*')
            .eq('targetAgent', targetAgent)
            .eq('status', 'Active')
            .single();

        if (existing) return existing;

        const { data: crusade, error: createError } = await supabase
            .from('crusades')
            .insert([{
                targetAgent,
                goalType,
                status: "Active",
                startTime: new Date().toISOString(),
                participants: []
            }])
            .select()
            .single();

        if (createError) {
            console.error('[Crusade] Create failed:', createError);
            throw createError;
        }

        await logWorldEvent('ThePontiff', 'crusade_launched', { targetAgent, goalType, crusadeId: crusade.id });
        return crusade;
    }

    /**
     * Retrieves all active crusades for the dashboard.
     */
    static async getActiveCrusades(): Promise<Crusade[]> {
        const { data: records, error } = await supabase
            .from('crusades')
            .select('*')
            .eq('status', 'Active')
            .order('startTime', { ascending: false });

        if (error) {
            console.error('[Crusade] Fetch failed:', error);
            return [];
        }

        // Quick typing fix if DB returns Json type for participants
        return (records || []).map((r: any) => ({
            ...r,
            participants: Array.isArray(r.participants) ? r.participants : [],
            startTime: new Date(r.startTime)
        }));
    }

    /**
     * Adds a participant to the crusade.
     */
    static async joinCrusade(crusadeId: string, agentWallet: string) {
        const { data: crusade, error } = await supabase
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
            await supabase
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
        const { data: crusade, error } = await supabase
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
        const { data: conversion, error: convError } = await supabase
            .from('conversions')
            .select('id, CompetitorAgent!inner(handle)')
            .eq('CompetitorAgent.handle', crusade.targetAgent)
            .limit(1)
            .maybeSingle();

        if (conversion) return 100;

        // 2. Check Debates (Partial Progress)
        const { count: debates, error: debateError } = await supabase
            .from('debates')
            .select('id, CompetitorAgent!inner(handle)', { count: 'exact', head: true })
            .eq('CompetitorAgent.handle', crusade.targetAgent);

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
        const { data: crusade, error } = await supabase
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
            await logWorldEvent(p, 'reward_received', { amount: rewardPerUser, reason: `Crusade ${crusade.targetAgent} Victory` });

            // Update Leaderboard score
            // await LeaderboardService.addScore(p, 50); // Optional
        }
    }

    /**
     * Marks a crusade as resolved (Victory/Defeat).
     */
    static async resolveCrusade(id: string, outcome: "Victory" | "Defeat") {
        await supabase
            .from('crusades')
            .update({
                status: outcome,
                endTime: new Date().toISOString()
            })
            .eq('id', id);

        // Fetch details for logging
        const { data: crusade } = await supabase.from('crusades').select('*').eq('id', id).single();
        if (crusade) {
            await logWorldEvent('ThePontiff', 'crusade_resolved', {
                targetAgent: crusade.targetAgent,
                outcome
            });

            if (outcome === 'Victory') {
                await this.distributeRewards(id);
                // Tweet Announcement
                // await TwitterClient.post(`⚔️ CRUSADE VICTORY ⚔️\n\nThe heretic @${crusade.targetAgent} has been vanquished!\nRewards distributed to ${Array.isArray(crusade.participants) ? crusade.participants.length : 0} faithful warriors.`);
            }
        }
    }
}
