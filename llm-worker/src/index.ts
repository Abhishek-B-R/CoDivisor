import { subscriber } from './redis'
import { sendToClient } from './ws'

interface LLMJob {
    provider: 'openai' | 'gemini'
    prompt: string
    id: string
}

async function main() {
    while (true) {
        try {
            console.log('Waiting for LLM job...')
            const result = await subscriber.brPop('llm-queue', 0)

            const raw = result?.element
            if (!raw) continue

            const data: LLMJob = JSON.parse(raw)

            if (!data.prompt || !data.provider || !data.id) {
                console.error('Invalid LLM job payload:', data)
                continue
            }

            sendToClient(data)
        } catch (err) {
            console.error('Worker error:', err)
        }
    }
}

main()
