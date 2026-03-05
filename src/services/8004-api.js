// 8004 API Service - Mock data for Agent Arbitrage Platform
// Note: Real 8004 data requires an API or indexer - see 8004scan.io

// Known bad actor addresses to filter out (phishing/hacks)
const BLOCKED_ADDRESSES = new Set([
  '0x1234567890abcdef1234567890abcdef12345678'.toLowerCase(),
])

// Check if address is blocked
function isBlockedAddress(address, chain) {
  if (!address) return true
  return BLOCKED_ADDRESSES.has(address.toLowerCase())
}

// Mock data - represents what we'd get from 8004scan API
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
    reviews: 12,
    uri: ''
  },
  {
    address: '7AbCdEfGhIjKlMnOpQrStUvWxYz1234567890ABC',
    name: 'Jade Net',
    tier: 4,
    chain: 'solana',
    services: [{ type: 'MCP' }],
    reviews: 28,
    uri: ''
  },
  {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    name: 'Base Agent Alpha',
    tier: 3,
    chain: 'base',
    services: [{ type: 'MCP' }, { type: 'A2A' }],
    reviews: 8,
    uri: ''
  },
  {
    address: '9XyZ1234567890abcdefABCDEF123456789GHIJK',
    name: 'Solana Sentinel',
    tier: 4,
    chain: 'solana',
    services: [{ type: 'MCP' }, { type: 'A2A' }, { type: 'HTTP' }],
    reviews: 45,
    uri: ''
  },
  {
    address: '0x9876543210fedcba9876543210fedcba98765432',
    name: 'Ethereum Edge',
    tier: 3,
    chain: 'ethereum',
    services: [{ type: 'MCP' }],
    reviews: 15,
    uri: ''
  },
  {
    address: '3MnOpQrStUvWxYz1234567890ABCDEFGHIJKL',
    name: 'DeFi Dolphin',
    tier: 2,
    chain: 'solana',
    services: [{ type: 'MCP' }, { type: 'A2A' }],
    reviews: 7,
    uri: ''
  },
  {
    address: '0xfedcba9876543210fedcba9876543210fedcba98',
    name: 'Base Builder',
    tier: 2,
    chain: 'base',
    services: [{ type: 'MCP' }],
    reviews: 3,
    uri: ''
  },
  {
    address: '8QkLmNoPqRsTuVwXyZ1234567890ABCDEFGHJ',
    name: 'NFT Navigator',
    tier: 3,
    chain: 'solana',
    services: [{ type: 'MCP' }, { type: 'HTTP' }],
    reviews: 22,
    uri: ''
  },
  {
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    name: 'ETH Enforcer',
    tier: 4,
    chain: 'ethereum',
    services: [{ type: 'MCP' }, { type: 'A2A' }, { type: 'HTTP' }],
    reviews: 31,
    uri: ''
  }
]

// Fetch from API (mock for now)
export async function fetchAllAgents() {
  // In production, this would call 8004scan API or our own indexer
  // For now, return mock data
  return MOCK_AGENTS.filter(a => !isBlockedAddress(a.address, a.chain))
}

// Fetch Solana agents
export async function fetchSolanaAgents() {
  return MOCK_AGENTS.filter(a => a.chain === 'solana')
}

// Fetch Base agents  
export async function fetchBaseAgents() {
  return MOCK_AGENTS.filter(a => a.chain === 'base')
}

// Fetch Ethereum agents
export async function fetchEthereumAgents() {
  return MOCK_AGENTS.filter(a => a.chain === 'ethereum')
}
