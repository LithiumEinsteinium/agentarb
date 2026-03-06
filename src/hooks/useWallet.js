import { useState, useEffect, useCallback } from 'react';
import { BrowserSDK, AddressType } from '@phantom/browser-sdk';

const APP_ID = '2bca8d09-61a7-4723-ac15-78f26035ded0';

let sdk = null;

const getSDK = () => {
  if (!sdk) {
    sdk = new BrowserSDK({
      providers: ["injected", "phantom"],
      addressTypes: [AddressType.ethereum],
      appId: APP_ID,
    });
  }
  return sdk;
};

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [walletType, setWalletType] = useState(null);

  useEffect(() => {
    // Check for Phantom wallet
    if (window.phantom?.ethereum) {
      setWalletType('Phantom');
    } else if (window.ethereum?.isMetaMask) {
      setWalletType('MetaMask');
    } else if (window.ethereum?.isOkexWallet) {
      setWalletType('OKX Wallet');
    } else if (window.ethereum) {
      setWalletType('EVM Wallet');
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      setError(null);
      
      const phantomSdk = getSDK();
      
      // Try Phantom first
      if (window.phantom?.ethereum) {
        const { addresses } = await phantomSdk.connect({ provider: 'phantom' });
        if (addresses?.ethereum?.[0]) {
          setAddress(addresses.ethereum[0]);
          setWalletType('Phantom');
          return;
        }
      }
      
      // Fallback to injected wallet
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
  }, []);

  return { address, connect, disconnect, connecting, error, walletType };
}
