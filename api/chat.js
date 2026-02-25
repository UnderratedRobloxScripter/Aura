/**
 * SERVER-SIDE: This runs on Vercel's servers.
 * It handles the API keys and the rotation logic securely.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { messages, modelMode } = req.body;

    const EMBEDDED_API_KEYS = [
        process.env.GROQ_KEY_1,
        process.env.GROQ_KEY_2,
        process.env.GROQ_KEY_3,
        process.env.GROQ_KEY_4
    ].filter(key => !!key);

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
            if (err.message.includes('429') || err.message.includes('limit')) continue;
            throw err;
        }
    }
    throw new Error("All API keys are exhausted. Try again later.");
}

async function callGroqAPI(messages, modelMode, apiKey) {
    const hasImages = messages.some(msg => msg.role === 'user' && msg.images?.length > 0);
    let model = hasImages ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";

    const apiMessages = messages.map(msg => {
        if (msg.role !== 'user' || !msg.images?.length) return { role: msg.role, content: msg.content || "" };
        const content = [{ type: "text", text: msg.content || "Analyze this image." }];
        msg.images.forEach(url => content.push({ type: "image_url", image_url: { url } }));
        return { role: msg.role, content };
    });

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: 'You are Aura.' }, ...apiMessages], temperature: 0.7 })
    });

    if (!response.ok) throw new Error(`Groq error ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content.trim();
}