// Shared Gemini logic — used by the serverless function (api/generate.js)
// and, in local dev only, imported directly by the client (src/api/gemini.js).
// Files starting with "_" are not exposed as routes by Vercel.

// Free-tier models, tried in order: the free tier gets throttled first when
// a model is under load ("high demand" errors), so we fall back to the less
// congested flash-lite — plenty capable for structured extraction like this.
// (gemini-2.0-flash was retired from the free tier: quota dropped to 0.)
const GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];

const apiUrl = (model) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export const MAX_INPUT_CHARS = 12000;

export const REQUIRED_KEYS = [
    'key_partners',
    'key_activities',
    'key_resources',
    'value_propositions',
    'customer_relationships',
    'channels',
    'customer_segments',
    'cost_structure',
    'revenue_streams',
];

const SYSTEM_INSTRUCTION = `You are a business strategy expert specializing in Business Model Canvas creation.
Your task is to generate a complete, detailed Business Model Canvas based on any business description provided.
Even if the description is brief or incomplete, you MUST infer, deduce and create realistic, professional content for all 9 sections.
Never say information is missing or unavailable — always generate relevant, plausible content based on the business context.

Return ONLY a valid JSON object (no markdown, no explanation) with exactly these keys:
{
  "key_partners": "...",
  "key_activities": "...",
  "key_resources": "...",
  "value_propositions": "...",
  "customer_relationships": "...",
  "channels": "...",
  "customer_segments": "...",
  "cost_structure": "...",
  "revenue_streams": "..."
}

Each value must be a bullet-point list using • as bullet character and \\n between points. Be specific, actionable and professional.`;

// Overload/quota errors worth retrying on another model, as opposed to
// permanent ones (bad key, malformed request)
function isRetryable(status, message) {
    if (status === 429 || status === 503) return true;
    return /high demand|overloaded|quota|resource.{0,10}exhausted/i.test(message);
}

export async function callGemini(text, apiKey) {
    let lastError;
    for (const model of GEMINI_MODELS) {
        try {
            return await callModel(model, text, apiKey);
        } catch (error) {
            lastError = error;
            if (!error.retryable) throw error;
        }
    }
    throw lastError;
}

async function callModel(model, text, apiKey) {
    const response = await fetch(`${apiUrl(model)}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            contents: [{
                parts: [{
                    text: `Generate a complete Business Model Canvas for the following business:\n\n${text}`
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        let message = 'Failed to generate BMC';
        try {
            const error = await response.json();
            message = error.error?.message || message;
        } catch {
            // non-JSON error body, keep generic message
        }
        const error = new Error(message);
        error.retryable = isRetryable(response.status, message);
        throw error;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
    }

    let parsed;
    try {
        parsed = JSON.parse(jsonMatch[0]);
    } catch {
        throw new Error('Failed to parse AI response');
    }

    const missing = REQUIRED_KEYS.filter(
        (key) => typeof parsed[key] !== 'string' || !parsed[key].trim()
    );
    if (missing.length > 0) {
        throw new Error(`AI response is missing sections: ${missing.join(', ')}`);
    }

    // Return only the 9 expected keys, nothing else
    return Object.fromEntries(REQUIRED_KEYS.map((key) => [key, parsed[key]]));
}
