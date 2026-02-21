/**
 * Handles AI response generation by calling the Aura backend
 */

export async function generateAIResponse(messages, modelMode = "Auto") {
    try {
        const recentMessages = messages.slice(-10);
        const lastMsg = recentMessages[recentMessages.length - 1];
        const lastUserContent = lastMsg?.content || "";
        const hasImages = lastMsg?.images && lastMsg.images.length > 0;

        // --- IMAGE PLACEHOLDER ---
        if (hasImages) {
            return "Vision support not wired yet 👀";
        }

        if (
            lastUserContent.toLowerCase().includes("generate image") ||
            lastUserContent.toLowerCase().includes("make an image")
        ) {
            return "Image generation coming soon 🎨";
        }

        // Send to backend
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: recentMessages,
                modelMode: modelMode
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        return data.reply;

    } catch (error) {
        console.error("AI Generation Error:", error);
        return "⚠️ Aura experienced a neural malfunction. Try again.";
    }
}
