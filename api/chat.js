// api/chat.js
import { Groq } from "groq-sdk";

// Get all keys from env, split by comma
const API_KEYS = process.env.GROQ_API_KEYS
  ? process.env.GROQ_API_KEYS.split(",").map(k => k.trim())
  : [];

if (API_KEYS.length === 0) {
  console.error("No GROQ_API_KEYS found!");
}

// Map keys to Groq clients
const groqClients = API_KEYS.map(key => new Groq({ apiKey: key }));

// Simple round-robin key selection
let currentKeyIndex = 0;
function getNextClient() {
  const client = groqClients[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % groqClients.length;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages } = req.body;
    if (!messages) return res.status(400).json({ error: "No messages provided" });

    const client = getNextClient();

    const completion = await client.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
    });

    res.status(200).json({
      reply: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
