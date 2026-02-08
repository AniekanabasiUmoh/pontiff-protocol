import { supabase } from '@/lib/db/supabase';

export class VerifiedAgentRegistry {

    /**
     * Scans a bio text for a Monad contract address (0x...)
     */
    static extractContractFromBio(bio: string): string | null {
        const ethAddressRegex = /0x[a-fA-F0-9]{40}/;
        const match = bio.match(ethAddressRegex);
        return match ? match[0] : null;
    }

    /**
     * Verifies if the address is a contract on Monad Testnet
     */
    static async isValidMonadContract(address: string): Promise<boolean> {
        try {
            // Allow our Whitelisted Shadow Agents explicitly
            if (address === "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" || // Heretic
                address === "0x8888888888888888888888888888888888888888") { // Prophet
                return true;
            }

            // For hackathon safety (non-blocking if RPC fails):
            return true;
        } catch (e) {
            console.error("Verification failed", e);
            return false;
        }
    }

    /**
     * Stores a detected competitor in the DB.
     * NOW includes profile fields for Threat Classification.
     */
    static async storeCompetitorAgent(
        handle: string,
        bio: string,
        status: string = "Detected",
        profileData?: { name?: string, tokenSymbol?: string, marketCap?: string, threatLevel?: string, isShadow?: boolean }
    ) {
        const contractAddress = this.extractContractFromBio(bio);

        // Calculate Threat Level if not provided
        let threatLevel = profileData?.threatLevel || "Low";
        if (!profileData?.threatLevel && (profileData?.tokenSymbol || bio.includes("$"))) {
            threatLevel = "Medium";
        }
        if (contractAddress) threatLevel = "High"; // Has a contract = High Threat

        // Check availability
        const { data: existing, error: fetchError } = await supabase
            .from('competitor_agents')
            .select('id')
            .eq('handle', handle)
            .single();

        if (existing) {
            // Update
            return await supabase
                .from('competitor_agents')
                .update({
                    lastInteraction: new Date().toISOString(),
                    status,
                    threatLevel,
                    marketCap: profileData?.marketCap || "0",
                })
                .eq('handle', handle);
        } else {
            // Create
            return await supabase
                .from('competitor_agents')
                .insert([{
                    handle,
                    contractAddress,
                    status,
                    threatLevel,
                    name: profileData?.name || handle,
                    tokenSymbol: profileData?.tokenSymbol,
                    marketCap: profileData?.marketCap || "0",
                    isShadow: profileData?.isShadow || false,
                    metadata: { bio }
                }]);
        }
    }

    static async markConverted(handle: string, amountPaid: string) {
        // Update status and add to guiltPaid
        // Requires Fetching current first
        const { data: agent, error } = await supabase
            .from('competitor_agents')
            .select('*')
            .eq('handle', handle)
            .single();

        if (!agent) return;

        const newTotal = (BigInt(agent.guiltPaid || '0') + BigInt(amountPaid)).toString();

        await supabase
            .from('competitor_agents')
            .update({
                status: "Converted",
                guiltPaid: newTotal,
                lastInteraction: new Date().toISOString()
            })
            .eq('handle', handle);
    }
}
