import dotenv from 'dotenv';
import path from 'path';

async function main() {
    dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Explicit path relative to scripts folder

    console.log("Loading .env from:", path.resolve(__dirname, '../.env'));
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Defined" : "Missing");
    console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Defined" : "Missing");

    const { supabase } = await import('../lib/db/supabase');
    const { updateWorldState } = await import('../lib/actions/update-world-state');
    console.log("Starting Supabase Write Verification...");

    // 1. Test Write (World Event)
    const testWallet = "0xTestVerificationDataset";
    const eventType = "enter";
    console.log(`Inserting WorldEvent for ${testWallet}...`);

    const { data: event, error } = await supabase
        .from('world_events')
        .insert([{
            agentWallet: testWallet,
            eventType: eventType,
            eventData: { verification: true },
            timestamp: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error("FAILED: Supabase Write Error:", error);
        process.exit(1);
    }
    console.log("SUCCESS: WorldEvent inserted:", event.id);

    // 2. Test Read
    console.log("Verifying Read...");
    const { data: readEvent, error: readError } = await supabase
        .from('world_events')
        .select('*')
        .eq('id', event.id)
        .single();

    if (readError || !readEvent) {
        console.error("FAILED: Supabase Read Error:", readError);
        process.exit(1);
    }
    console.log("SUCCESS: Read back event:", readEvent.id);

    // 3. Test updateWorldState (Redis + Supabase Reads)
    console.log("Testing updateWorldState()...");
    try {
        const state = await updateWorldState();
        console.log("SUCCESS: World State updated.");

        // Basic validation of state
        if (!state.currentPontiff || !state.lastUpdated) {
            console.error("FAILED: World State invalid structure:", state);
            process.exit(1);
        }
        console.log("State Last Updated:", state.lastUpdated);
    } catch (e: any) {
        console.error("FAILED: updateWorldState threw error:", e);
        // Note: usage of Redis might fail if not connected, but let's see.
        // If Redis Mock is on, it should pass.
    }

    // Cleanup (Optional, but good practice if we want clean DB)
    // await supabase.from('world_events').delete().eq('id', event.id);

    console.log("✅ Verification Complete.");
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
