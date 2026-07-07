export async function generateBMCFromText(text) {
    // Local dev without `vercel dev`: call Gemini directly with a dev-only
    // key from .env. This branch is statically removed from production
    // builds (import.meta.env.DEV is false), so no key ever ships.
    if (import.meta.env.DEV && import.meta.env.VITE_GEMINI_API_KEY) {
        const { callGemini } = await import('../../api/_gemini.js');
        return callGemini(text, import.meta.env.VITE_GEMINI_API_KEY);
    }

    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    });

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('AI generation failed (unexpected server response).');
    }

    if (!response.ok) {
        throw new Error(data.error || 'Failed to generate BMC');
    }

    return data;
}
