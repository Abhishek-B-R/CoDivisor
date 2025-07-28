import express from 'express'
import cors from 'cors'
import { forkRepository } from './octokit'
import { checkIfRepositoryExists, cloneRepository } from './simple-git'
import path from 'path'
import { publisher } from './redis'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/fork', async (req, res) => {
    // TODO: Handle private repo forking
    const { username, reponame, id, accessToken, isPrivate } = req.body
    if (!reponame || !username || !id || !accessToken || isPrivate === undefined) {
        return res.status(400).json({ error: 'Repository name, username, ID, access token, and visibility are required' })
    }

    try {
        // TODO: Handle private repositories
        // In future, accept user's GitHub token securely (via DB or encrypted session)
        // Never send token directly from frontend to backend
        // Use the token to fork/clone private repos using Octokit & simple-git auth

        await forkRepository(`https://github.com/${username}/${reponame}`)
        const exists = await checkIfRepositoryExists(`https://github.com/CoDivisor/${reponame}`)
        if (!exists) {
            setTimeout(() => {}, 5000) // Wait for the fork to be created
        }
        const outputPath = path.join(__dirname, '..', 'output', id)
        await cloneRepository(`https://github.com/CoDivisor/${reponame}`, outputPath, 'main')

        publisher.lPush('llm-queue', id)

        res.status(200).json({ message: 'Repository forked and cloned successfully' })
    } catch (error) {
        console.error('Error during fork/clone:', error)
        res.status(500).json({ error: 'Failed to fork and clone repository' })
    }
})

app.listen(8080, () => {
    console.log('Server running on port 8080')
})
