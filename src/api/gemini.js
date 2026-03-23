const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${BMC_SYSTEM_PROMPT}\n\nBusiness Description:\n${text}`
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
