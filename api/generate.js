import { callGemini, MAX_INPUT_CHARS } from './_gemini.js';

// Vercel serverless function: keeps the Gemini API key server-side so it
// never ships in the client bundle. Set GEMINI_API_KEY in the Vercel
// project settings (Environment Variables).
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'AI generation is not configured on this deployment.' });
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
        return res.status(400).json({ error: 'Missing business description text.' });
    }

    try {
        const bmc = await callGemini(text.slice(0, MAX_INPUT_CHARS), apiKey);
        return res.status(200).json(bmc);
    } catch (error) {
        return res.status(502).json({ error: error.message });
    }
}
