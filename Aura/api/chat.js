import dotenv from "dotenv";
import { Groq } from "groq-sdk";

dotenv.config();

const API_KEYS = process.env.GROQ_API_KEYS
  ? process.env.GROQ_API_KEYS.split(",")
  : [];

const groqClients = API_KEYS.map(
  key => new Groq({ apiKey: key.trim() })
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;

    const completion = await groqClients[0].chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile"
    });

    res.status(200).json({
      reply: completion.choices[0].message.content
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}