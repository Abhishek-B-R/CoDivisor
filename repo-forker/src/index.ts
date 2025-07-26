import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())

app.get("/",(req,res)=>{
    res.json({
        msg:"hi there"
    })
})

app.listen(8080)
console.log('Server running on port 8080');