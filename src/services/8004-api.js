// 8004 API Service - Fetches agents from Solana and Ethereum chains

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
const SOLANA_PROGRAM_ID = '8oo4dC4JvBLwy5tGgiH3WwK4B9PWxL9Z4XjA2jzkQMbQ'

const ETH_RPC = 'https://eth-mainnet.g.alchemy.com/v2/demo'
const BASE_RPC = 'https://base-mainnet.g.alchemy.com/v2/demo'

const ERC8004_IDENTITY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
const ERC8004_REPUTATION = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63'

// Fetch all Solana 8004 agents
export async function fetchSolanaAgents() {
  try {
    const { Connection, PublicKey } = await import('@solana/web3.js')
    const connection = new Connection(SOLANA_RPC)
    
    // Get program accounts for 8004
    const programId = new PublicKey(SOLANA_PROGRAM_ID)
    
    // Use getProgramAccounts to fetch all agent accounts
    const accounts = await connection.getProgramAccounts(programId, {
      encoding: 'base64',
      dataSlice: { offset: 0, length: 1000 }
    })
    
    const agents = []
    
    for (const account of accounts) {
      try {
        // Parse account data - structure varies by implementation
        const data = account.account.data
        const decoded = decodeSolanaAgent(data)
        
        if (decoded && decoded.name) {
          agents.push({
            address: account.pubkey.toBase58(),
            name: decoded.name,
            tier: decoded.tier || 1,
            chain: 'solana',
            services: decoded.services || [],
            reviews: decoded.reviewCount || 0,
            uri: decoded.uri || ''
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

// Decode Solana agent data (simplified - actual format depends on 8004 impl)
function decodeSolanaAgent(data) {
  try {
    // Try to decode as UTF8 strings
    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(data)
    
    // Look for common patterns
    const nameMatch = text.match(/[a-zA-Z0-9]{1,32}/)
    
    if (nameMatch) {
      return {
        name: nameMatch[0].slice(0, 32),
        tier: 1,
        services: [],
        reviewCount: 0
      }
    }
  } catch (e) {
    // Data may be binary
  }
  
  return null
}

// Fetch ERC-8004 agents from Ethereum
export async function fetchEthereumAgents() {
  try {
    const { ethers } = await import('ethers')
    
    const provider = new ethers.JsonRpcProvider(ETH_RPC)
    
    // ERC-8004 Identity ABI
    const identityABI = [
      'function getAgent(address _agent) view returns (address owner, string uri, uint256 timestamp, bool active)'
    ]
    
    const identityContract = new ethers.Contract(ERC8004_IDENTITY, identityABI, provider)
    
    // Try to get some known agent addresses (in production, you'd query events)
    // For now, return empty - we'd need a registry
    return []
  } catch (err) {
    console.error('Ethereum fetch error:', err)
    return []
  }
}

// Fetch ERC-8004 agents from Base
export async function fetchBaseAgents() {
  try {
    const { ethers } = await import('ethers')
    
    const provider = new ethers.JsonRpcProvider(BASE_RPC)
    
    const identityABI = [
      'function getAgent(address _agent) view returns (address owner, string uri, uint256 timestamp, bool active)'
    ]
    
    const identityContract = new ethers.Contract(ERC8004_IDENTITY, identityABI, provider)
    
    return []
  } catch (err) {
    console.error('Base fetch error:', err)
    return []
  }
}

// Fetch all agents from all chains
export async function fetchAllAgents() {
  const [solana, ethereum, base] = await Promise.allSettled([
    fetchSolanaAgents(),
    fetchEthereumAgents(),
    fetchBaseAgents()
  ])
  
  const agents = []
  
  if (solana.status === 'fulfilled') {
    agents.push(...solana.value.map(a => ({ ...a, chain: 'solana' })))
  }
  
  if (ethereum.status === 'fulfilled') {
    agents.push(...ethereum.value.map(a => ({ ...a, chain: 'ethereum' })))
  }
  
  if (base.status === 'fulfilled') {
    agents.push(...base.value.map(a => ({ ...a, chain: 'base' })))
  }
  
  return agents
}

// Fallback mock data if real data fails
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
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Ethereum Agent 1',
    tier: 2,
    chain: 'ethereum',
    services: [{ type: 'MCP' }],
    reviews: 3
  }
]
