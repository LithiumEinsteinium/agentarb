// 8004 API Service - fetches agents from Solana and Ethereum chains

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'
const SOLANA_PROGRAM_ID = '8oo4dC4JvBLwy5tGgiH3WwK4B9PWxL9Z4XjA2jzkQMbQ'

const ETH_RPC = 'https://eth-mainnet.g.alchemy.com/v2/demo'
const ERC8004_IDENTITY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'
const ERC8004_REPUTATION = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63'

// Fetch Solana 8004 agents via RPC
export async function fetchSolanaAgents() {
  try {
    const { Connection, PublicKey } = await import('@solana/web3.js')
    const connection = new Connection(SOLANA_RPC)
    
    // Get all token accounts for the 8004 program
    const programId = new PublicKey(SOLANA_PROGRAM_ID)
    
    // For now, use a simplified approach - query known agent addresses
    // In production, you'd iterate through all program accounts
    const knownAgents = [
      '4jHbm2DSBxvUEGQojJCn5bePy7ZmZQMAU7WCf7pPf7hW', // Dj
    ]
    
    const agents = []
    
    for (const addr of knownAgents) {
      try {
        const pubkey = new PublicKey(addr)
        const accountInfo = await connection.getParsedAccountInfo(pubkey)
        
        if (accountInfo.value) {
          // Parse the account data
          const data = accountInfo.value.data
          const parsed = typeof data === 'object' ? data : null
          
          agents.push({
            address: addr,
            name: parsed?.name || 'Unknown',
            tier: parsed?.tier || 1,
            services: parsed?.services || [],
            metadata: parsed || null
          })
        }
      } catch (e) {
        console.log(`Failed to fetch agent ${addr}:`, e.message)
      }
    }
    
    return agents
  } catch (err) {
    console.error('Solana fetch error:', err)
    return []
  }
}

// Fetch Ethereum ERC-8004 agents
export async function fetchEthereumAgents() {
  try {
    const { ethers } = await import('ethers')
    
    const provider = new ethers.JsonRpcProvider(ETH_RPC)
    
    // ERC-8004 Identity ABI (simplified)
    const identityABI = [
      'function getAgent(address) view returns (tuple(address owner, string uri, uint256 timestamp, bool active))'
    ]
    
    const identityContract = new ethers.Contract(ERC8004_IDENTITY, identityABI, provider)
    
    // For demo, return known agents or empty
    // In production, you'd query events or a registry
    const agents = []
    
    return agents
  } catch (err) {
    console.error('Ethereum fetch error:', err)
    return []
  }
}

// Calculate arbitrage score for an agent
export function calculateArbitrageScore(agent) {
  let score = (agent.tier || 0) * 20
  score += (agent.services?.length || 0) * 10
  if (agent.reviews > 0) score += Math.min(agent.reviews * 2, 30)
  return Math.min(score, 100)
}
