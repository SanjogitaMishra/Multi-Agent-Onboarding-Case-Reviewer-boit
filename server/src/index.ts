import express from 'express'
import cors from 'cors'
import casesRouter from './routes/cases'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/cases', casesRouter)

const port = process.env.PORT || 4000
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
