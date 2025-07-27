import { WebSocketServer } from 'ws'
import { handleOpenAIStream } from './OpenAI/index.js'
import { handleGeminiStream } from './Gemini/index.js'

const wss = new WebSocketServer({ port: 8081 })

wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
        const { provider, prompt } = JSON.parse(message.toString())

        if (provider === 'openai') {
            await handleOpenAIStream(prompt, ws)
        } else if (provider === 'gemini') {
            await handleGeminiStream(prompt, ws)
        }
    })
})
