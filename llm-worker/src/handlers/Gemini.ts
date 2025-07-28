import { GoogleGenerativeAI } from "@google/generative-ai"
import type WebSocket from "ws"
import { getAllFilesWithContent } from "../file"
import { SYSTEM_PROMPT } from "./prompt"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

export async function handleGeminiStream(projectPath: string, ws: WebSocket) {
  const files = await getAllFilesWithContent(projectPath)

  for (const file of files) {
    const prompt = `
${SYSTEM_PROMPT}

File path: ${file.path}

Code:

${file.content}
    `.trim()

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    })

    let output = ""
    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) output += text
    }

    ws.send(
      JSON.stringify({
        filePath: file.path,
        review: output.trim()
      })
    )
  }

  ws.send("[DONE]")
}
