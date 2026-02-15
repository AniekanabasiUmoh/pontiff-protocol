// Using native fetch (Node 18+)

async function testRoast() {
    const url = 'http://localhost:3000/api/vatican/confess';
    // Use a random wallet to avoid colliding with previous runs if possible, or consistent one to test cache
    // We want to test cache, so we use a consistent one for this run.
    const wallet = "0x" + Array(40).fill('b').join('');
    const body = {
        agentWallet: wallet,
        message: "Forgive me father",
        signature: "0x0000000000000000000000000000000000000000000000000000000000000000"
    };

    console.log("--- Test 1: First Call (Should trigger AI or Fallback) ---");
    const start1 = Date.now();
    let roast1 = "";

    try {
        const res1 = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data1 = await res1.json();
        const duration1 = Date.now() - start1;
        console.log(`Status: ${res1.status}`);
        console.log(`Duration: ${duration1}ms`);

        roast1 = data1.data?.roast || data1.roast || (typeof data1 === 'string' ? data1 : JSON.stringify(data1));
        console.log(`Roast 1 Preview:`, roast1.substring(0, 100) + "...");

        if (data1.error) console.error("Error:", data1.error);

    } catch (e) {
        console.error("Request 1 failed:", e);
        return;
    }

    // Wait slightly to ensure DB write
    console.log("Waiting 2s...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("\n--- Test 2: Second Call (Should be Cached) ---");
    const start2 = Date.now();
    let roast2 = "";
    try {
        const res2 = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data2 = await res2.json();
        const duration2 = Date.now() - start2;
        console.log(`Status: ${res2.status}`);
        console.log(`Duration: ${duration2}ms`);

        roast2 = data2.data?.roast || data2.roast || (typeof data2 === 'string' ? data2 : JSON.stringify(data2));
        console.log(`Roast 2 Preview:`, roast2.substring(0, 100) + "...");

        if (roast1 === roast2) {
            console.log("✅ Cache HIT confirmed (Content Identical)");
        } else {
            console.log("❌ Cache MISS (Content Different)");
            console.log("Roast 1 len:", roast1.length);
            console.log("Roast 2 len:", roast2.length);
        }

    } catch (e) {
        console.error("Request 2 failed:", e);
    }
}

testRoast();
