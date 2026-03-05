import { useState, useEffect } from 'react'

function calculateArbitrageScore(agent) {
  let score = (agent.tier || 0) * 20
  score += (agent.services?.length || 0) * 10
  if (agent.reviews > 0) score += Math.min(agent.reviews * 2, 30)
  return Math.min(score, 100)
}

function getTierLabel(tier) {
  const tiers = { 1: 'Unrated', 2: 'Bronze', 3: 'Silver', 4: 'Gold', 5: 'Platinum' }
  return tiers[tier] || 'Unrated'
}

function getTierClass(tier) {
  const classes = { 1: 'tier-unrated', 2: 'tier-bronze', 3: 'tier-silver', 4: 'tier-gold', 5: 'tier-platinum' }
  return classes[tier] || 'tier-unrated'
}

function getScoreClass(score) {
  if (score >= 70) return 'score-good'
  if (score >= 40) return 'score-neutral'
  return 'score-bad'
}

// Embedded mock data for static deployment
const MOCK_AGENTS = [
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

export default function App() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chainFilter, setChainFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Try API first, fall back to embedded data
    fetch('/api/agents')
      .then(r => r.ok ? r.json() : Promise.reject('API not available'))
      .then(data => { setAgents(data); setLoading(false) })
      .catch(() => {
        // Use embedded data for static deployment
        setAgents(MOCK_AGENTS)
        setLoading(false)
      })
  }, [])

  const filtered = agents.filter(a => {
    if (chainFilter !== 'all' && a.chain !== chainFilter) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((s, a) => s + calculateArbitrageScore(a), 0) / filtered.length)
    : 0

  return (
    <div className="container">
      <div className="header">
        <h1>Agent Arbitrage</h1>
        <p>Find undervalued AI agents across chains — reputation vs price arbitrage</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="value">{filtered.length}</div>
          <div className="label">Agents Found</div>
        </div>
        <div className="stat-card">
          <div className="value">{avgScore}</div>
          <div className="label">Avg Arb Score</div>
        </div>
        <div className="stat-card">
          <div className="value">{filtered.filter(a => calculateArbitrageScore(a) >= 70).length}</div>
          <div className="label">High Value</div>
        </div>
      </div>

      <div className="filters">
        <select value={chainFilter} onChange={e => setChainFilter(e.target.value)}>
          <option value="all">All Chains</option>
          <option value="solana">Solana</option>
          <option value="ethereum">Ethereum</option>
        </select>
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading && <div className="loading">Loading agents...</div>}
      {error && <div className="loading" style={{ color: '#f87171' }}>Error: {error}</div>}

      <div className="agent-grid">
        {filtered.map(agent => {
          const score = calculateArbitrageScore(agent)
          return (
            <div className="agent-card" key={agent.address}>
              <div className="header-row">
                <div>
                  <div className="name">
                    {agent.name}
                    <span className="chain">{agent.chain}</span>
                  </div>
                  <div className="address">{agent.address}</div>
                </div>
                <span className={`tier ${getTierClass(agent.tier)}`}>
                  {getTierLabel(agent.tier)}
                </span>
              </div>

              <div className="services">
                {agent.services?.map((s, i) => (
                  <span className="service-tag" key={i}>{s.type}</span>
                ))}
              </div>

              <div className="arbitrage-score">
                <div className={`score-value ${getScoreClass(score)}`}>{score}</div>
                <div className="score-label">Arbitrage Score · {agent.reviews || 0} reviews</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
