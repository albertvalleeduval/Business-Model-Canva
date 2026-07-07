import { callGemini, MAX_INPUT_CHARS } from './_gemini.js';

// Vercel serverless function: keeps the Gemini API key server-side so it
// never ships in the client bundle. Set GEMINI_API_KEY in the Vercel
// project settings (Environment Variables).

// --- Abuse protection ---------------------------------------------------
// This endpoint spends a shared, free-tier Gemini quota, so we add a few
// cheap barriers against casual abuse. None of them are bulletproof; a
// determined attacker can get past all of them. For real protection add a
// Vercel Firewall rate-limit rule on top of this.

// Hosts allowed to call this endpoint. Browsers always send an Origin header
// on cross-origin AND same-origin POST fetches, so requiring a known Origin
// blocks curl and third-party sites. NOTE: the Origin header is spoofable
// (e.g. from curl), so this is a soft barrier, not real authentication.
const ALLOWED_HOSTS = new Set(['business-model-canva.vercel.app']);
const isAllowedOrigin = (origin) => {
    if (!origin) return false;
    let host;
    try {
        host = new URL(origin).hostname;
    } catch {
        return false;
    }
    return ALLOWED_HOSTS.has(host) || host === 'localhost' || host === '127.0.0.1';
};

// In-memory rate limiter. State lives per serverless instance and resets on
// cold start, so limits are approximate and per-instance — imperfect, but
// free and enough to blunt a burst. Keyed by client IP.
const WINDOW_MS = 60_000;
const PER_IP_LIMIT = 5; // max requests / minute / IP
const GLOBAL_LIMIT = 30; // max requests / minute / instance (protects quota)
const hits = new Map(); // ip -> number[] (request timestamps)
let globalHits = []; // timestamps across all IPs

function pruneAndCount(timestamps, now) {
    // Drop timestamps outside the current window
    let i = 0;
    while (i < timestamps.length && timestamps[i] <= now - WINDOW_MS) i++;
    return i > 0 ? timestamps.slice(i) : timestamps;
}

// Returns true if the request is within limits (and records it).
function allowRequest(ip, now) {
    // Prune the global window and any stale per-IP buckets so the Map and
    // arrays don't grow unbounded.
    globalHits = pruneAndCount(globalHits, now);
    for (const [key, ts] of hits) {
        const kept = pruneAndCount(ts, now);
        if (kept.length === 0) hits.delete(key);
        else hits.set(key, kept);
    }

    if (globalHits.length >= GLOBAL_LIMIT) return false;

    const ipHits = hits.get(ip) || [];
    if (ipHits.length >= PER_IP_LIMIT) return false;

    ipHits.push(now);
    hits.set(ip, ipHits);
    globalHits.push(now);
    return true;
}

function clientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length > 0) {
        return fwd.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!isAllowedOrigin(req.headers.origin)) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    const now = Date.now();
    if (!allowRequest(clientIp(req), now)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
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
        // Log the real Google API error server-side; never leak it to the
        // client, which only needs a generic, actionable message.
        console.error('Gemini generation failed:', error);
        return res.status(502).json({ error: 'AI generation failed. Please try again.' });
    }
}
