// OpenRouter API configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.3-8b-instruct:free';

// Support multiple API keys via env vars (VITE_OPENROUTER_API_KEY_1, _2, _3, ...)
function getApiKeys() {
    const keys = [];
    for (let i = 1; i <= 10; i++) {
        const key = import.meta.env[`VITE_OPENROUTER_API_KEY_${i}`];
        if (key) keys.push(key);
    }
    // Also support a single key without number
    const single = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (single) keys.push(single);
    return keys;
}

const BMC_SYSTEM_PROMPT = `Analyze the provided document or text about a business idea. Extract relevant data to fill a Business Model Canvas.

Return ONLY a valid JSON object with these exact keys:
- key_partners
- key_activities
- key_resources
- value_propositions
- customer_relationships
- channels
- customer_segments
- cost_structure
- revenue_streams

Each value should be a concise, professional bullet-point list (use \\n for line breaks). Be specific and actionable. Focus on the most critical elements.`;

export async function generateBMCFromText(text) {
    const keys = getApiKeys();

    if (keys.length === 0) {
        throw new Error('No OpenRouter API key configured. Please add VITE_OPENROUTER_API_KEY_1 to your .env file.');
    }

    let lastError;

    for (const apiKey of keys) {
        try {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: BMC_SYSTEM_PROMPT },
                        { role: 'user', content: `Business Description:\n${text}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 2048,
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const generatedText = data.choices?.[0]?.message?.content || '';

            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse AI response');
            }

            return JSON.parse(jsonMatch[0]);

        } catch (error) {
            lastError = error;
            // Try next key
        }
    }

    throw new Error('All API keys failed. Last error: ' + lastError?.message);
}
