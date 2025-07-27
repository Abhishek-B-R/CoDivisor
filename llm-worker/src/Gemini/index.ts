import { GoogleGenerativeAI } from "@google/generative-ai"
import type WebSocket from "ws"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

export async function handleGeminiStream(prompt: string, ws: WebSocket) {
  const result = await model.generateContentStream(prompt)

  for await (const chunk of result.stream) {
    const text = chunk.text()
    if (text) ws.send(text)
  }

  ws.send("[DONE]")
}
