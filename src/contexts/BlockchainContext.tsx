import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { blockchainService, BlockchainService } from '@/lib/blockchain';

interface BlockchainContextType {
  isConnected: boolean;
  walletAddress: string | null;
  contractAddress: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  initContract: (address: string) => Promise<void>;
  service: BlockchainService;
  disconnect: () => void;
}

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const address = await blockchainService.connectWallet();
      setWalletAddress(address);
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initContract = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await blockchainService.initContract(address);
      setContractAddress(address);
      const adminStatus = await blockchainService.isAdmin();
      setIsAdmin(adminStatus);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setWalletAddress(null);
    setContractAddress(null);
    setIsAdmin(false);
    setError(null);
  }, []);

  return (
    <BlockchainContext.Provider
      value={{
        isConnected,
        walletAddress,
        contractAddress,
        isAdmin,
        isLoading,
        error,
        connectWallet,
        initContract,
        service: blockchainService,
        disconnect
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
}
