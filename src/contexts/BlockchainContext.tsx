import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode
} from 'react';
import {
  blockchainService,
  BlockchainService,
  DEFAULT_CONTRACT_ADDRESS
} from '@/lib/blockchain';

interface BlockchainContextType {
  isConnected: boolean;
  walletAddress: string | null;
  contractAddress: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  initContract: (address?: string) => Promise<void>;
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

  const initContract = useCallback(async (address?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const finalAddress = address || DEFAULT_CONTRACT_ADDRESS;

      await blockchainService.initContract(finalAddress);
      setContractAddress(finalAddress);

      const adminStatus = await blockchainService.isAdmin();
      setIsAdmin(adminStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize contract');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const address = await blockchainService.connectWallet();
      setWalletAddress(address);
      setIsConnected(true);

      // Auto initialize default contract after wallet connect
      await blockchainService.initContract(DEFAULT_CONTRACT_ADDRESS);
      setContractAddress(DEFAULT_CONTRACT_ADDRESS);

      const adminStatus = await blockchainService.isAdmin();
      setIsAdmin(adminStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setIsConnected(false);
      setWalletAddress(null);
      setContractAddress(null);
      setIsAdmin(false);
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

    // Reset internal service state safely
    (blockchainService as any).provider = null;
    (blockchainService as any).signer = null;
    (blockchainService as any).contract = null;
    (blockchainService as any).contractAddress = '';
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect();
        return;
      }

      const newAddress = accounts[0];
      setWalletAddress(newAddress);
      setIsConnected(true);

      try {
        await blockchainService.initContract(DEFAULT_CONTRACT_ADDRESS);
        setContractAddress(DEFAULT_CONTRACT_ADDRESS);

        const adminStatus = await blockchainService.isAdmin();
        setIsAdmin(adminStatus);
      } catch (err: any) {
        setError(err.message || 'Failed to reinitialize after account change');
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [disconnect]);

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