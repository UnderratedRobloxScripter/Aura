/**
 * SERVER-SIDE: Vercel API Route
 * Secure API keys + rotation + correct vision handling
 */

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { messages = [], modelMode } = req.body;

    const EMBEDDED_API_KEYS = [
        process.env.GROQ_KEY_1,
        process.env.GROQ_KEY_2,
        process.env.GROQ_KEY_3,
        process.env.GROQ_KEY_4
    ].filter(Boolean);

    if (!EMBEDDED_API_KEYS.length) {
        return res.status(500).json({
            error: "Server keys are missing. Check Vercel settings."
        });
    }

    try {
        const result = await callGroqAPIWithRotation(
            messages,
            modelMode,
            EMBEDDED_API_KEYS
        );

        return res.status(200).json({ content: result });

    } catch (error) {
        console.error("Backend AI Error:", error);
        return res.status(500).json({ error: error.message });
    }
}


/* =======================================================
   🔁 KEY ROTATION
======================================================= */

async function callGroqAPIWithRotation(messages, modelMode, keys) {

    let lastError;

    for (let i = 0; i < keys.length; i++) {

        try {
            return await callGroqAPI(messages, modelMode, keys[i]);

        } catch (err) {

            lastError = err;

            // rotate ONLY on rate limit
            if (
                err.message.includes("429") ||
                err.message.toLowerCase().includes("limit")
            ) {
                console.warn(`Key ${i + 1} rate limited. Rotating...`);
                continue;
            }

            throw err;
        }
    }

    throw new Error("All API keys are exhausted. Try again later.");
}


/* =======================================================
   🧠 CORE GROQ CALL
======================================================= */

async function callGroqAPI(messages, modelMode, apiKey) {

    if (!Array.isArray(messages) || !messages.length) {
        throw new Error("No messages provided.");
    }

    const lastMessage = messages[messages.length - 1];

    const lastHasImages =
        lastMessage?.role === "user" &&
        Array.isArray(lastMessage?.images) &&
        lastMessage.images.length > 0;

    // 🔥 MODEL AUTO SWITCH
    const model = lastHasImages
        ? "llama-3.2-11b-vision-preview"
        : "llama-3.3-70b-versatile";


    /* =======================================================
       🧹 CLEAN MESSAGE FORMAT
       - Only last user message can contain images
       - All previous image blocks stripped
       - No corrupted mixed content arrays
    ======================================================= */

    const apiMessages = messages.map((msg, index) => {

        // --- LAST USER MESSAGE WITH IMAGES ---
        if (
            index === messages.length - 1 &&
            msg.role === "user" &&
            lastHasImages
        ) {

            const content = [];

            content.push({
                type: "text",
                text: typeof msg.content === "string"
                    ? msg.content
                    : "Analyze this image."
            });

            msg.images.forEach((url) => {
                if (typeof url === "string" && url.startsWith("data:image")) {
                    content.push({
                        type: "image_url",
                        image_url: { url }
                    });
                }
            });

            return {
                role: "user",
                content
            };
        }

        // --- ALL OTHER MESSAGES BECOME CLEAN TEXT ---
        return {
            role: msg.role,
            content: extractTextContent(msg.content)
        };
    });


    /* =======================================================
       🚀 GROQ REQUEST
    ======================================================= */

    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "system",
                        content: "You are Aura, a smart and helpful AI assistant."
                    },
                    ...apiMessages
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    if (!data?.choices?.length) {
        throw new Error("Invalid response from Groq.");
    }

    return data.choices[0].message.content.trim();
}


/* =======================================================
   🧽 SAFE TEXT EXTRACTOR
   Prevents old image arrays from breaking payload
======================================================= */

function extractTextContent(content) {

    if (!content) return "";

    if (typeof content === "string") {
        return content;
    }

    if (Array.isArray(content)) {
        const textBlock = content.find(
            (c) => c.type === "text" && typeof c.text === "string"
        );

        return textBlock?.text || "";
    }

    return "";
}
