import { useState } from 'react';
import './index.css';

function App() {
  const [wallet, setWallet] = useState(null);
  const [activeService, setActiveService] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const services = [
    { id: 'grok-fast', name: '⚡ Grok Fast', price: 0.04 },
    { id: 'basic-chat', name: '💬 Basic Chat', price: 0.02 },
    { id: 'premium-chat', name: '⭐ Premium Chat', price: 0.25 },
    { id: 'code-assistant', name: '💻 Code Assistant', price: 0.03 },
    { id: 'spotlight', name: '🔦 Spotlight', price: 0.75 },
  ];

  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accounts[0]);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendMessage = async () => {
    if (!input.trim() || !wallet || !activeService) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { tx } = await (await fetch('https://lies-platform.onrender.com/api/x402/build-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: String(activeService.price) })
      })).json();

      try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }); } catch(e) {}
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ ...tx, from: wallet, chainId: '0x2105' }]
      });

      await new Promise(r => setTimeout(r, 5000));
      
      const result = await (await fetch('https://lies-platform.onrender.com/api/services/' + activeService.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      })).json();

      const aiContent = result?.response?.content || result?.response || JSON.stringify(result);
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
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
        <aside className="services-sidebar">
          <h3>Services</h3>
          <div className="services-list">
            {services.map(s => (
              <div 
                key={s.id} 
                className={`service-item ${activeService?.id === s.id ? 'active' : ''}`}
                onClick={() => setActiveService(s)}
              >
                <span>{s.name}</span>
                <span className="price">${s.price}</span>
              </div>
            ))}
          </div>
        </aside>

        <section className="chat-section">
          {!activeService ? (
            <div className="select-service-msg">
              <h2>Select a service to start</h2>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <h3>{activeService.name}</h3>
              </div>
              <div className="chat-messages">
                {messages.map((m, i) => (
                  <div key={i} className={`message ${m.role}`}>
                    <div className="msg-content">{m.content}</div>
                    {m.role === 'assistant' && (
                      <button className="copy-btn" onClick={() => copyToClipboard(m.content, i)}>
                        {copied === i ? '✓ Copied' : '📋 Copy'}
                      </button>
                    )}
                  </div>
                ))}
                {loading && <div className="message assistant"><em>Thinking...</em></div>}
              </div>
              <div className="chat-input-area">
                <textarea 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  placeholder="Enter your prompt..."
                  disabled={!wallet}
                  rows={Math.max(3, input.split('\n').length)}
                />
                <button onClick={sendMessage} disabled={!wallet || loading || !input.trim()}>Send</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
