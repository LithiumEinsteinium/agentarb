import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [wallet, setWallet] = useState(() => localStorage.getItem("wallet") || null);
  const [activeService, setActiveService] = useState(null);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat-history");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  // Save chat history when messages change
  useEffect(() => {
    localStorage.setItem("chat-history", JSON.stringify(messages));
  }, [messages]);
  const [duration, setDuration] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const services = [
    // IMAGE
    { id: 'flux-schnell', name: '🖼️ Flux Schnell', type: 'image', price: 0.03, cost: 0.01 },
    { id: 'imagen-fast', name: '🖼️ Imagen Fast', type: 'image', price: 0.08, cost: 0.03 },
    { id: 'flux-pro', name: '🖼️ Flux Pro', type: 'image', price: 0.05, cost: 0.02 },
    // VIDEO
    { id: 'sora-2', name: '🎬 Sora 2', type: 'video', pricePerSec: 0.20, costPerSec: 0.12 },
    { id: 'kling', name: '🎬 Kling Video', type: 'video', pricePerSec: 0.15, costPerSec: 0.09 },
    // SEARCH
    { id: 'exa-search', name: '🔍 Exa Search', type: 'search', price: 0.03, cost: 0.01 },
    // CRYPTO
    { id: 'coingecko', name: '💰 Crypto Prices', type: 'data', price: 0.02, cost: 0.002 },
    // TWITTER
    { id: 'twitter-user', name: '🐦 Twitter User', type: 'twitter', price: 0.02, cost: 0.005 },
    { id: 'twitter-tweets', name: '🐦 Twitter Tweets', type: 'twitter', price: 0.03, cost: 0.01 },
    // CHAT
    { id: 'basic-chat', name: '💬 Basic Chat', type: 'chat', price: 0.02, cost: 0 },
    { id: 'premium-chat', name: '⭐ Premium Chat', type: 'chat', price: 0.25, cost: 0.15 },
  ];

  const getPrice = (service) => {
    if (service.type === 'video') return service.pricePerSec * duration;
    return service.price;
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      localStorage.setItem("wallet", accounts[0]); setWallet(accounts[0]);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadMedia = (url, type) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'video' ? 'video.mp4' : 'image.png';
    a.target = '_blank';
    a.click();
  };

  const renderContent = (content) => {
    // Check for image URLs
    const imagePatterns = /\.(png|jpg|jpeg|gif|webp|svg)\?.*/i;
    const videoPatterns = /\.(mp4|webm|mov)\?.*/i;
    
    // Try to find URLs in content
    const urls = content.match(/https:\/\/[^\s"')]+\.(png|jpg|jpeg|gif|webp|svg|mp4|webm|mov)[^\s"')]*/gi);
    
    if (urls) {
      return (
        <div className="media-preview">
          {urls.map((url, i) => {
            const isVideo = url.match(/\.(mp4|webm|mov)/i);
            return (
              <div key={i} className="media-item">
                {isVideo ? (
                  <video controls src={url} width="100%" />
                ) : (
                  <img src={url} alt="Generated" onClick={() => window.open(url, '_blank')} />
                )}
                <button className="download-btn" onClick={() => downloadMedia(url, isVideo ? 'video' : 'image')}>
                  ⬇️ Download
                </button>
              </div>
            );
          })}
        </div>
      );
    }
    return <pre className="text-content">{content}</pre>;
  };

  const sendMessage = async () => {
    if (!input.trim() || !wallet || !activeService) return;
    
    const userMsg = input;
    const price = getPrice(activeService);
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { tx } = await (await fetch('https://lies-platform.onrender.com/api/x402/build-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: String(price) })
      })).json();

      try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }); } catch(e) {}
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ ...tx, from: wallet, chainId: '0x2105' }]
      });

      await new Promise(r => setTimeout(r, 5000));
      
      const result = await (await fetch('https://lies-platform.onrender.com/api/services/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          service: activeService.id,
          prompt: userMsg,
          duration: activeService.type === 'video' ? duration : null
        })
      })).json();

      const aiContent = result?.response || JSON.stringify(result);
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent, type: activeService.type }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }]);
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header>
        <h1>🛒 AI Services</h1>
        {wallet ? (
          <span className="wallet-badge">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
        ) : (
          <button className="connect-btn" onClick={connectWallet}>Connect</button>
        )}
      </header>

      <div className="main-layout">
        <aside className={`services-sidebar ${sidebarOpen ? '' : 'closed'}`}>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '←' : '☰'}
          </button>
          {sidebarOpen && (
            <>
              <h3>🖼️ Images</h3>
              <div className="services-list">
                {services.filter(s => s.type === 'image').map(s => (
                  <div key={s.id} className={`service-item ${activeService?.id === s.id ? 'active' : ''}`} onClick={() => setActiveService(s)}>
                    <span>{s.name}</span>
                    <span className="price">${s.price}</span>
                  </div>
                ))}
              </div>
              <h3>🎬 Video</h3>
              <div className="services-list">
                {services.filter(s => s.type === 'video').map(s => (
                  <div key={s.id} className={`service-item ${activeService?.id === s.id ? 'active' : ''}`} onClick={() => setActiveService(s)}>
                    <span>{s.name}</span>
                    <span className="price">${s.pricePerSec}/s</span>
                  </div>
                ))}
              </div>
              <h3>🔍 Search</h3>
              <div className="services-list">
                {services.filter(s => s.type === 'search').map(s => (
                  <div key={s.id} className={`service-item ${activeService?.id === s.id ? 'active' : ''}`} onClick={() => setActiveService(s)}>
                    <span>{s.name}</span>
                    <span className="price">${s.price}</span>
                  </div>
                ))}
              </div>
              <h3>💰 Crypto</h3>
              <div className="services-list">
                {services.filter(s => s.type === 'data').map(s => (
                  <div key={s.id} className={`service-item ${activeService?.id === s.id ? 'active' : ''}`} onClick={() => setActiveService(s)}>
                    <span>{s.name}</span>
                    <span className="price">${s.price}</span>
                  </div>
                ))}
              </div>
              <h3>🐦 Twitter</h3>
              <div className="services-list">
                {services.filter(s => s.type === 'twitter').map(s => (
                  <div key={s.id} className={`service-item ${activeService?.id === s.id ? 'active' : ''}`} onClick={() => setActiveService(s)}>
                    <span>{s.name}</span>
                    <span className="price">${s.price}</span>
                  </div>
                ))}
              </div>
              <h3>💬 Chat</h3>
              <div className="services-list">
                {services.filter(s => s.type === 'chat').map(s => (
                  <div key={s.id} className={`service-item ${activeService?.id === s.id ? 'active' : ''}`} onClick={() => setActiveService(s)}>
                    <span>{s.name}</span>
                    <span className="price">${s.price}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        <section className="chat-section">
          {!activeService ? (
            <div className="select-service-msg"><h2>Select a service to start</h2></div>
          ) : (
            <>
              <div className="chat-header">
                <button className="clear-btn" onClick={() => { setMessages([]); localStorage.removeItem("chat-history"); }}>🗑️ Clear</button>
                <h3>{activeService.name}</h3>
                <span className="service-price">
                  {activeService.type === 'video' ? `$${(activeService.pricePerSec * duration).toFixed(2)} (${duration}s)` : `$${activeService.price}`}
                </span>
              </div>
              
              {activeService.type === 'video' && (
                <div className="duration-selector">
                  <label>Duration:</label>
                  <div className="duration-options">
                    {[4, 6, 8, 10].map(d => (
                      <button key={d} className={duration === d ? 'active' : ''} onClick={() => setDuration(d)}>{d}s</button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="chat-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`message ${m.role}`}>
                    {(m.type === 'image' || m.type === 'video') && m.role === 'assistant' ? (
                      renderContent(m.content)
                    ) : (
                      <>
                        <div className="msg-content">{m.content}</div>
                        {m.role === 'assistant' && (
                          <button className="copy-btn" onClick={() => copyToClipboard(m.content, i)}>
                            {copied === i ? '✓ Copied' : '📋 Copy'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {loading && <div className="message assistant"><em>Processing...</em></div>}
              </div>
              <div className="chat-input-area">
                <textarea 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder={activeService.type === 'video' ? 'Describe the video you want...' : 'Enter your prompt...'}
                  disabled={!wallet}
                  rows={Math.max(3, input.split('\n').length)}
                />
                <button onClick={sendMessage} disabled={!wallet || loading || !input.trim()}>
                  Pay ${getPrice(activeService)}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
