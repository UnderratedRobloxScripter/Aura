import { Groq } from "groq-sdk";

// No dotenv, use Vercel env vars directly
const API_KEY = process.env.GROQ_API_KEYS;

if (!API_KEY) {
  console.error("GROQ_API_KEYS is missing!");
}

const groqClient = new Groq({ apiKey: API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    const completion = await groqClient.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile"
    });

    res.status(200).json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
