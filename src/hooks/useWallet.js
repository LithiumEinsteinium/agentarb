import { useState, useEffect } from 'react';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const getWalletName = () => {
    const w = window.ethereum;
    if (!w) return null;
    if (w.isPhantom) return 'Phantom';
    if (w.isMetaMask) return 'MetaMask';
    if (w.isCoinbaseWallet) return 'Coinbase Wallet';
    if (w.isOkexWallet) return 'OKX Wallet';
    if (w.isBraveWallet) return 'Brave Wallet';
    return 'Wallet';
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) setAddress(accounts[0]);
        }).catch(e => setError(e.message));
      
      window.ethereum.on('accountsChanged', (accounts) => {
        setAddress(accounts[0] || null);
      });
    }
  }, []);

  const connect = async () => {
    if (!window.ethereum) {
      setError('No wallet found. Please install a wallet.');
      return;
    }
    try {
      setConnecting(true);
      setError(null);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => setAddress(null);

  return { address, connect, disconnect, connecting, error, walletType: getWalletName() };
}
