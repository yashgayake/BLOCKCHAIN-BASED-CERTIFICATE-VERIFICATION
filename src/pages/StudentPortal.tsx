// new getStudent() structure use ho raha hai

// student profile me:

// email

// mobileNumber

// department

// batchYear

// on-chain certificateNumber use ho raha hai

// QR verify link par based hai

// PDF download one-page version me hai

// Full updated src/pages/StudentPortal.tsx

import { useRef, useState } from 'react';
import {
  GraduationCap,
  LogIn,
  FileCheck,
  Download,
  QrCode,
  Eye,
  LogOut,
  Loader2
} from 'lucide-react';
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
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DEFAULT_CONTRACT_ADDRESS,
  Certificate,
  GANACHE_RPC_URL
} from '@/lib/blockchain';
import { ethers } from 'ethers';
import { CertificatePreview } from '@/components/admin/CertificatePreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PreviewCertificateData {
  certificateNumber: string;
  studentName: string;
  course: string;
  institution: string;
  issueDate: string;
  certificateHash: string;
}

interface LoggedInStudent {
  enrollmentNumber: string;
  name: string;
  email: string;
  mobileNumber: string;
  department: string;
  batchYear: string;
}

export default function StudentPortal() {
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [loggedInStudent, setLoggedInStudent] = useState<LoggedInStudent | null>(null);
  const [blockchainCertificates, setBlockchainCertificates] = useState<Certificate[]>([]);
  const [studentCertificates, setStudentCertificates] = useState<any[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] =
    useState<PreviewCertificateData | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);

  const { getCertificatesByEnrollment } = useAppContext();
  const { toast } = useToast();

  const handleLogin = async () => {
    const cleanEnrollment = enrollmentNumber.trim();
    const cleanPassword = password.trim();

    if (!cleanEnrollment || !cleanPassword) {
      toast({
        title: 'Error',
        description: 'Please enter enrollment number and password',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const provider = new ethers.providers.JsonRpcProvider(GANACHE_RPC_URL);

      const contract = new ethers.Contract(
        DEFAULT_CONTRACT_ADDRESS,
        [
          'function verifyStudentLogin(string _enrollmentNumber, string _password) public view returns (bool)',
          'function getStudent(string _enrollmentNumber) public view returns (string name, string email, string mobileNumber, string department, string batchYear, bool isRegistered, uint256 registrationDate)',
          'function getStudentCertificates(string _enrollmentNumber) public view returns (string[])',
          'function getCertificate(string _certificateHash) public view returns (string certificateNumber, string studentName, string enrollmentNumber, string course, string institution, uint256 issueYear, uint256 issueDate, string ipfsHash, address issuerAddress)'
        ],
        provider
      );

      const isValidLogin = await contract.verifyStudentLogin(cleanEnrollment, cleanPassword);

      if (!isValidLogin) {
        toast({
          title: 'Login Failed',
          description: 'Invalid enrollment number or password.',
          variant: 'destructive'
        });
        return;
      }

      const studentData = await contract.getStudent(cleanEnrollment);

      if (!studentData || !studentData.isRegistered) {
        toast({
          title: 'Login Failed',
          description: 'Student is not registered on blockchain.',
          variant: 'destructive'
        });
        return;
      }

      const certHashes = await contract.getStudentCertificates(cleanEnrollment);
      const certs: Certificate[] = [];

      for (const hash of certHashes) {
        try {
          const certData = await contract.getCertificate(hash);
          certs.push({
            certificateNumber: certData.certificateNumber,
            studentName: certData.studentName,
            enrollmentNumber: certData.enrollmentNumber,
            course: certData.course,
            institution: certData.institution,
            issueYear: certData.issueYear.toNumber(),
            issueDate: certData.issueDate.toNumber(),
            certificateHash: hash,
            ipfsHash: certData.ipfsHash,
            issuerAddress: certData.issuerAddress
          });
        } catch (err) {
          console.error('Error fetching certificate:', hash, err);
        }
      }

      setIsLoggedIn(true);
      setLoggedInStudent({
        enrollmentNumber: cleanEnrollment,
        name: studentData.name,
        email: studentData.email,
        mobileNumber: studentData.mobileNumber,
        department: studentData.department,
        batchYear: studentData.batchYear
      });

      setBlockchainCertificates(certs);
      setStudentCertificates(getCertificatesByEnrollment(cleanEnrollment));

      toast({
        title: 'Login Successful',
        description: `Welcome, ${studentData.name}!`
      });
    } catch (err: any) {
      console.error('Login error:', err);

      toast({
        title: 'Login Failed',
        description: 'Blockchain unavailable or invalid login credentials.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInStudent(null);
    setBlockchainCertificates([]);
    setStudentCertificates([]);
    setEnrollmentNumber('');
    setPassword('');
    setPreviewOpen(false);
    setSelectedCertificate(null);
  };

  const getVerifyUrl = (certHash: string) => {
    return `${window.location.origin}/verify?hash=${certHash}`;
  };

  const downloadQRCode = (certHash: string) => {
    const svg = document.getElementById(`qr-${certHash}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `certificate-qr-${certHash.slice(0, 10)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const getLocalCertData = (hash: string) => {
    return studentCertificates.find(
      (c: any) => c.certificateHash.toLowerCase() === hash.toLowerCase()
    );
  };

  const getCertificateNumber = (cert: Certificate) => {
    const localData = getLocalCertData(cert.certificateHash);
    return (
      cert.certificateNumber ||
      localData?.certificateNumber ||
      `CERT-${cert.issueYear}-${cert.enrollmentNumber.toString().slice(-4).padStart(4, '0')}`
    );
  };

  const getIssueDateString = (cert: Certificate) => {
    return new Date(cert.issueDate * 1000).toISOString();
  };

  const openGeneratedCertificate = (cert: Certificate) => {
    setSelectedCertificate({
      certificateNumber: getCertificateNumber(cert),
      studentName: cert.studentName,
      course: cert.course,
      institution: cert.institution,
      issueDate: getIssueDateString(cert),
      certificateHash: cert.certificateHash
    });
    setPreviewOpen(true);
  };

  const downloadPdfFromPreview = async (certificateData?: PreviewCertificateData) => {
    if (!previewRef.current || !(certificateData || selectedCertificate)) {
      toast({
        title: 'Preview Missing',
        description: 'Certificate preview is not available.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsDownloadingPdf(true);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(previewRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const activeCertificate = certificateData || selectedCertificate!;
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`${activeCertificate.certificateNumber}.pdf`);

      toast({
        title: 'PDF Downloaded',
        description: 'Certificate PDF has been downloaded successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Could not generate PDF.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-12">
          <div className="mx-auto max-w-md">
            <Card className="glass-card">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success to-primary">
                  <GraduationCap className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle className="text-2xl">Student Portal</CardTitle>
                <CardDescription>Login to view your certificates</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="enrollment">Enrollment Number</Label>
                  <Input
                    id="enrollment"
                    placeholder="Enter your enrollment number"
                    value={enrollmentNumber}
                    onChange={(e) => setEnrollmentNumber(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Institute Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use the password provided by your institute
                  </p>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying on Blockchain...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Login
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Contract: {DEFAULT_CONTRACT_ADDRESS.slice(0, 10)}...
                  {DEFAULT_CONTRACT_ADDRESS.slice(-6)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const allCertificates = blockchainCertificates;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              <GraduationCap className="h-8 w-8 text-success" />
              Welcome, {loggedInStudent?.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Enrollment: {loggedInStudent?.enrollmentNumber}
            </p>

            <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <p>Email: {loggedInStudent?.email || '-'}</p>
              <p>Mobile: {loggedInStudent?.mobileNumber || '-'}</p>
              <p>Department: {loggedInStudent?.department || '-'}</p>
              <p>Batch / Year: {loggedInStudent?.batchYear || '-'}</p>
            </div>
          </div>

          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {allCertificates.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <FileCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">No Certificates Found</h3>
              <p className="text-muted-foreground">
                No certificates have been issued to your account yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">
              Your Certificates ({allCertificates.length})
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {allCertificates.map((cert) => {
                const localData = getLocalCertData(cert.certificateHash);

                return (
                  <Card key={cert.certificateHash} className="glass-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{cert.course}</CardTitle>
                          <CardDescription>{cert.institution}</CardDescription>
                        </div>
                        <div className="rounded-lg bg-success/10 px-3 py-1 text-sm font-medium text-success">
                          ✓ On Blockchain
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Certificate Number
                        </p>
                        <p className="rounded bg-muted/50 p-2 text-sm font-semibold">
                          {getCertificateNumber(cert)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Issue Year</p>
                          <p className="font-medium">{cert.issueYear}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Issue Date</p>
                          <p className="font-medium">
                            {new Date(cert.issueDate * 1000).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Certificate Hash
                        </p>
                        <p className="break-all rounded bg-muted/50 p-2 font-mono text-xs">
                          {cert.certificateHash}
                        </p>
                      </div>

                      {localData?.transactionHash && (
                        <div>
                          <p className="mb-1 text-sm text-muted-foreground">
                            Transaction Hash
                          </p>
                          <p className="break-all rounded bg-muted/50 p-2 font-mono text-xs">
                            {localData.transactionHash}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <QrCode className="h-4 w-4" />
                              View QR
                            </Button>
                          </DialogTrigger>

                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Certificate QR Code</DialogTitle>
                            </DialogHeader>

                            <div className="flex flex-col items-center gap-4 py-4">
                              <div className="rounded-xl bg-white p-4">
                                <QRCodeSVG
                                  id={`qr-${cert.certificateHash}`}
                                  value={getVerifyUrl(cert.certificateHash)}
                                  size={200}
                                  level="H"
                                />
                              </div>

                              <p className="text-center text-sm text-muted-foreground">
                                Scan this QR code to verify the certificate
                              </p>

                              <Button
                                onClick={() => downloadQRCode(cert.certificateHash)}
                                className="gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download QR Code
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {localData?.studentPhoto && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                View Photo
                              </Button>
                            </DialogTrigger>

                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Student Photo</DialogTitle>
                              </DialogHeader>

                              <div className="flex justify-center py-4">
                                <img
                                  src={localData.studentPhoto}
                                  alt="Student"
                                  className="max-h-[400px] max-w-full rounded-lg object-contain"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => openGeneratedCertificate(cert)}
                        >
                          <Eye className="h-4 w-4" />
                          View Certificate
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={async () => {
                            const certificateData = {
                              certificateNumber: getCertificateNumber(cert),
                              studentName: cert.studentName,
                              course: cert.course,
                              institution: cert.institution,
                              issueDate: getIssueDateString(cert),
                              certificateHash: cert.certificateHash
                            };

                            setSelectedCertificate(certificateData);
                            setPreviewOpen(true);

                            setTimeout(() => {
                              downloadPdfFromPreview(certificateData);
                            }, 400);
                          }}
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Certificate Preview</DialogTitle>
            </DialogHeader>

            {selectedCertificate && (
              <div className="space-y-4">
                <CertificatePreview
                  ref={previewRef}
                  certificateNumber={selectedCertificate.certificateNumber}
                  studentName={selectedCertificate.studentName}
                  course={selectedCertificate.course}
                  institution={selectedCertificate.institution}
                  issueDate={selectedCertificate.issueDate}
                  certificateHash={selectedCertificate.certificateHash}
                  issuerName="Yash Gayake"
                  issuerTitle="Registrar"
                />

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => downloadPdfFromPreview()}
                    disabled={isDownloadingPdf}
                  >
                    <Download className="h-4 w-4" />
                    {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
