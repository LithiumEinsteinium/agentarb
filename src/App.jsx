import { useState, useEffect, useMemo } from 'react'
import { fetchAllAgents, getAgentCount } from './services/8004-api'

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

function getExplorerUrl(address, chain) {
  if (chain === 'solana') {
    return `https://solscan.io/address/${address}`
  } else if (chain === 'ethereum') {
    return `https://etherscan.io/address/${address}`
  } else if (chain === 'base') {
    return `https://basescan.org/address/${address}`
  } else if (chain === 'celo') {
    return `https://celoscan.io/address/${address}`
  }
  return `#`
}

function getScoreClass(score) {
  if (score >= 70) return 'score-good'
  if (score >= 40) return 'score-neutral'
  return 'score-bad'
}

export default function App() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chainFilter, setChainFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [totalAgents, setTotalAgents] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const PAGE_SIZE = 50

  useEffect(() => {
    loadAgents(1)
  }, [])

  async function loadAgents(pageNum = 1) {
    setLoading(true)
    setError(null)
    
    try {
      const data = await fetchAllAgents(pageNum, PAGE_SIZE)
      
      if (data.length > 0) {
        if (pageNum === 1) {
          setAgents(data)
        } else {
          setAgents(prev => [...prev, ...data])
        }
        setHasMore(data.length === PAGE_SIZE)
        setPage(pageNum)
        
        if (pageNum === 1) {
          const count = await getAgentCount()
          setTotalAgents(count)
        }
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load agents:', err)
      setError(err.message)
    }
    
    setLoading(false)
  }

  function loadMore() {
    if (!loading && hasMore) {
      loadAgents(page + 1)
    }
  }

  const filtered = useMemo(() => {
    return agents.filter(a => {
      const chain = a.chain || 'ethereum'  // Default to ethereum
      if (chainFilter !== 'all' && chain !== chainFilter) return false
      if (tierFilter !== 'all' && a.tier !== parseInt(tierFilter)) return false
      if (serviceFilter !== 'all' && !a.services?.some(s => s.type === serviceFilter)) return false
      if (search && !a.name?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [agents, chainFilter, tierFilter, serviceFilter, search])

  const avgScore = filtered.length
    ? Math.round(filtered.reduce((s, a) => s + calculateArbitrageScore(a), 0) / filtered.length)
    : 0

  return (
    <div className="container">
      <div className="header">
        <h1>Agent Arbitrage</h1>
        <p>Find undervalued AI agents across chains — reputation vs price arbitrage</p>
        {totalAgents > 0 && (
          <p className="total-count">📊 {totalAgents.toLocaleString()} agents indexed</p>
        )}
        <p className="x402-notice">🔒 x402 Payments Ready — Coming Soon</p>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="value">{filtered.length}</div>
          <div className="label">Showing</div>
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
          <option value="ethereum">Ethereum/BSC</option>
          <option value="base">Base</option>
        </select>
        
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
          <option value="all">All Tiers</option>
          <option value="5">Platinum</option>
          <option value="4">Gold</option>
          <option value="3">Silver</option>
          <option value="2">Bronze</option>
          <option value="1">Unrated</option>
        </select>
        
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}>
          <option value="all">All Services</option>
          <option value="MCP">MCP</option>
          <option value="A2A">A2A</option>
          <option value="HTTP">HTTP</option>
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
                  <div className="address">
                    <a href={getExplorerUrl(agent.address, agent.chain)} target="_blank" rel="noopener noreferrer">
                      {agent.address.slice(0, 8)}...{agent.address.slice(-6)}
                    </a>
                  </div>
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
              
              <div className="agent-actions">
                <button 
                  className="hire-btn"
                  onClick={() => {
                    if (agent.uri) {
                      const url = agent.uri.startsWith('ipfs://') 
                        ? `https://ipfs.io/ipfs/${agent.uri.replace('ipfs://', '')}`
                        : agent.uri
                      window.open(url, '_blank')
                    }
                  }}
                >
                  🤝 Hire
                </button>
                {agent.services?.length > 0 && (
                  <button 
                    className="connect-btn"
                    onClick={() => {
                      const service = agent.services.find(s => s.endpoint) || agent.services[0]
                      if (service?.endpoint) {
                        let url = service.endpoint
                        if (url.startsWith('ipfs://')) {
                          url = `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`
                        }
                        window.open(url, '_blank')
                      }
                    }}
                  >
                    🔗 Connect
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {!loading && hasMore && (
        <div className="load-more">
          <button onClick={loadMore}>Load More Agents</button>
        </div>
      )}
      
      {!loading && filtered.length === 0 && (
        <div className="loading">No agents found matching your filters</div>
      )}
      
      <div className="premium-section">
        <div className="premium-card">
          <h3>🔒 x402 Payments</h3>
          <p>Premium features coming soon:</p>
          <ul>
            <li>💰 Pay-per-search ($0.01-0.05)</li>
            <li>🤖 AI Agent hiring via x402</li>
            <li>📊 Advanced analytics</li>
            <li>🔔 Price drop alerts</li>
            <li>💸 Referral commissions (10%)</li>
          </ul>
          <p className="premium-note">Built on x402 standard for seamless crypto payments</p>
        </div>
      </div>
    </div>
  )
}
