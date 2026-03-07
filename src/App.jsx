import { useState, useEffect, useMemo } from 'react';
import './index.css';

function App() {
  const [wallet, setWallet] = useState(null);
  const [currentService, setCurrentService] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
    } else {
      alert('Please install MetaMask or another wallet');
    }
  };

  const selectService = (service) => {
    setCurrentService(service);
    setMessages([]);
    setChatOpen(true);
  };

  const sendMessage = async () => {
    if (!input.trim() || !wallet) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Build tx
      const txRes = await fetch('https://lies-platform.onrender.com/api/x402/build-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: String(currentService.price) })
      });
      const { tx } = await txRes.json();

      // Switch to Base and send
      try { await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] }); } catch(e) {}
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ ...tx, from: wallet, chainId: '0x2105' }]
      });

      // Wait and verify
      await new Promise(r => setTimeout(r, 5000));
      
      const verifyRes = await fetch('https://lies-platform.onrender.com/api/x402/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentTxHash: txHash })
      });
      
      // Call service
      const serviceRes = await fetch('https://lies-platform.onrender.com/api/services/' + currentService.id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg })
      });
      
      const result = await serviceRes.json();
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
          <button className="wallet-btn">{wallet.slice(0,6)}...{wallet.slice(-4)}</button>
        ) : (
          <button className="wallet-btn" onClick={connectWallet}>Connect Wallet</button>
        )}
      </header>

      <main>
        <div className="services-grid">
          {services.map(s => (
            <div key={s.id} className="service-card" onClick={() => selectService(s)}>
              <h3>{s.name}</h3>
              <p className="price">${s.price}</p>
            </div>
          ))}
        </div>
      </main>

      {chatOpen && (
        <div className="chat-overlay" onClick={() => setChatOpen(false)}>
          <div className="chat-modal" onClick={e => e.stopPropagation()}>
            <div className="chat-header">
              <h3>{currentService?.name}</h3>
              <button onClick={() => setChatOpen(false)}>×</button>
            </div>
            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>
                  <strong>{m.role === 'user' ? 'You' : 'AI'}:</strong> {m.content}
                </div>
              ))}
              {loading && <div className="msg assistant"><em>Thinking...</em></div>}
            </div>
            <div className="chat-input">
              <input 
                value={input} 
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Enter your prompt..."
                disabled={!wallet}
              />
              <button onClick={sendMessage} disabled={!wallet || loading}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
