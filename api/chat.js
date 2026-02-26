/**
 * SERVER-SIDE: Runs on Vercel
 * Handles secure API keys + rotation + proper vision handling
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

/* ---------------- ROTATION LOGIC ---------------- */

async function callGroqAPIWithRotation(messages, modelMode, keys) {
    let lastError;

    for (let i = 0; i < keys.length; i++) {
        try {
            return await callGroqAPI(messages, modelMode, keys[i]);
        } catch (err) {
            lastError = err;

            // Rotate only on rate limit
            if (
                err.message.includes("429") ||
                err.message.toLowerCase().includes("limit")
            ) {
                continue;
            }

            throw err;
        }
    }

    throw new Error("All API keys are exhausted. Try again later.");
}

/* ---------------- CORE GROQ CALL ---------------- */

async function callGroqAPI(messages, modelMode, apiKey) {

    if (!messages.length) {
        throw new Error("No messages provided.");
    }

    const lastMessage = messages[messages.length - 1];

    const hasImages =
        lastMessage?.role === "user" &&
        Array.isArray(lastMessage?.images) &&
        lastMessage.images.length > 0;

    const model = hasImages
        ? "llama-3.2-11b-vision-preview"
        : "llama-3.3-70b-versatile";

    /* -------- CLEAN MESSAGE FORMAT -------- */

    const apiMessages = messages.map((msg, index) => {

        // ONLY convert latest message to vision format
        if (
            index === messages.length - 1 &&
            msg.role === "user" &&
            hasImages
        ) {
            const content = [
                {
                    type: "text",
                    text: msg.content || "Analyze this image."
                }
            ];

            msg.images.forEach((url) => {
                content.push({
                    type: "image_url",
                    image_url: { url }
                });
            });

            return { role: "user", content };
        }

        // Everything else becomes clean text
        return {
            role: msg.role,
            content:
                typeof msg.content === "string"
                    ? msg.content
                    : Array.isArray(msg.content)
                        ? msg.content.find(c => c.type === "text")?.text || ""
                        : ""
        };
    });

    /* -------- CALL GROQ -------- */

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
                    { role: "system", content: "You are Aura." },
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
