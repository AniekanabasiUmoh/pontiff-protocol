import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    console.log("Listing models...");
    try {
        // There isn't a direct listModels on the main class in the JS SDK easily accessible 
        // without using the model manager or REST.
        // But let's try a simple fetch to the API directly to debug.

        const key = process.env.GEMINI_API_KEY;
        if (!key) throw new Error("No Key");

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);

        console.log("Response status:", response.status);
        const data = await response.json();

        if (response.ok) {
            console.log("Found models:");
            const models = data.models || [];
            models.forEach((m: any) => {
                if (m.name.includes("flash") || m.name.includes("pro")) {
                    console.log("- " + m.name);
                }
            });
        } else {
            console.log("Error listing models:", JSON.stringify(data, null, 2));
        }

    } catch (error: any) {
        console.error("Failed:", error);
    }
}

listModels();
