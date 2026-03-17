// Isme:

// updated blockchain.ts use hoga

// wallet connect

// contract init

// admin check

// disconnect/reset

// state management clean rahega


// Full updated src/contexts/BlockchainContext.tsx

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { blockchainService } from '@/lib/blockchain';

interface BlockchainContextType {
  service: typeof blockchainService;
  isConnected: boolean;
  walletAddress: string;
  contractAddress: string;
  isAdmin: boolean;
  isLoading: boolean;
  error: string;
  connectWallet: () => Promise<void>;
  initContract: (contractAddress: string) => Promise<void>;
  disconnect: () => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      setError('');

      const address = await blockchainService.connectWallet();

      setWalletAddress(address);
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setIsConnected(false);
      setWalletAddress('');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const initContract = async (newContractAddress: string) => {
    try {
      setIsLoading(true);
      setError('');

      await blockchainService.initContract(newContractAddress);

      const adminStatus = await blockchainService.isAdmin();

      setContractAddress(newContractAddress);
      setIsAdmin(adminStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize contract');
      setContractAddress('');
      setIsAdmin(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    blockchainService.reset();

    setIsConnected(false);
    setWalletAddress('');
    setContractAddress('');
    setIsAdmin(false);
    setIsLoading(false);
    setError('');
  };

  const value = useMemo(
    () => ({
      service: blockchainService,
      isConnected,
      walletAddress,
      contractAddress,
      isAdmin,
      isLoading,
      error,
      connectWallet,
      initContract,
      disconnect
    }),
    [isConnected, walletAddress, contractAddress, isAdmin, isLoading, error]
  );

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);

  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }

  return context;
}

