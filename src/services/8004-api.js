// 8004 API Service - Fetches real agents from multiple sources

const LIES_API = 'https://lies-platform.onrender.com/api/agents'
const SATI_API = 'https://sati.cascade.fyi/api/agents'

// Known bad actor addresses to filter out
const BLOCKED_ADDRESSES = new Set([
  '0x1234567890abcdef1234567890abcdef12345678'.toLowerCase(),
])

function isBlockedAddress(address) {
  if (!address) return true
  return BLOCKED_ADDRESSES.has(address.toLowerCase())
}

// Map network_id to chain name
function mapNetwork(networkId) {
  const mapping = {
    'base': 'base',
    'base-mainnet': 'base',
    'bsc-1': 'ethereum',
    'bsc': 'ethereum',
    'ethereum': 'ethereum',
    'eth-1': 'ethereum',
  }
  const chain = mapping[networkId] || 'ethereum'
  return chain
}

function getExplorerUrl(address, chain) {
  if (chain === 'solana') {
    return `https://solscan.io/address/${address}`
  } else if (chain === 'base') {
    return `https://basescan.org/address/${address}`
  } else {
    return `https://etherscan.io/address/${address}`
  }
}

// Parse EVM services
function parseEvmServices(agent) {
  const services = []
  const onChain = agent.on_chain_data || {}
  if (onChain.services && Array.isArray(onChain.services)) {
    onChain.services.forEach(s => {
      if (s.name) services.push({ type: s.name.toUpperCase() })
    })
  }
  if (agent.metadata_uri) {
    services.push({ type: 'MCP' })
  }
  return services.length > 0 ? services : [{ type: 'MCP' }]
}

// Transform EVM agent
function transformEvmAgent(agent) {
  const networkId = agent.network_id || 'ethereum'
  const chain = mapNetwork(networkId)
  
  let tier = 1
  const tokenId = agent.token_id || 0
  
  if (tokenId > 50000) tier = 5
  else if (tokenId > 30000) tier = 4
  else if (tokenId > 10000) tier = 3
  else if (tokenId > 1000) tier = 2
  
  if (agent.skills && agent.skills.length > 0) {
    tier = Math.min(tier + 1, 5)
  }
  
  return {
    address: agent.address,
    name: agent.name || 'Unknown Agent',
    tier: tier,
    chain: chain,
    services: parseEvmServices(agent),
    reviews: agent.reputation_count || 0,
    uri: agent.metadata_uri || '',
    network: agent.network_name || networkId,
    description: agent.description || '',
    skills: agent.skills || [],
    tokenId: tokenId
  }
}

// Transform Solana Sati agent
function transformSatiAgent(agent) {
  const services = []
  
  if (agent.services && Array.isArray(agent.services)) {
    agent.services.forEach(s => {
      if (s.name) services.push({ type: s.name.toUpperCase(), endpoint: s.endpoint })
    })
  }
  
  // Calculate tier based on reputation
  let tier = 1
  const rep = agent.reputation || {}
  const score = rep.summaryValue || 0
  
  if (score >= 80) tier = 5
  else if (score >= 60) tier = 4
  else if (score >= 40) tier = 3
  else if (score >= 20) tier = 2
  
  return {
    address: agent.mint,
    name: agent.name || 'Unknown',
    tier: tier,
    chain: 'solana',
    services: services.length > 0 ? services : [{ type: 'MCP' }],
    reviews: rep.count || 0,
    uri: agent.uri || '',
    owner: agent.owner || '',
    description: agent.description || '',
    image: agent.image || '',
    active: agent.active || true,
    reputation: score
  }
}

// Fetch Solana agents from Sati API
async function fetchSolanaAgents() {
  try {
    const response = await fetch(`${SATI_API}?network=mainnet&limit=30`)
    
    if (!response.ok) {
      throw new Error(`Sati API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.agents) {
      return []
    }
    
    return data.agents
      .filter(a => !isBlockedAddress(a.mint))
      .map(transformSatiAgent)
      
  } catch (err) {
    console.error('Sati fetch error:', err.message)
    return []
  }
}

// Fetch EVM agents via LiEs proxy
async function fetchEvmAgents(page = 1, limit = 30) {
  try {
    const response = await fetch(`${LIES_API}?page=${page}&limit=${limit}`)
    
    if (!response.ok) {
      throw new Error(`EVM API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.agents) {
      return []
    }
    
    return data.agents
      .filter(a => !isBlockedAddress(a.address))
      .map(transformEvmAgent)
      
  } catch (err) {
    console.error('EVM fetch error:', err.message)
    return []
  }
}

// Main fetch function
export async function fetchAllAgents(page = 1, limit = 50) {
  try {
    // Fetch from both sources in parallel
    const [solana, evm] = await Promise.all([
      fetchSolanaAgents(),
      fetchEvmAgents(page, limit)
    ])
    
    // Combine: Solana first, then EVM
    return [...solana, ...evm]
    
  } catch (err) {
    console.error('Fetch error:', err.message)
    return getSolanaMockAgents()
  }
}

function getSolanaMockAgents() {
  const mock = [
    {
      address: '4jHbm2DSBxvUEGQojJCn5bePy7ZmZQMAU7WCf7pPf7hW',
      name: 'Dj',
      tier: 2,
      chain: 'solana',
      services: [{ type: 'MCP' }, { type: 'A2A' }],
      reviews: 5,
      uri: 'https://lies-platform.onrender.com/agent.json'
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
      address: '9XyZ1234567890abcdefABCDEF123456789GHIJK',
      name: 'Solana Sentinel',
      tier: 4,
      chain: 'solana',
      services: [{ type: 'MCP' }, { type: 'A2A' }, { type: 'HTTP' }],
      reviews: 45
    },
    {
      address: '3MnOpQrStUvWxYz1234567890ABCDEFGHIJKL',
      name: 'DeFi Dolphin',
      tier: 2,
      chain: 'solana',
      services: [{ type: 'MCP' }, { type: 'A2A' }],
      reviews: 7
    },
    {
      address: '8QkLmNoPqRsTuVwXyZ1234567890ABCDEFGHJ',
      name: 'NFT Navigator',
      tier: 3,
      chain: 'solana',
      services: [{ type: 'MCP' }, { type: 'HTTP' }],
      reviews: 22
    }
  ]
  
  return mock.map(a => ({ ...a, isMock: true }))
}

export async function getAgentCount() {
  try {
    const response = await fetch(`${LIES_API}?page=1&limit=1`)
    const data = await response.json()
    return data.total || 0
  } catch (err) {
    return 0
  }
}

export const MOCK_AGENTS = getSolanaMockAgents()
