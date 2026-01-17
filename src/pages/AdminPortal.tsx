import { useState, useEffect } from 'react';
import { Shield, Wallet, AlertCircle, CheckCircle2, UserPlus, FileCheck, List, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { useToast } from '@/hooks/use-toast';
import { RegisterStudent } from '@/components/admin/RegisterStudent';
import { IssueCertificate } from '@/components/admin/IssueCertificate';
import { ViewAllRecords } from '@/components/admin/ViewAllRecords';
import { cn } from '@/lib/utils';
import { DEFAULT_CONTRACT_ADDRESS, ADMIN_WALLET_ADDRESS } from '@/lib/blockchain';

type AdminAction = 'register' | 'issue' | 'records' | null;

export default function AdminPortal() {
  // Pre-fill with deployed contract address
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [currentAction, setCurrentAction] = useState<AdminAction>(null);
  const { isConnected, walletAddress, contractAddress: connectedContract, isAdmin, isLoading, error, connectWallet, initContract, disconnect } = useBlockchain();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected",
        description: "MetaMask wallet connected successfully!",
      });
    } catch (err: any) {
      toast({
        title: "Connection Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleInitContract = async () => {
    if (!contractAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter the contract address",
        variant: "destructive",
      });
      return;
    }

    try {
      await initContract(contractAddress);
      toast({
        title: "Contract Connected",
        description: "Smart contract initialized successfully!",
      });
    } catch (err: any) {
      toast({
        title: "Contract Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const actions = [
    {
      id: 'register' as const,
      icon: UserPlus,
      title: 'Register New Student',
      description: 'Add a new student to the blockchain system'
    },
    {
      id: 'issue' as const,
      icon: FileCheck,
      title: 'Issue Certificate',
      description: 'Issue a new certificate with AI extraction or manual entry'
    },
    {
      id: 'records' as const,
      icon: List,
      title: 'View All Records',
      description: 'Browse all issued certificates and student records'
    }
  ];

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="mx-auto max-w-md">
            <Card className="glass-card">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                  <Shield className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Admin Portal</CardTitle>
                <CardDescription>
                  Connect your MetaMask wallet to access admin functions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleConnect} disabled={isLoading} className="w-full gap-2" size="lg">
                  <Wallet className="h-5 w-5" />
                  {isLoading ? 'Connecting...' : 'Connect MetaMask'}
                </Button>
                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Connected but contract not initialized
  if (!connectedContract) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="mx-auto max-w-md">
            <Card className="glass-card">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-xl">Wallet Connected</CardTitle>
                <CardDescription className="break-all">
                  {walletAddress}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contract">Smart Contract Address</Label>
                  <Input
                    id="contract"
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter the deployed contract address from Remix/Ganache
                  </p>
                </div>
                <Button onClick={handleInitContract} disabled={isLoading} className="w-full gap-2">
                  <Shield className="h-4 w-4" />
                  {isLoading ? 'Connecting...' : 'Connect to Contract'}
                </Button>
                <Button onClick={disconnect} variant="outline" className="w-full gap-2">
                  <LogOut className="h-4 w-4" />
                  Disconnect Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Not admin - show unauthorized message
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="mx-auto max-w-md">
            <Card className="glass-card border-destructive/50">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <CardTitle className="text-xl text-destructive">⚠️ Unauthorized Admin</CardTitle>
                <CardDescription>
                  This wallet is not authorized to access admin functions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Connected Wallet:</strong>
                  </p>
                  <p className="font-mono text-xs break-all text-foreground">{walletAddress}</p>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Required Admin Wallet:</strong>
                  </p>
                  <p className="font-mono text-xs break-all text-foreground">{ADMIN_WALLET_ADDRESS}</p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Please connect with the admin wallet that deployed the smart contract.
                </p>
                <Button onClick={disconnect} variant="outline" className="w-full gap-2">
                  <LogOut className="h-4 w-4" />
                  Disconnect & Try Admin Wallet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage certificates and students on the blockchain
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 px-3 py-2 text-sm">
              <span className="text-success font-medium">● Connected</span>
            </div>
            <Button onClick={disconnect} variant="outline" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>

        {/* Wallet Info */}
        <Card className="mb-8 glass-card">
          <CardContent className="py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-sm break-all">{walletAddress}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contract Address</p>
                <p className="font-mono text-sm break-all">{connectedContract}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Selection or Active Action */}
        {currentAction === null ? (
          <div className="grid gap-6 md:grid-cols-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.id}
                  className="glass-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  onClick={() => setCurrentAction(action.id)}
                >
                  <CardHeader>
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {action.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => setCurrentAction(null)}
              className="gap-2"
            >
              ← Back to Actions
            </Button>
            
            {currentAction === 'register' && <RegisterStudent />}
            {currentAction === 'issue' && <IssueCertificate />}
            {currentAction === 'records' && <ViewAllRecords />}
          </div>
        )}
      </div>
    </div>
  );
}
