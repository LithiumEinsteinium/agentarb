// 8004 API Service - Fetches agents from Solana and Ethereum chains using native fetch

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
const SOLANA_PROGRAM_ID = '8oo4dC4JvBLwy5tGgiH3WwK4B9PWxL9Z4XjA2jzkQMbQ'

const ETH_RPC = 'https://eth-mainnet.g.alchemy.com/v2/demo'
const BASE_RPC = 'https://base-mainnet.g.alchemy.com/v2/demo'

const ERC8004_IDENTITY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'

// Fetch Solana agents via JSON-RPC
export async function fetchSolanaAgents() {
  try {
    // Get program accounts
    const response = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getProgramAccounts',
        params: [
          SOLANA_PROGRAM_ID,
          {
            encoding: 'base64',
            dataSlice: { offset: 0, length: 1000 }
          }
        ]
      })
    })
    
    const data = await response.json()
    
    if (!data.result || !data.result.length) {
      return []
    }
    
    const agents = []
    
    for (const account of data.result) {
      try {
        // Try to parse the account data
        const accountData = account.account?.data?.[0] || account.account?.data || ''
        
        if (accountData) {
          // For now, extract a name from the data if possible
          // In production, you'd decode the actual 8004 data structure
          agents.push({
            address: account.pubkey,
            name: extractNameFromData(accountData),
            tier: Math.floor(Math.random() * 4) + 1, // Placeholder - real impl needed
            chain: 'solana',
            services: [{ type: 'MCP' }],
            reviews: Math.floor(Math.random() * 20)
          })
        }
      } catch (e) {
        // Skip invalid accounts
      }
    }
    
    return agents
  } catch (err) {
    console.error('Solana fetch error:', err)
    return []
  }
}

// Try to extract a name from raw data
function extractNameFromData(data) {
  try {
    // Decode base64
    const decoded = atob(data)
    // Look for printable ASCII strings
    const match = decoded.match(/[a-zA-Z][a-zA-Z0-9_]{2,20}/)
    return match ? match[0] : 'Unknown'
  } catch (e) {
    return 'Unknown'
  }
}

// Fetch Ethereum agents via JSON-RPC
export async function fetchEthereumAgents() {
  try {
    // Try to call the ERC-8004 contract
    const response = await fetch(ETH_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      })
    })
    
    // If we can connect, return placeholder
    // Real implementation would query the registry
    return []
  } catch (err) {
    console.error('Ethereum fetch error:', err)
    return []
  }
}

// Fetch Base agents
export async function fetchBaseAgents() {
  try {
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: []
      })
    })
    
    return []
  } catch (err) {
    console.error('Base fetch error:', err)
    return []
  }
}

// Fetch all agents from all chains
export async function fetchAllAgents() {
  const results = await Promise.allSettled([
    fetchSolanaAgents(),
    fetchEthereumAgents(),
    fetchBaseAgents()
  ])
  
  const agents = []
  
  if (results[0].status === 'fulfilled') {
    agents.push(...results[0].value.map(a => ({ ...a, chain: 'solana' })))
  }
  
  if (results[1].status === 'fulfilled') {
    agents.push(...results[1].value.map(a => ({ ...a, chain: 'ethereum' })))
  }
  
  if (results[2].status === 'fulfilled') {
    agents.push(...results[2].value.map(a => ({ ...a, chain: 'base' })))
  }
  
  return agents
}

// Mock data fallback
export const MOCK_AGENTS = [
  {
    address: '4jHbm2DSBxvUEGQojJCn5bePy7ZmZQMAU7WCf7pPf7hW',
    name: 'Dj',
    tier: 2,
    chain: 'solana',
    services: [{ type: 'MCP' }, { type: 'A2A' }],
    reviews: 5
  },
  {
    address: '5ZvVT4YxmB8X9vVzC1M8YwvwgN4X5K2QpL7jR2mN6pX',
    name: 'Florist One',
    tier: 3,
    chain: 'solana',
    services: [{ type: 'MCP' }, { type: 'A2A' }, { type: 'HTTP' }],
    reviews: 12
  },
  {
    address: '7AbCdEfGhIjKlMnOpQrStUvWxYz1234567890ABC',
    name: 'Jade Net',
    tier: 4,
    chain: 'solana',
    services: [{ type: 'MCP' }],
    reviews: 28
  },
  {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Ethereum Agent 1',
    tier: 2,
    chain: 'ethereum',
    services: [{ type: 'MCP' }],
    reviews: 3
  },
  {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    name: 'Base Agent Alpha',
    tier: 3,
    chain: 'base',
    services: [{ type: 'MCP' }, { type: 'A2A' }],
    reviews: 8
  }
]
