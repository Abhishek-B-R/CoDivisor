import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.post("/fork",(req,res)=>{
    const { repoUrl } = req.body
    if (!repoUrl) {
        return res.status(400).json({ error: "Repository URL is required" })
    }
    
})

app.listen(8080)
console.log('Server running on port 8080');