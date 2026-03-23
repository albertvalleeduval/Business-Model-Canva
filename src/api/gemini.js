const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

export async function generateBMCFromText(text) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate BMC');
    }

    const data = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text || '';

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
}
