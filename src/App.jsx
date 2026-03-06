import { useState, useEffect, useMemo } from 'react'
import { useWallet } from './hooks/useWallet'
import { fetchAllAgents, getAgentCount } from './services/8004-api'

// Process payment and call service
async function processPayment(service, payingService) {
  if (!window.ethereum) {
    alert("Please connect your wallet first!");
    return null;
  }
  try {
    // Get wallet
    const accounts = window.phantom?.ethereum 
      ? (await window.phantom.ethereum.request({ method: 'eth_requestAccounts' }))
      : (await window.ethereum.request({ method: 'eth_requestAccounts' }));
    const from = accounts[0];
    
    // Build transaction
    const buildRes = await fetch("https://lies-platform.onrender.com/api/x402/build-tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: String(payingService.price) })
    });
    const { tx } = await buildRes.json();
    
    // Sign and submit
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x2105" }]
      });
    } catch (e) { console.log("Chain switch error:", e); }
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{ ...tx, from, chainId: "0x2105" }]
    });
    
    // Verify payment
    const verifyRes = await fetch("https://lies-platform.onrender.com/api/x402/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentTxHash: txHash })
    });
    const { valid } = await verifyRes.json();
    
    if (!valid) {
      alert("Payment verification failed!");
      return null;
    }
    
    // Call the service
    const serviceRes = await fetch("https://lies-platform.onrender.com" + payingService.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello" })
    });
    const result = await serviceRes.json();
    
    console.log("Response:", result);
    return result;
  } catch (err) {
    console.error("Payment error:", err);
      alert("Error: " + err.message + ". Check console for details.");
    console.error("Payment error:", err);
      alert("Error: " + err.message + ". Check console for details."); alert("Error: " + err.message + "\n" + (err.response?.data || ""));;
    return null;
  }
}

async function fetchServices() {
  try {
    const res = await fetch("https://lies-platform.onrender.com/api/x402/services");
    const data = await res.json();
    return data.services || [];
  } catch (err) {
    console.error("Payment error:", err);
      alert("Error: " + err.message + ". Check console for details.");
    return [];
  }
}

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
  const { address, connect } = useWallet()
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
  const [statusFilter, setStatusFilter] = useState('all')
  const [x402Filter, setX402Filter] = useState('all')
  const [showPaymentModal, setShowPaymentModal] = useState(null)
  const [payingService, setPayingService] = useState(null)
  const [showServices, setShowServices] = useState(true)
  const [services, setServices] = useState([])

  const PAGE_SIZE = 50

  useEffect(() => {
    fetchServices()
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
      if (statusFilter !== 'all') {
        const isActive = a.active !== false
        if (statusFilter === 'active' && !isActive) return false
        if (statusFilter === 'inactive' && isActive) return false
      }
      if (x402Filter !== 'all' && !a.x402Support) return false
      if (search && !a.name?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [agents, chainFilter, tierFilter, serviceFilter, statusFilter, x402Filter, search])

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

      
      {showServices && (
      <div className="services-section">
        <h2>🛒 Agent Services</h2>
        <p className="services-intro">Buy AI services directly - we proxy via x402</p>
        
        <div className="services-grid">
          <div className="service-card">
            <h3>🖼️ Nano Banana</h3>
            <p className="service-desc">Image gen</p>
            <div className="service-price"><span className="price">$0.06</span></div>
            <button className="buy-button" onClick={() => setPayingService({name: 'Basic Chat', price: 0.02, service: 'basic-chat', endpoint: '/api/services/grok-fast'})}>Buy</button>
          </div>
          
          <div className="service-card">
            <h3>🔍 Exa Search</h3>
            <p className="service-desc">Web search</p>
            <div className="service-price"><span className="price">$0.03</span></div>
            <button className="buy-button" onClick={() => setPayingService({name: 'Premium Chat', price: 0.25, service: 'premium-chat', endpoint: '/api/services/grok-fast'})}>Buy</button>
          </div>
          
          <div className="service-card">
            <h3>📊 Data Analysis</h3>
            <p className="service-desc">Market data</p>
            <div className="service-price"><span className="price">$0.04</span></div>
            <button className="buy-button" onClick={() => setPayingService({name: 'Code Assistant', price: 0.03, service: 'code-assistant', endpoint: '/api/services/grok-fast'})}>Buy</button>
          </div>
          
          <div className="service-card">
            <h3>💬 NLP Chat</h3>
            <p className="service-desc">AI chat</p>
            <div className="service-price"><span className="price">$0.02</span></div>
            <button className="buy-button" onClick={() => setPayingService({name: 'Grok Fast', price: 0.04, service: 'grok-fast', endpoint: '/api/services/grok-fast'})}>Buy</button>
          </div>
          </div>
          
          <div className="service-card">
            <h3>🔦 Spotlight</h3>
            <p className="service-desc">Best model (GPT-4o)</p>
            <div className="service-price"><span className="price">$0.75</span></div>
            <button className="buy-button" onClick={() => setPayingService({name: 'Spotlight', price: 0.75, service: 'spotlight', endpoint: '/api/services/spotlight'})}>Hire</button>
          </div>
          
          <div className="service-card">
            <h3>🖼️ Image Gen</h3>
            <p className="service-desc">AI image generation</p>
            <div className="service-price"><span className="price">$0.08</span></div>
            <button className="buy-button" onClick={() => setPayingService({name: 'Image Gen', price: 0.08, service: 'image-gen', endpoint: '/api/services/image-gen'})}>Hire</button>
          </div>
          
          <div className="service-card">
            <h3>🔊 Audio Gen</h3>
            <p className="service-desc">Text to speech</p>
            <div className="service-price"><span className="price">$0.03</span></div>
            <button className="buy-button" onClick={() => setPayingService({name: 'Audio Gen', price: 0.03, service: 'audio-gen', endpoint: '/api/services/audio-gen'})}>Hire</button>
        </div>
        
        <p className="services-note">🔒 x402 payments</p>
      </div>
      )}


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

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <select value={x402Filter} onChange={e => setX402Filter(e.target.value)}>
          <option value="all">All Payments</option>
          <option value="x402">x402 Only</option>
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

              <div className="info-row">
                <span className="info-label">Owner:</span>
                <span className="info-value">{agent.owner ? agent.owner.slice(0,8)+'...'+agent.owner.slice(-6) : 'N/A'}</span>
              </div>
              
              {agent.description && (
                <div className="agent-description">
                  {agent.description.slice(0, 80)}{agent.description.length > 80 ? '...' : ''}
                </div>
              )}
              
              {agent.skills && agent.skills.length > 0 && (
                <div className="agent-skills">
                  {agent.skills.slice(0, 2).map((skill, i) => (
                    <span key={i} className="skill-tag">{skill.split('/').pop()}</span>
                  ))}
                  {agent.skills.length > 2 && <span className="skill-more">+{agent.skills.length - 2}</span>}
                </div>
              )}
              
              <div className="agent-status">
                <span className={`status-badge ${agent.active ? 'active' : 'inactive'}`}>
                  {agent.active ? '● Active' : '○ Inactive'}
                </span>
              </div>
              
              <div className="agent-actions">
                <button 
                  className="hire-btn"
                  onClick={() => setShowPaymentModal(agent)}
                >
                  👤 Hire
                </button>
                {agent.services?.length > 0 && (
                  <button 
                    className="connect-btn"
                    onClick={() => {
                      const service = agent.services.find(s => 
                        s.endpoint && !s.endpoint.includes('github.com')
                      ) || agent.services[0]
                      if (service?.endpoint) {
                        let url = service.endpoint
                        // Convert IPFS to gateway
                        if (url.startsWith('ipfs://')) {
                          url = `https://ipfs.io/ipfs/${url.replace('ipfs://', '')}`
                        }
                        // Open as-is for GitHub/websites
                        window.open(url, '_blank')
                      }
                    }}
                  >
                    🤖 Connect
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
            <li>👤 <strong>Hire</strong> - Humans pay to hire agents</li>
            <li>🤖 <strong>Connect</strong> - Agents pay to connect (MCP/A2A)</li>
            <li>💰 Pay-per-use ($0.01-0.05)</li>
            <li>💸 Referral commissions (10%)</li>
          </ul>
          <p className="premium-note">Built on x402 standard for seamless crypto payments</p>
        </div>


      <div className="services-section">
        <h2>🛒 Agent Services</h2>
        <p className="services-intro">Buy AI services directly - we proxy the requests via x402</p>
        
        <div className="services-grid">
          <div className="service-card">
            <h3>🖼️ Nano Banana</h3>
            <p className="service-desc">Image generation via AI</p>
            <div className="service-price">
              <span className="price">$0.06</span>
              <span className="note">(we pay $0.05)</span>
            </div>
            <button className="buy-button" onClick={() => alert('Service purchase coming soon!')}>Buy Now</button>
          </div>
          
          <div className="service-card">
            <h3>🔍 Exa Search</h3>
            <p className="service-desc">AI-powered web search</p>
            <div className="service-price">
              <span className="price">$0.03</span>
              <span className="note">(we pay $0.02)</span>
            </div>
            <button className="buy-button" onClick={() => alert('Service purchase coming soon!')}>Buy Now</button>
          </div>
          
          <div className="service-card">
            <h3>📊 Data Analysis</h3>
            <p className="service-desc">Crypto market data queries</p>
            <div className="service-price">
              <span className="price">$0.04</span>
              <span className="note">(we pay $0.03)</span>
            </div>
            <button className="buy-button" onClick={() => alert('Service purchase coming soon!')}>Buy Now</button>
          </div>
          
          <div className="service-card">
            <h3>💬 NLP Chat</h3>
            <p className="service-desc">AI conversation agent</p>
            <div className="service-price">
              <span className="price">$0.02</span>
              <span className="note">(we pay $0.015)</span>
            </div>
            <button className="buy-button" onClick={() => alert('Service purchase coming soon!')}>Buy Now</button>
          </div>
        </div>
        
        <p className="services-note">🔒 Payments via x402 protocol - automatic and secure</p>
      </div>



      {payingService && (
        <div className="modal-overlay" onClick={() => setPayingService(null)}>
          <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPayingService(null)}>×</button>
            <h2>💳 x402 Payment</h2>
            <div className="payment-agent-info">
              <h3>{payingService.name}</h3>
              <p className="payment-address">Service via x402 proxy</p>
            </div>
            <div className="payment-pricing">
              <div className="price-option">
                <span>Your Price</span>
                <span className="price">${payingService.price}</span>
              </div>
              <div className="price-option">
                <span>We Pay</span>
                <span className="price">${payingService.cost}</span>
              </div>
              <div className="price-option profit">
                <span>You Save</span>
                <span className="price">${payingService.price - payingService.cost}</span>
              </div>
            </div>
            <div className="payment-actions">
              <button className="pay-button" onClick={async () => { const result = await processPayment(null, payingService); if (result) alert("Success! Response: " + JSON.stringify(result).substring(0, 200)); }}>
                🔗 Connect Wallet (MetaMask, Coinbase, OKX)
              </button>
              <p className="payment-note">Powered by x402 protocol</p>
            </div>
          </div>
        </div>
      )}


      {/* x402 Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(null)}>
          <div className="modal-content payment-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowPaymentModal(null)}>×</button>
            <h2>🤝 Hire Agent via x402</h2>
            <div className="payment-agent-info">
              <h3>{showPaymentModal.name}</h3>
              <p className="payment-address">{showPaymentModal.address?.slice(0,12)}...{showPaymentModal.address?.slice(-8)}</p>
            </div>
            <div className="payment-details">
              <div className="payment-row"><span>Service:</span><span>{showPaymentModal.services?.[0]?.type || 'MCP'}</span></div>
              <div className="payment-row"><span>Network:</span><span>{showPaymentModal.chain || 'N/A'}</span></div>
              <div className="payment-row"><span>x402 Support:</span><span className={showPaymentModal.x402Support ? 'supported' : 'unsupported'}>{showPaymentModal.x402Support ? '✓ Yes' : '✗ No'}</span></div>
            </div>
            <div className="payment-pricing">
              <h4>Estimated Cost</h4>
              <div className="price-options">
                <div className="price-option"><span>Basic Query</span><span className="price">$0.01 USDC</span></div>
                <div className="price-option"><span>Full Access</span><span className="price">$0.05 USDC</span></div>
              </div>
            </div>
            <div className="payment-actions">
              <button className="pay-button" onClick={() => setPayingService({name: 'Basic Chat', price: 0.02, service: 'basic-chat', endpoint: '/api/services/grok-fast'})}>💳 Pay with Wallet</button>
              <p className="payment-note">Payment via x402 protocol</p>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
