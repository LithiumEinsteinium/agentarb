import { useState, useEffect } from 'react';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [walletType, setWalletType] = useState(null);

  useEffect(() => {
    // Check for different wallets
    const checkWallets = () => {
      if (window.ethereum?.isMetaMask) setWalletType('metamask');
      else if (window.ethereum?.isCoinbaseWallet) setWalletType('coinbase');
      else if (window.ethereum?.isOkexWallet) setWalletType('okx');
      else if (window.ethereum) setWalletType('other');
    };
    
    checkWallets();
    
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
      alert('Please install a wallet! (MetaMask, Coinbase Wallet, or OKX Wallet)');
      return;
    }
    try {
      setConnecting(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAddress(accounts[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => setAddress(null);

  return { address, connect, disconnect, connecting, walletType };
}
