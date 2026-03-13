import { useState, useEffect } from 'react';
import {
  Shield,
  Wallet,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  FileCheck,
  List,
  LogOut,
  Users,
  Files,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
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
import { DEFAULT_CONTRACT_ADDRESS, ADMIN_WALLET_ADDRESS } from '@/lib/blockchain';

type AdminAction = 'register' | 'issue' | 'records' | null;

export default function AdminPortal() {
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [currentAction, setCurrentAction] = useState<AdminAction>(null);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCertificates: 0
  });

  const [statsLoading, setStatsLoading] = useState(false);

  const {
    isConnected,
    walletAddress,
    contractAddress: connectedContract,
    isAdmin,
    isLoading,
    error,
    connectWallet,
    initContract,
    disconnect,
    service
  } = useBlockchain();

  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connectWallet();

      toast({
        title: 'Wallet Connected',
        description: 'MetaMask wallet connected successfully!'
      });
    } catch (err: any) {
      toast({
        title: 'Connection Failed',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleInitContract = async () => {
    if (!contractAddress.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the contract address',
        variant: 'destructive'
      });
      return;
    }

    try {
      await initContract(contractAddress.trim());

      toast({
        title: 'Contract Connected',
        description: 'Smart contract initialized successfully!'
      });
    } catch (err: any) {
      toast({
        title: 'Contract Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const handleDisconnect = () => {
    setCurrentAction(null);
    setStats({
      totalStudents: 0,
      totalCertificates: 0
    });
    disconnect();
  };

  const loadDashboardStats = async () => {
    if (!connectedContract || !isAdmin) return;

    try {
      setStatsLoading(true);

      const enrollmentNumbers = await service.getAllEnrollmentNumbers();
      const certificateHashes = await service.getAllCertificateHashes();

      setStats({
        totalStudents: enrollmentNumbers.length,
        totalCertificates: certificateHashes.length
      });
    } catch (err: any) {
      toast({
        title: 'Stats Load Failed',
        description: err.message || 'Could not load dashboard statistics.',
        variant: 'destructive'
      });
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (connectedContract && isAdmin) {
      loadDashboardStats();
    }
  }, [connectedContract, isAdmin]);

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
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Wallet className="h-5 w-5" />
                  {isLoading ? 'Connecting...' : 'Connect MetaMask'}
                </Button>

                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
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
                  <p className="mt-2 text-xs text-muted-foreground">
                    Enter the deployed contract address from Remix/Ganache
                  </p>
                </div>

                <Button
                  onClick={handleInitContract}
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {isLoading ? 'Connecting...' : 'Connect to Contract'}
                </Button>

                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full gap-2"
                >
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
                <CardTitle className="text-xl text-destructive">
                  ⚠️ Unauthorized Admin
                </CardTitle>
                <CardDescription>
                  This wallet is not authorized to access admin functions.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Connected Wallet:</strong>
                  </p>
                  <p className="break-all font-mono text-xs text-foreground">
                    {walletAddress}
                  </p>

                  <p className="mt-3 text-sm text-muted-foreground">
                    <strong>Required Admin Wallet:</strong>
                  </p>
                  <p className="break-all font-mono text-xs text-foreground">
                    {ADMIN_WALLET_ADDRESS}
                  </p>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  Please connect with the admin wallet that deployed the smart contract.
                </p>

                <Button
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full gap-2"
                >
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              <Shield className="h-8 w-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage certificates and students on the blockchain
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 px-3 py-2 text-sm">
              <span className="font-medium text-success">● Connected</span>
            </div>

            <Button
              onClick={loadDashboardStats}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={statsLoading}
            >
              <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </div>

        <Card className="mb-8 glass-card">
          <CardContent className="py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Address</p>
                <p className="break-all font-mono text-sm">{walletAddress}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Contract Address</p>
                <p className="break-all font-mono text-sm">{connectedContract}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass-card">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <h3 className="mt-2 text-2xl font-bold">
                    {statsLoading ? '...' : stats.totalStudents}
                  </h3>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Certificates</p>
                  <h3 className="mt-2 text-2xl font-bold">
                    {statsLoading ? '...' : stats.totalCertificates}
                  </h3>
                </div>
                <div className="rounded-2xl bg-success/10 p-3">
                  <Files className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admin Wallet Status</p>
                  <h3 className="mt-2 text-lg font-bold text-success">
                    {isAdmin ? 'Authorized' : 'Unauthorized'}
                  </h3>
                </div>
                <div className="rounded-2xl bg-success/10 p-3">
                  <Wallet className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contract Connected</p>
                  <h3 className="mt-2 text-lg font-bold text-primary">
                    {connectedContract ? 'Yes' : 'No'}
                  </h3>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3">
                  <LinkIcon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {currentAction === null ? (
          <div className="grid gap-6 md:grid-cols-3">
            {actions.map((action) => {
              const Icon = action.icon;

              return (
                <Card
                  key={action.id}
                  className="glass-card cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
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