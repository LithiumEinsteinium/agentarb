import { useState, useEffect } from 'react';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null);

  const detectWallet = () => {
    const w = window.ethereum;
    if (!w) return null;
    if (w.isMetaMask) return 'MetaMask';
    if (w.isCoinbaseWallet) return 'Coinbase Wallet';
    if (w.isOkexWallet) return 'OKX Wallet';
    if (w.isBraveWallet) return 'Brave Wallet';
    if (w.isRabby) return 'Rabby';
    return 'Wallet';
  };

  useEffect(() => {
    setWalletType(detectWallet());
    
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) setAddress(accounts[0]);
        });
      
      window.ethereum.on('accountsChanged', (accounts) => {
        setAddress(accounts[0] || null);
      });
    }
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      // Try to open wallet download page
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    try {
      setConnecting(true);
      
      // Try standard requestAccounts
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setWalletType(detectWallet());
      }
    } catch (err) {
      console.error('Connection error:', err);
      alert('Failed to connect wallet: ' + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => setAddress(null);

  return { address, connect, disconnect, connecting, walletType };
}
