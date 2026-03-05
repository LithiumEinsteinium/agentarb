import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get all agents (mock for now - will integrate 8004 SDK)
app.get('/api/agents', async (req, res) => {
  try {
    // TODO: Replace with actual 8004 SDK calls
    // For now, return mock data to show the UI
    const mockAgents = [
      {
        address: '4jHbm2DSBxvUEGQojJCn5bePy7ZmZQMAU7WCf7pPf7hW',
        name: 'Dj',
        tier: 2,
        chain: 'solana',
        services: [{ type: 'MCP' }, { type: 'A2A' }],
        reviews: 5
      },
      {
        address: 'FloristOneAgent123',
        name: 'Florist One',
        tier: 3,
        chain: 'solana',
        services: [{ type: 'MCP' }, { type: 'A2A' }, { type: 'HTTP' }],
        reviews: 12
      },
      {
        address: 'JadeNetAgent456',
        name: 'Jade Net',
        tier: 4,
        chain: 'solana',
        services: [{ type: 'MCP' }],
        reviews: 28
      },
      {
        address: '0x1234...',
        name: 'Ethereum Agent 1',
        tier: 2,
        chain: 'ethereum',
        services: [{ type: 'MCP' }],
        reviews: 3
      }
    ]
    
    res.json(mockAgents)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// x402 payment endpoint (for future use)
app.post('/api/pay', async (req, res) => {
  const { amount, agentId } = req.body
  
  // TODO: Implement x402 payment
  res.json({ status: 'pending', message: 'Payment integration coming soon' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
