import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

async function verifyKey() {
    const key = process.env.GOOGLE_API_KEY;
    console.log(`Checking Key: ${key ? key.substring(0, 5) + '...' + key.substring(key.length - 4) : 'UNDEFINED'}`);

    if (!key) {
        console.error("No GOOGLE_API_KEY found.");
        return;
    }

    try {
        console.log("Initializing Gemini...");
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const prompt = "Hello, are you working?";
        console.log("Sending request...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        console.log("Success! Response:", response.text());
    } catch (error: any) {
        console.error("Error verifying key:", error.message);
        if (error.response) {
            console.error("Error details:", JSON.stringify(error.response, null, 2));
        }
    }
}

verifyKey().catch(err => console.error("Top level error:", err));
