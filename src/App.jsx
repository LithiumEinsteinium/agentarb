import { useState, useEffect } from 'react'
// import { fetchSolanaAgents, fetchEthereumAgents } from './services/8004-api'

function App() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [chainFilter, setChainFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAgents()
  }, [])

  async function loadAgents() {
    setLoading(true)
    try {
      // Try our API first (has mock data for demo)
      const res = await fetch('/api/agents')
      if (res.ok) {
        const data = await res.json()
        setAgents(data)
      } else {
        // Fallback: try direct 8004 API
        // const solanaAgents = await fetchSolanaAgents()
        // const ethereumAgents = await fetchEthereumAgents()
        // setAgents([...solanaAgents, ...ethereumAgents])
        console.log('API not available, using mock')
      }
    } catch (err) {
      console.error('Failed to load agents:', err)
    }
    setLoading(false)
  }

  const filteredAgents = agents.filter(agent => {
    if (chainFilter !== 'all' && agent.chain !== chainFilter) return false
    if (searchTerm && !agent.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const stats = {
    total: agents.length,
    solana: agents.filter(a => a.chain === 'solana').length,
    ethereum: agents.filter(a => a.chain === 'ethereum').length,
    platinum: agents.filter(a => a.tier === 4).length,
    gold: agents.filter(a => a.tier === 3).length
  }

  const getTierName = (tier) => {
    const tiers = ['Unrated', 'Bronze', 'Silver', 'Gold', 'Platinum']
    return tiers[tier] || 'Unknown'
  }

  const getTierClass = (tier) => {
    const classes = ['tier-unrated', 'tier-bronze', 'tier-silver', 'tier-gold', 'tier-platinum']
    return classes[tier] || 'tier-unrated'
  }

  const calculateArbitrageScore = (agent) => {
    // Simple algorithm: higher tier + more services = better value
    let score = (agent.tier || 0) * 20
    score += (agent.services?.length || 0) * 10
    if (agent.reviews > 0) score += Math.min(agent.reviews * 2, 30)
    
    // Normalize to 0-100
    return Math.min(score, 100)
  }

  const getScoreClass = (score) => {
    if (score >= 60) return 'score-good'
    if (score >= 30) return 'score-neutral'
    return 'score-bad'
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🎯 Agent Arbitrage</h1>
        <p>Find undervalued AI agents across chains</p>
      </header>

      <div className="filters">
        <select value={chainFilter} onChange={(e) => setChainFilter(e.target.value)}>
          <option value="all">All Chains</option>
          <option value="solana">Solana</option>
          <option value="ethereum">Ethereum/Base</option>
        </select>
        <input 
          type="text" 
          placeholder="Search agents..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="value">{stats.total}</div>
          <div className="label">Total Agents</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.solana}</div>
          <div className="label">Solana</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.ethereum}</div>
          <div className="label">Ethereum/Base</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.platinum + stats.gold}</div>
          <div className="label">Gold+</div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading agents...</div>
      ) : (
        <div className="agent-grid">
          {filteredAgents.map((agent, idx) => {
            const score = calculateArbitrageScore(agent)
            return (
              <div key={`${agent.chain}-${idx}`} className="agent-card">
                <div className="header-row">
                  <div>
                    <div className="name">{agent.name || 'Unknown'}</div>
                    <div className="address">
                      {agent.address?.slice(0, 6)}...{agent.address?.slice(-4)}
                    </div>
                  </div>
                  <span className={`tier ${getTierClass(agent.tier || 0)}`}>
                    {getTierName(agent.tier || 0)}
                  </span>
                </div>
                
                <span className="chain">{agent.chain.toUpperCase()}</span>
                
                {agent.services?.length > 0 && (
                  <div className="services">
                    {agent.services.map((s, i) => (
                      <span key={i} className="service-tag">{s.type || s.name}</span>
                    ))}
                  </div>
                )}

                <div className="arbitrage-score">
                  <div className={`score-value ${getScoreClass(score)}`}>{score}/100</div>
                  <div className="score-label">Value Score</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filteredAgents.length === 0 && (
        <div className="loading">No agents found</div>
      )}
    </div>
  )
}

export default App
