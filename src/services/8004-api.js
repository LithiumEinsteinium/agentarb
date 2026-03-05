// 8004 API Service - Fetches agents from 8004scan.io + chains

// Known bad actor addresses to filter out (phishing/hacks)
const BLOCKED_ADDRESSES = new Set([
  '0x1234567890abcdef1234567890abcdef12345678'.toLowerCase(), // Known phishing
  // Add more as needed
])

// Fetch Solana agents from 8004scan.io
export async function fetchSolanaAgents() {
  try {
    // Try the 8004scan API
    const response = await fetch('https://www.8004scan.io/_next/data/4Yzj0vP_6vYz1qCLCFoSx/agents.json?chain=101', {
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (data?.pageProps?.agents) {
        return data.pageProps.agents
          .filter(agent => !isBlockedAddress(agent.address, 'solana'))
          .map(agent => ({
            address: agent.address,
            name: agent.name || agent.uri?.slice(0, 20) || 'Unknown',
            tier: mapTrustTier(agent.trustTier),
            chain: 'solana',
            services: parseServices(agent.services),
            reviews: agent.reviewCount || 0,
            uri: agent.uri || ''
          }))
      }
    }
  } catch (err) {
    console.error('8004scan Solana fetch error:', err)
  }
  
  // Fallback: try direct RPC
  return fetchSolanaDirect()
}

// Fetch Base agents from 8004scan.io
export async function fetchBaseAgents() {
  try {
    const response = await fetch('https://www.8004scan.io/_next/data/4Yzj0vP_6vYz1qCLCFoSx/agents.json?chain=8453', {
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (data?.pageProps?.agents) {
        return data.pageProps.agents
          .filter(agent => !isBlockedAddress(agent.address, 'base'))
          .map(agent => ({
            address: agent.address,
            name: agent.name || agent.uri?.slice(0, 20) || 'Unknown',
            tier: mapTrustTier(agent.trustTier),
            chain: 'base',
            services: parseServices(agent.services),
            reviews: agent.reviewCount || 0,
            uri: agent.uri || ''
          }))
      }
    }
  } catch (err) {
    console.error('8004scan Base fetch error:', err)
  }
  
  return []
}

// Fetch Ethereum agents (if available)
export async function fetchEthereumAgents() {
  try {
    const response = await fetch('https://www.8004scan.io/_next/data/4Yzj0vP_6vYz1qCLCFoSx/agents.json?chain=1', {
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (response.ok) {
      const data = await response.json()
      
      if (data?.pageProps?.agents) {
        return data.pageProps.agents
          .filter(agent => !isBlockedAddress(agent.address, 'ethereum'))
          .map(agent => ({
            address: agent.address,
            name: agent.name || agent.uri?.slice(0, 20) || 'Unknown',
            tier: mapTrustTier(agent.trustTier),
            chain: 'ethereum',
            services: parseServices(agent.services),
            reviews: agent.reviewCount || 0,
            uri: agent.uri || ''
          }))
      }
    }
  } catch (err) {
    console.error('8004scan Ethereum fetch error:', err)
  }
  
  return []
}

// Fallback: direct RPC fetch
async function fetchSolanaDirect() {
  const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
  const SOLANA_PROGRAM_ID = '8oo4dC4JvBLwy5tGgiH3WwK4B9PWxL9Z4XjA2jzkQMbQ'
  
  try {
    const response = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getProgramAccounts',
        params: [
          SOLANA_PROGRAM_ID,
          { encoding: 'base64', dataSlice: { offset: 0, length: 100 } }
        ]
      })
    })
    
    const data = await response.json()
    
    if (!data.result) return []
    
    return data.result.map(account => ({
      address: account.pubkey,
      name: 'Unknown',
      tier: 1,
      chain: 'solana',
      services: [],
      reviews: 0
    })).filter(a => !isBlockedAddress(a.address, 'solana'))
    
  } catch (err) {
    console.error('Solana RPC error:', err)
    return []
  }
}

// Check if address is blocked
function isBlockedAddress(address, chain) {
  if (!address) return true
  return BLOCKED_ADDRESSES.has(address.toLowerCase())
}

// Map trust tier from 8004scan format
function mapTrustTier(tier) {
  const mapping = {
    'Unrated': 1,
    'Bronze': 2,
    'Silver': 3,
    'Gold': 4,
    'Platinum': 5
  }
  return mapping[tier] || 1
}

// Parse services from agent data
function parseServices(services) {
  if (!services) return []
  if (Array.isArray(services)) return services.map(s => ({ type: s }))
  if (typeof services === 'string') return [{ type: services }]
  return []
}

// Fetch all agents from all chains
export async function fetchAllAgents() {
  const results = await Promise.allSettled([
    fetchSolanaAgents(),
    fetchBaseAgents(),
    fetchEthereumAgents()
  ])
  
  const agents = []
  
  if (results[0].status === 'fulfilled') {
    agents.push(...results[0].value)
  }
  
  if (results[1].status === 'fulfilled') {
    agents.push(...results[1].value)
  }
  
  if (results[2].status === 'fulfilled') {
    agents.push(...results[2].value)
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
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    name: 'Base Agent Alpha',
    tier: 3,
    chain: 'base',
    services: [{ type: 'MCP' }, { type: 'A2A' }],
    reviews: 8
  }
]
