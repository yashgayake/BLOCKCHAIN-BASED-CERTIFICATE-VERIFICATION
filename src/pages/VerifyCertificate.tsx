import { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  Search,
  Camera,
  Upload,
  XCircle,
  User,
  AlertCircle,
  X,
  Loader2,
  Eye,
  Download
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext, StoredCertificate } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';
import {
  DEFAULT_CONTRACT_ADDRESS,
  Certificate,
  GANACHE_RPC_URL
} from '@/lib/blockchain';
import { ethers } from 'ethers';
import { CertificatePreview } from '@/components/admin/CertificatePreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface VerificationResult {
  isValid: boolean;
  certificate?: Certificate;
  localData?: StoredCertificate;
  verifiedOnBlockchain: boolean;
}

export default function VerifyCertificate() {
  const [searchHash, setSearchHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showCertificatePreview, setShowCertificatePreview] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const { getCertificateByHash } = useAppContext();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const verifyCertificate = async (hash: string) => {
    if (!hash.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a certificate hash',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);

    try {
      const provider = new ethers.providers.JsonRpcProvider(GANACHE_RPC_URL);
      const contract = new ethers.Contract(
        DEFAULT_CONTRACT_ADDRESS,
        [
          'function verifyCertificateView(string _certificateHash) public view returns (bool)',
          'function getCertificate(string _certificateHash) public view returns (string studentName, string enrollmentNumber, string course, string institution, uint256 issueYear, uint256 issueDate, string ipfsHash, address issuerAddress)'
        ],
        provider
      );

      const isValid = await contract.verifyCertificateView(hash);

      if (isValid) {
        const certData = await contract.getCertificate(hash);
        const certificate: Certificate = {
          studentName: certData.studentName,
          enrollmentNumber: certData.enrollmentNumber,
          course: certData.course,
          institution: certData.institution,
          issueYear: certData.issueYear.toNumber(),
          issueDate: certData.issueDate.toNumber(),
          certificateHash: hash,
          ipfsHash: certData.ipfsHash,
          issuerAddress: certData.issuerAddress
        };

        const localData = getCertificateByHash(hash);

        setVerificationResult({
          isValid: true,
          certificate,
          localData,
          verifiedOnBlockchain: true
        });

        toast({
          title: '✓ Certificate Verified!',
          description: 'This certificate is authentic and recorded on the blockchain.'
        });
      } else {
        setVerificationResult({
          isValid: false,
          verifiedOnBlockchain: true
        });

        toast({
          title: '✗ Verification Failed',
          description: 'Certificate not found on the blockchain.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Verification error:', err);

      const localCert = getCertificateByHash(hash);

      if (localCert) {
        setVerificationResult({
          isValid: true,
          localData: localCert,
          verifiedOnBlockchain: false
        });

        toast({
          title: 'Certificate Found (Offline)',
          description: 'Verified from local records. Connect to Ganache for blockchain verification.'
        });
      } else {
        setVerificationResult({
          isValid: false,
          verifiedOnBlockchain: false
        });

        toast({
          title: 'Verification Failed',
          description: 'Certificate not found. Ensure Ganache is running.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const startCameraScanner = async () => {
    setShowCamera(true);
    setCameraError(null);

    try {
      const html5Qrcode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          html5Qrcode.stop().then(() => {
            setShowCamera(false);
            setSearchHash(decodedText);
            verifyCertificate(decodedText);
          });
        },
        () => {}
      );
    } catch (err: any) {
      setCameraError(err.message || 'Failed to start camera');
      setShowCamera(false);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setShowCamera(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode('file-scanner');
      const result = await html5Qrcode.scanFile(file, true);
      setSearchHash(result);
      verifyCertificate(result);
      await html5Qrcode.clear();
    } catch (err: any) {
      toast({
        title: 'Scan Failed',
        description: 'Could not find a valid QR code in the uploaded file.',
        variant: 'destructive'
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setSearchHash('');
    setShowCertificatePreview(false);
  };

  const getCertificateNumber = () => {
    if (verificationResult?.localData?.certificateNumber) {
      return verificationResult.localData.certificateNumber;
    }

    if (verificationResult?.certificate) {
      const cert = verificationResult.certificate;
      return `CERT-${cert.issueYear}-${cert.enrollmentNumber.toString().slice(-4).padStart(4, '0')}`;
    }

    return 'CERTIFICATE';
  };

  const getStudentName = () => {
    return verificationResult?.certificate?.studentName || verificationResult?.localData?.studentName || 'Student Name';
  };

  const getCourse = () => {
    return verificationResult?.certificate?.course || verificationResult?.localData?.course || 'Course Name';
  };

  const getInstitution = () => {
    return verificationResult?.certificate?.institution || verificationResult?.localData?.institution || 'Institute Name';
  };

  const getCertificateHash = () => {
    return verificationResult?.certificate?.certificateHash || verificationResult?.localData?.certificateHash || '';
  };

  const getIssueDateString = () => {
    if (verificationResult?.certificate) {
      return new Date(verificationResult.certificate.issueDate * 1000).toISOString();
    }

    if (verificationResult?.localData) {
      return verificationResult.localData.issueDate;
    }

    return new Date().toISOString();
  };

  const downloadPdfFromPreview = async () => {
    if (!previewRef.current) {
      toast({
        title: 'Preview Missing',
        description: 'Certificate preview is not available.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsDownloadingPdf(true);

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${getCertificateNumber()}.pdf`);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-warning">
              <CheckCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Verify Certificate</h1>
            <p className="mt-2 text-muted-foreground">
              Verify any certificate authenticity on the blockchain
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Contract: {DEFAULT_CONTRACT_ADDRESS.slice(0, 10)}...
              {DEFAULT_CONTRACT_ADDRESS.slice(-6)}
            </p>
          </div>

          <div id="file-scanner" style={{ display: 'none' }} />

          <Dialog open={showCamera} onOpenChange={(open) => !open && stopCameraScanner()}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  Scan QR Code
                  <Button variant="ghost" size="icon" onClick={stopCameraScanner}>
                    <X className="h-4 w-4" />
                  </Button>
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {cameraError ? (
                  <div className="py-8 text-center">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
                    <p className="text-destructive">{cameraError}</p>
                  </div>
                ) : (
                  <div id="qr-reader" className="w-full" />
                )}
              </div>
            </DialogContent>
          </Dialog>

          {verificationResult && (
            <Card
              className={`mb-6 ${
                verificationResult.isValid
                  ? 'border-success/50 bg-success/5'
                  : 'border-destructive/50 bg-destructive/5'
              }`}
            >
              <CardContent className="pt-6">
                {verificationResult.isValid ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                        <CheckCircle className="h-10 w-10 text-success" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-success">✓ VALID</h3>
                        <p className="text-muted-foreground">
                          {verificationResult.verifiedOnBlockchain
                            ? 'Certificate verified on blockchain'
                            : 'Verified from local records'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded bg-muted/40 p-3">
                      <p className="mb-1 text-sm text-muted-foreground">
                        Certificate Number
                      </p>
                      <p className="font-semibold">{getCertificateNumber()}</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Student Name</p>
                        <p className="font-medium">{getStudentName()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Enrollment Number</p>
                        <p className="font-medium">
                          {verificationResult.certificate?.enrollmentNumber ||
                            verificationResult.localData?.enrollmentNumber}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="font-medium">{getCourse()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Institution</p>
                        <p className="font-medium">{getInstitution()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Issue Year</p>
                        <p className="font-medium">
                          {verificationResult.certificate?.issueYear ||
                            verificationResult.localData?.issueYear}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="font-medium">
                          {verificationResult.certificate
                            ? new Date(
                                verificationResult.certificate.issueDate * 1000
                              ).toLocaleDateString()
                            : verificationResult.localData
                            ? new Date(
                                verificationResult.localData.issueDate
                              ).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-sm text-muted-foreground">Certificate Hash</p>
                      <p className="break-all rounded bg-muted/50 p-2 font-mono text-xs">
                        {getCertificateHash()}
                      </p>
                    </div>

                    {verificationResult.certificate?.issuerAddress && (
                      <div>
                        <p className="mb-1 text-sm text-muted-foreground">
                          Issuer Wallet Address
                        </p>
                        <p className="break-all rounded bg-muted/50 p-2 font-mono text-xs">
                          {verificationResult.certificate.issuerAddress}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {verificationResult.localData?.studentPhoto && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <User className="h-4 w-4" />
                              View Student Photo
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Student Photo</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center py-4">
                              <img
                                src={verificationResult.localData.studentPhoto}
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
                        onClick={() => setShowCertificatePreview(true)}
                      >
                        <Eye className="h-4 w-4" />
                        View Certificate
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={downloadPdfFromPreview}
                        disabled={isDownloadingPdf}
                      >
                        <Download className="h-4 w-4" />
                        {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
                      </Button>
                    </div>

                    <Button onClick={resetVerification} variant="outline" className="w-full">
                      Verify Another Certificate
                    </Button>
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                      <XCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h3 className="mb-2 text-2xl font-bold text-destructive">✗ INVALID</h3>
                    <p className="mb-4 text-muted-foreground">
                      This certificate was NOT found on the blockchain. It may be invalid or forged.
                    </p>
                    <Button onClick={resetVerification} variant="outline">
                      Try Another Certificate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!verificationResult && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Choose Verification Method</CardTitle>
                <CardDescription>
                  Verify using certificate hash, QR code scan, or file upload
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hash" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="hash" className="gap-2">
                      <Search className="h-4 w-4" />
                      Hash
                    </TabsTrigger>
                    <TabsTrigger value="camera" className="gap-2">
                      <Camera className="h-4 w-4" />
                      Camera
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="hash" className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="hash">Certificate Hash</Label>
                      <Input
                        id="hash"
                        placeholder="Enter certificate hash (0x...)"
                        value={searchHash}
                        onChange={(e) => setSearchHash(e.target.value)}
                        className="mt-2 font-mono"
                      />
                    </div>
                    <Button
                      onClick={() => verifyCertificate(searchHash)}
                      disabled={isVerifying}
                      className="w-full gap-2"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying on Blockchain...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Verify Certificate
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="camera" className="mt-6 space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-border py-8 text-center">
                      <Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="mb-4 text-muted-foreground">
                        Scan the QR code on the certificate
                      </p>
                      <Button onClick={startCameraScanner} className="gap-2">
                        <Camera className="h-4 w-4" />
                        Start Camera
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-6 space-y-4">
                    <div className="rounded-lg border-2 border-dashed border-border py-8 text-center">
                      <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="mb-4 text-muted-foreground">
                        Upload a certificate image with QR code
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button asChild className="gap-2">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="h-4 w-4" />
                          Choose File
                        </label>
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          <Dialog open={showCertificatePreview} onOpenChange={setShowCertificatePreview}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Verified Certificate Preview</DialogTitle>
              </DialogHeader>

              {verificationResult?.isValid && (
                <div className="space-y-4">
                  <CertificatePreview
                    ref={previewRef}
                    certificateNumber={getCertificateNumber()}
                    studentName={getStudentName()}
                    course={getCourse()}
                    institution={getInstitution()}
                    issueDate={getIssueDateString()}
                    certificateHash={getCertificateHash()}
                    issuerName="Yash Gayake"
                    issuerTitle="Registrar"
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={downloadPdfFromPreview}
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
    </div>
  );
}