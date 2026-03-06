import { useState, useEffect } from 'react';

const PHANTOM_APP_ID = '2bca8d09-61a7-4723-ac15-78f26035ded0';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null);

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
    setWalletType(getWalletName());
    
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
      alert('Please install a wallet!');
      return;
    }
    try {
      setConnecting(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setWalletType(getWalletName());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => setAddress(null);

  return { address, connect, disconnect, connecting, walletType };
}
