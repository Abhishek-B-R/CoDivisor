import OpenAI from 'openai'
import type WebSocket from "ws"
import { getAllFilesWithContent } from '../file'
import path from "path"
import { SYSTEM_PROMPT } from './prompt'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function handleOpenAIStream(projectPath: string, ws: WebSocket) {
    const files = await getAllFilesWithContent(projectPath)

    for (const file of files) {
        const stream = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            stream: true,
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: `File path: ${file.path}\n\nCode:\n\n${file.content}`
                }
            ]
        });

        let output = ''
        for await (const chunk of stream) {
            const token = chunk.choices?.[0]?.delta?.content
            if (token) output += token
        }

        // Send back a message that includes which file and the review
        ws.send(JSON.stringify({
            filePath: file.path,
            review: output.trim()
        }))
    }

    ws.send('[DONE]')
}
