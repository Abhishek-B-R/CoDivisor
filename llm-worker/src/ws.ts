import { WebSocketServer, WebSocket } from 'ws'
import crypto from 'crypto'
import { handleOpenAIStream } from './handlers/OpenAI'
import { handleGeminiStream } from './handlers/Gemini'

const clients = new Map<string, WebSocket>()

export const wss = new WebSocketServer({ port: 8081 })

wss.on('connection', (ws) => {
    const id = crypto.randomUUID()
    clients.set(id, ws)
    console.log(`🟢 WebSocket connected: ${id}`)

    ws.send(JSON.stringify({ id: id }))

    ws.on('close', () => {
        clients.delete(id)
        console.log(`🔴 WebSocket closed: ${id}`)
    })
})

interface LLMJob {
    provider: 'openai' | 'gemini'
    prompt: string
    id: string
}

export function sendToClient({ provider, prompt, id }: LLMJob) {
    const ws = clients.get(id)

    if (!ws || ws.readyState !== ws.OPEN) {
        console.error('❌ WebSocket not found or closed for id:', id)
        return
    }

    switch (provider) {
        case 'openai':
            handleOpenAIStream(prompt, ws)
            break
        case 'gemini':
            handleGeminiStream(prompt, ws)
            break
        default:
            ws.send('❌ Unknown LLM provider')
    }
}
