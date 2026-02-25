/**
 * SERVER-SIDE: This runs on Vercel's servers.
 * It handles the API keys and the rotation logic securely.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { messages, modelMode } = req.body;

    // Securely pull keys from Vercel Environment Variables
    const EMBEDDED_API_KEYS = [
        process.env.GROQ_KEY_1,
        process.env.GROQ_KEY_2,
        process.env.GROQ_KEY_3,
        process.env.GROQ_KEY_4
    ].filter(key => !!key); // Remove any empty keys

    if (EMBEDDED_API_KEYS.length === 0) {
        return res.status(500).json({ error: "Server keys are missing. Check Vercel settings." });
    }

    try {
        const result = await callGroqAPIWithRotation(messages, modelMode, EMBEDDED_API_KEYS);
        return res.status(200).json({ content: result });
    } catch (error) {
        console.error('Backend AI Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function callGroqAPIWithRotation(messages, modelMode, keys) {
    let lastError;
    for (let i = 0; i < keys.length; i++) {
        try {
            return await callGroqAPI(messages, modelMode, keys[i]);
        } catch (err) {
            lastError = err;
            if (err.message.includes('429') || err.message.includes('limit')) {
                console.warn(`Key ${i + 1} rate limited. Rotating...`);
                continue;
            }
            throw err;
        }
    }
    throw new Error("All API keys are exhausted. Try again later. :sob:");
}

async function callGroqAPI(messages, modelMode, apiKey) {
    const hasImages = messages.some(msg => msg.role === 'user' && msg.images?.length > 0);

    let model = "llama-3.3-70b-versatile";
    if (modelMode === 'Fast') model = 'llama-3.1-8b-instant';
    if (modelMode === 'Thinking') model = 'mixtral-8x7b-32768';
    
    // FIX: Using actual production Vision ID
    if (hasImages) model = "llama-3.2-11b-vision-preview";

    const apiMessages = messages.map(msg => {
        if (msg.role !== 'user' || !msg.images?.length) return { role: msg.role, content: msg.content || "" };
        const content = [{ type: "text", text: msg.content || "Analyze this image." }];
        msg.images.forEach(url => content.push({ type: "image_url", image_url: { url } }));
        return { role: msg.role, content };
    });

    const systemPrompt = `You are Aura, an advanced AI. Mode: ${modelMode}. ${hasImages ? 'Analyze images deeply.' : ''}`;
    const finalPayload = [{ role: 'system', content: systemPrompt }, ...apiMessages];

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model, messages: finalPayload, temperature: 0.7 })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Groq error ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}