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
  const [duration, setDuration] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState('images');

  useEffect(() => {
    localStorage.setItem("chat-history", JSON.stringify(messages));
  }, [messages]);

  const categories = [
    { id: 'images', name: '🖼️ Images', services: [
      { id: 'flux-schnell', name: 'Flux Schnell', price: 0.03 },
      { id: 'imagen-fast', name: 'Imagen Fast', price: 0.08 },
      { id: 'flux-pro', name: 'Flux Pro', price: 0.05 },
    ]},
    { id: 'video', name: '🎬 Video', services: [
      { id: 'sora-2', name: 'Sora 2', price: 0.20, perSec: true },
      { id: 'kling', name: 'Kling Video', price: 0.15, perSec: true },
    ]},
    { id: 'search', name: '🔍 Search', services: [
      { id: 'exa-search', name: 'Exa Search', price: 0.03 },
    ]},
    { id: 'crypto', name: '💰 Crypto', services: [
      { id: 'coingecko', name: 'Crypto Prices', price: 0.02 },
    ]},
    { id: 'twitter', name: '🐦 Twitter', services: [
      { id: 'twitter-user', name: 'User Info', price: 0.02 },
      { id: 'twitter-tweets', name: 'User Tweets', price: 0.03 },
    ]},
    { id: 'chat', name: '💬 Chat', services: [
      { id: 'basic-chat', name: 'Basic Chat', price: 0.02 },
      { id: 'premium-chat', name: 'Premium Chat', price: 0.25 },
    ]},
  ];

  const getPrice = (service) => {
    const cat = categories.find(c => c.services.some(s => s.id === service.id));
    const svc = cat?.services.find(s => s.id === service.id);
    if (svc?.perSec) return svc.price * duration;
    return svc?.price || 0;
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      localStorage.setItem("wallet", accounts[0]);
      setWallet(accounts[0]);
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
    const urls = content.match(/https:\/\/[^\s"')]+\.(png|jpg|jpeg|gif|webp|svg|mp4|webm|mov)[^\s"')]*/gi);
    if (urls) {
      return (
        <div className="media-preview">
          {urls.map((url, i) => {
            const isVideo = url.match(/\.(mp4|webm|mov)/i);
            return (
              <div key={i} className="media-item">
                {isVideo ? <video controls src={url} /> : <img src={url} alt="Generated" onClick={() => window.open(url, '_blank')} />}
                <button className="download-btn" onClick={() => downloadMedia(url, isVideo ? 'video' : 'image')}>⬇️ Download</button>
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: String(price) })
      })).json();
      try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }); } catch(e) {}
      const txHash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{ ...tx, from: wallet, chainId: '0x2105' }] });
      await new Promise(r => setTimeout(r, 5000));
      const result = await (await fetch('https://lies-platform.onrender.com/api/services/frames', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: activeService.id, prompt: userMsg, duration: activeService.perSec ? duration : null })
      })).json();
      setMessages(prev => [...prev, { role: 'assistant', content: result?.response || JSON.stringify(result), type: activeService.type }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }]);
    }
    setLoading(false);
  };

  return (
    <div className="app">
      <header>
        <h1>🛒 AI Services</h1>
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? "←" : "☰ Menu"}</button>}
        {wallet ? <span className="wallet-badge">{wallet.slice(0,6)}...{wallet.slice(-4)}</span> : <button className="connect-btn" onClick={connectWallet}>Connect</button>}
      </header>

      <div className="main-layout">
        
        <aside className={`services-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-content">
            <div className="nav-section">
              <div className="nav-header" onClick={() => setSidebarOpen(false)}>
                <span>⬅️ Collapse Menu</span>
              </div>
            </div>
            {categories.map(cat => (
              <div key={cat.id} className="nav-section">
                <div className={`nav-header ${expandedCat === cat.id ? 'expanded' : ''}`} onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}>
                  <span>{cat.name}</span>
                  <span className="nav-arrow">{expandedCat === cat.id ? '▼' : '▶'}</span>
                </div>
                {expandedCat === cat.id && (
                  <div className="nav-services">
                    {cat.services.map(svc => (
                      <div key={svc.id} className={`nav-item ${activeService?.id === svc.id ? 'active' : ''}`} onClick={() => { setActiveService({ id: svc.id, name: svc.name, type: cat.id === 'images' ? 'image' : cat.id === 'video' ? 'video' : cat.id === 'chat' ? 'chat' : 'other', price: svc.price, perSec: svc.perSec }); setSidebarOpen(false); }}>
                        <span>{svc.name}</span>
                        <span className="price">${svc.perSec ? svc.price + '/s' : svc.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <section className="chat-section">
          {!activeService ? (
            <div className="select-service-msg"><h2>Select a service to start</h2></div>
          ) : (
            <>
              <div className="chat-header">
                <button className="clear-btn" onClick={() => { setMessages([]); localStorage.removeItem("chat-history"); }}>🗑️</button>
                <h3>{activeService.name}</h3>
                <span className="service-price">${getPrice(activeService)}</span>
              </div>
              {activeService.perSec && (
                <div className="duration-selector">
                  <label>Duration:</label>
                  <div className="duration-options">{[4, 6, 8, 10].map(d => <button key={d} className={duration === d ? 'active' : ''} onClick={() => setDuration(d)}>{d}s</button>)}</div>
                </div>
              )}
              <div className="chat-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`message ${m.role}`}>
                    {(m.type === 'image' || m.type === 'video') && m.role === 'assistant' ? renderContent(m.content) : (
                      <>
                        <div className="msg-content">{m.content}</div>
                        {m.role === 'assistant' && <button className="copy-btn" onClick={() => copyToClipboard(m.content, i)}>{copied === i ? '✓ Copied' : '📋'}</button>}
                      </>
                    )}
                  </div>
                ))}
                {loading && <div className="message assistant"><em>Processing...</em></div>}
              </div>
              <div className="chat-input-area">
                <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter prompt..." disabled={!wallet} rows={Math.max(3, input.split('\n').length)} />
                <button onClick={sendMessage} disabled={!wallet || loading || !input.trim()}>Pay ${getPrice(activeService)}</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
