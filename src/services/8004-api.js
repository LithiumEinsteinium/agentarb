// 8004 API Service - Fetches real agents from agentscan.info

const AGENTSCAN_API = 'https://agentscan.info/api/agents'

// Known bad actor addresses to filter out (phishing/hacks)
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
    'bsc-1': 'ethereum',  // BSC uses EVM
    'bsc': 'ethereum',
    'ethereum': 'ethereum',
    'eth-1': 'ethereum',
    'celo': 'celo',
    'arbitrum': 'ethereum',
    'optimism': 'ethereum'
  }
  return mapping[networkId] || 'ethereum'
}

// Map network to explorer URL
function getExplorerUrl(address, networkId) {
  const chain = mapNetwork(networkId)
  if (chain === 'base') {
    return `https://basescan.org/address/${address}`
  } else if (chain === 'celo') {
    return `https://celoscan.io/address/${address}`
  } else {
    return `https://etherscan.io/address/${address}`
  }
}

// Parse services from agent metadata
function parseServices(agent) {
  const services = []
  
  // Check on_chain_data for services
  const onChain = agent.on_chain_data || {}
  if (onChain.services) {
    if (Array.isArray(onChain.services)) {
      onChain.services.forEach(s => {
        if (s.name) services.push({ type: s.name.toUpperCase() })
      })
    }
  }
  
  // Add MCP if metadata_uri exists
  if (agent.metadata_uri) {
    services.push({ type: 'MCP' })
  }
  
  return services.length > 0 ? services : [{ type: 'MCP' }]
}

// Transform agentscan agent to our format
function transformAgent(agent) {
  const networkId = agent.network_id || 'ethereum'
  const chain = mapNetwork(networkId)
  
  // Calculate tier based on reputation score
  let tier = 1
  if (agent.reputation_score >= 80) tier = 5  // Platinum
  else if (agent.reputation_score >= 60) tier = 4  // Gold
  else if (agent.reputation_score >= 40) tier = 3  // Silver
  else if (agent.reputation_score >= 20) tier = 2  // Bronze
  
  return {
    address: agent.address,
    name: agent.name || 'Unknown Agent',
    tier: tier,
    chain: chain,
    services: parseServices(agent),
    reviews: agent.reputation_count || 0,
    uri: agent.metadata_uri || '',
    network: agent.network_name || networkId,
    description: agent.description || '',
    skills: agent.skills || []
  }
}

// Fetch agents from agentscan.info
export async function fetchAllAgents(page = 1, limit = 20) {
  try {
    const response = await fetch(`${AGENTSCAN_API}?page=${page}&page_size=${limit}`)
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.items) {
      return []
    }
    
    // Transform and filter agents
    return data.items
      .filter(a => !isBlockedAddress(a.address))
      .map(transformAgent)
      
  } catch (err) {
    console.error('Failed to fetch from agentscan:', err)
    return []
  }
}

// Fetch agents by chain
export async function fetchAgentsByChain(chain, page = 1, limit = 20) {
  try {
    // Map our chain names to network IDs
    const networkMap = {
      'base': 'base',
      'ethereum': 'bsc-1',
      'solana': 'solana'  // Not supported by agentscan
    }
    
    // Since agentscan doesn't support Solana, we'll filter in memory
    const allAgents = await fetchAllAgents(page, limit)
    
    if (chain === 'all') return allAgents
    
    return allAgents.filter(a => a.chain === chain)
    
  } catch (err) {
    console.error('Failed to fetch by chain:', err)
    return []
  }
}

// Get total agent count
export async function getAgentCount() {
  try {
    const response = await fetch(`${AGENTSCAN_API}?page=1&page_size=1`)
    const data = await response.json()
    return data.total || 0
  } catch (err) {
    console.error('Failed to get count:', err)
    return 0
  }
}

// Mock data fallback
export const MOCK_AGENTS = [
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
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    name: 'Base Agent Alpha',
    tier: 3,
    chain: 'base',
    services: [{ type: 'MCP' }, { type: 'A2A' }],
    reviews: 8
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
    address: '0x9876543210fedcba9876543210fedcba98765432',
    name: 'Ethereum Edge',
    tier: 3,
    chain: 'ethereum',
    services: [{ type: 'MCP' }],
    reviews: 15
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
    address: '0xfedcba9876543210fedcba9876543210fedcba98',
    name: 'Base Builder',
    tier: 2,
    chain: 'base',
    services: [{ type: 'MCP' }],
    reviews: 3
  },
  {
    address: '8QkLmNoPqRsTuVwXyZ1234567890ABCDEFGHJ',
    name: 'NFT Navigator',
    tier: 3,
    chain: 'solana',
    services: [{ type: 'MCP' }, { type: 'HTTP' }],
    reviews: 22
  },
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    name: 'ETH Enforcer',
    tier: 4,
    chain: 'ethereum',
    services: [{ type: 'MCP' }, { type: 'A2A' }, { type: 'HTTP' }],
    reviews: 31
  }
]
