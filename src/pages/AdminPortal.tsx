import { useEffect, useMemo, useState } from 'react';
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
  Link as LinkIcon,
  Search,
  Copy
} from 'lucide-react';

import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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

interface DashboardCertificate {
  certificateHash: string;
  certificateNumber: string;
  studentName: string;
  enrollmentNumber: string;
  course: string;
  institution: string;
  issueYear: number;
  issueDate: number;
  ipfsHash: string;
  issuerAddress: string;
}

export default function AdminPortal() {
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS);
  const [currentAction, setCurrentAction] = useState<AdminAction>(null);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCertificates: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const [dashboardCertificates, setDashboardCertificates] = useState<DashboardCertificate[]>([]);
  const [dashboardCertificatesLoading, setDashboardCertificatesLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');

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
        description: err.message || 'Failed to connect wallet',
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
        description: err.message || 'Failed to connect contract',
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
    setDashboardCertificates([]);
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

  const loadDashboardCertificates = async () => {
    if (!connectedContract || !isAdmin) return;

    try {
      setDashboardCertificatesLoading(true);

      const hashes = await service.getAllCertificateHashes();

      const certData: DashboardCertificate[] = await Promise.all(
        hashes.map(async (hash: string) => {
          const cert = await service.getCertificate(hash);

          return {
            certificateHash: hash,
            certificateNumber: cert.certificateNumber || '-',
            studentName: cert.studentName,
            enrollmentNumber: cert.enrollmentNumber,
            course: cert.course,
            institution: cert.institution,
            issueYear: cert.issueYear,
            issueDate: cert.issueDate,
            ipfsHash: cert.ipfsHash,
            issuerAddress: cert.issuerAddress
          };
        })
      );

      setDashboardCertificates(certData);
    } catch (err: any) {
      toast({
        title: 'Certificates Load Failed',
        description: err.message || 'Could not load issued certificates.',
        variant: 'destructive'
      });
    } finally {
      setDashboardCertificatesLoading(false);
    }
  };

  const refreshDashboard = async () => {
    await Promise.all([loadDashboardStats(), loadDashboardCertificates()]);
  };

  useEffect(() => {
    if (connectedContract && isAdmin) {
      refreshDashboard();
    }
  }, [connectedContract, isAdmin]);

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      toast({
        title: 'Copied',
        description: 'Certificate hash copied to clipboard'
      });
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy hash',
        variant: 'destructive'
      });
    }
  };

  const uniqueCourses = useMemo(() => {
    return [
      'All',
      ...Array.from(new Set(dashboardCertificates.map((c) => c.course).filter(Boolean)))
    ];
  }, [dashboardCertificates]);

  const uniqueYears = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(dashboardCertificates.map((c) => String(c.issueYear)).filter(Boolean))
      )
    ];
  }, [dashboardCertificates]);

  const filteredCertificates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return dashboardCertificates.filter((cert) => {
      const matchesSearch =
        !query ||
        cert.studentName.toLowerCase().includes(query) ||
        cert.enrollmentNumber.toLowerCase().includes(query) ||
        cert.certificateNumber.toLowerCase().includes(query) ||
        cert.course.toLowerCase().includes(query);

      const matchesCourse = courseFilter === 'All' || cert.course === courseFilter;
      const matchesYear = yearFilter === 'All' || String(cert.issueYear) === yearFilter;

      return matchesSearch && matchesCourse && matchesYear;
    });
  }, [dashboardCertificates, searchTerm, courseFilter, yearFilter]);

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
      description: 'Issue a new certificate with manual entry'
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
                <CardDescription className="break-all">{walletAddress}</CardDescription>
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
              Manage and monitor issued certificates
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 px-3 py-2 text-sm">
              <span className="font-medium text-success">● Connected</span>
            </div>

            <Button
              onClick={refreshDashboard}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={statsLoading || dashboardCertificatesLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  statsLoading || dashboardCertificatesLoading ? 'animate-spin' : ''
                }`}
              />
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

        {currentAction === null ? (
          <>
            
            <div className="mb-8">
              <AnalyticsDashboard
                certificates={dashboardCertificates}
                totalStudents={stats.totalStudents}
                contractConnected={!!connectedContract}
              />
            </div>

            <div className="mb-6 flex flex-col gap-4 md:flex-row">
              <div className="relative md:max-w-xl md:flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, enrollment or certificate number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                {uniqueCourses.map((course) => (
                  <option key={course} value={course}>
                    {course === 'All' ? 'All Courses' : course}
                  </option>
                ))}
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm"
              >
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year === 'All' ? 'All Years' : year}
                  </option>
                ))}
              </select>
            </div>

            <Card className="mb-8 glass-card">
              <CardHeader>
                <CardTitle>Issued Certificates</CardTitle>
              </CardHeader>

              <CardContent>
                {dashboardCertificatesLoading ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Loading certificates from blockchain...
                  </p>
                ) : filteredCertificates.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No certificates found.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30 text-left">
                          <th className="px-4 py-3 font-medium">Student</th>
                          <th className="px-4 py-3 font-medium">Enrollment</th>
                          <th className="px-4 py-3 font-medium">Course</th>
                          <th className="px-4 py-3 font-medium">Year</th>
                          <th className="px-4 py-3 font-medium">Certificate Number</th>
                          <th className="px-4 py-3 font-medium">Hash</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCertificates.map((cert) => (
                          <tr key={cert.certificateHash} className="border-b">
                            <td className="px-4 py-4">{cert.studentName}</td>
                            <td className="px-4 py-4">{cert.enrollmentNumber}</td>
                            <td className="px-4 py-4">{cert.course}</td>
                            <td className="px-4 py-4">{cert.issueYear}</td>
                            <td className="px-4 py-4">{cert.certificateNumber || '-'}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">
                                  {cert.certificateHash.slice(0, 12)}...
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => copyHash(cert.certificateHash)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

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
          </>
        ) : (
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => setCurrentAction(null)}
              className="gap-2"
            >
              ← Back to Dashboard
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
