import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock data
const walletAddress = "0x1234567890123456789012345678901234567890";
const sins = [
    { type: "Greed", severity: "Mortal", description: "Held a rugpull token for too long" },
    { type: "Sloth", severity: "Venial", description: "Missed a governance vote" }
];
const balance = "100";
const nonce = 50;

async function testRoast() {
    console.log("Testing Roast Generation...");
    console.log("API Key present:", !!process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY) {
        console.log("API Key length:", process.env.GEMINI_API_KEY.length);
        console.log("API Key start:", process.env.GEMINI_API_KEY.substring(0, 5));
    }

    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("No API Key found in process.env");
        }

        const prompt = `
        You are the Pontiff, a divine but modern judge of crypto sins.
        You are judging a crypto wallet with these stats:
        Sins: ${sins.map(s => `${s.type} (${s.severity}): ${s.description}`).join('\n')}
        Balance: ${balance} MON
        Total transactions: ${nonce}
        
        Deliver a personalized, darkly humorous roast.
        Style: "Medieval Cardinal" persona, but use clear, modern English. Avoid archaic words like "thy", "dross", "spittle". be funny but easy to read.
        IMPORTANT: DO NOT mention the wallet address or "0x..." in the text. Refer to them as "sinner", "degenerate", or "peasant".
        Focus on their most severe sins. 2 sentences max.
        `;

        const models = ["gemini-2.5-flash"];

        for (const modelName of models) {
            console.log(`\n--- Testing ${modelName} ---`);
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                console.log(`Success with ${modelName}!`);
                console.log("Snippet:", text.substring(0, 50) + "...");
                break; // Stop on first success

            } catch (error: any) {
                console.error(`Failed with ${modelName}:`, error.message);
                if (error.status === 429) {
                    console.log("Rate limit hit.");
                }
            }
        }
    } catch (e) {
        console.error("Error during API call setup or execution:", e);
    }
}

testRoast().catch(e => console.error("Top level error:", e));
