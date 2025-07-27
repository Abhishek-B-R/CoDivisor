import OpenAI from 'openai'
import type WebSocket from "ws"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function handleOpenAIStream(prompt: string, ws: WebSocket) {
    const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
    })

    for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content
        if (token) ws.send(token)
    }

    ws.send('[DONE]')
}
