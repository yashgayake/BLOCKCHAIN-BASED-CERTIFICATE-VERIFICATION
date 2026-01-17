import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Search, Camera, Upload, XCircle, FileCheck, User, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext, StoredCertificate } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';
import { DEFAULT_CONTRACT_ADDRESS, Certificate } from '@/lib/blockchain';
import { ethers } from 'ethers';

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
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
        title: "Error",
        description: "Please enter a certificate hash",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Connect to Ganache and verify on blockchain
      const provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:7545');
      const contract = new ethers.Contract(
        DEFAULT_CONTRACT_ADDRESS,
        [
          "function verifyCertificateView(string _certificateHash) public view returns (bool)",
          "function getCertificate(string _certificateHash) public view returns (string studentName, string enrollmentNumber, string course, string institution, uint256 issueYear, uint256 issueDate, string ipfsHash, address issuerAddress)"
        ],
        provider
      );

      // Verify certificate on blockchain
      const isValid = await contract.verifyCertificateView(hash);

      if (isValid) {
        // Get certificate details from blockchain
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

        // Also get local data for photo/PDF
        const localData = getCertificateByHash(hash);

        setVerificationResult({
          isValid: true,
          certificate,
          localData,
          verifiedOnBlockchain: true
        });

        toast({
          title: "✓ Certificate Verified!",
          description: "This certificate is authentic and recorded on the blockchain.",
        });
      } else {
        setVerificationResult({
          isValid: false,
          verifiedOnBlockchain: true
        });

        toast({
          title: "✗ Verification Failed",
          description: "Certificate not found on the blockchain.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      
      // Fallback to local storage
      const localCert = getCertificateByHash(hash);
      
      if (localCert) {
        setVerificationResult({
          isValid: true,
          localData: localCert,
          verifiedOnBlockchain: false
        });

        toast({
          title: "Certificate Found (Offline)",
          description: "Verified from local records. Connect to Ganache for blockchain verification.",
        });
      } else {
        setVerificationResult({
          isValid: false,
          verifiedOnBlockchain: false
        });

        toast({
          title: "Verification Failed",
          description: "Certificate not found. Ensure Ganache is running.",
          variant: "destructive",
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
      const html5Qrcode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" },
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
      setCameraError(err.message || "Failed to start camera");
      setShowCamera(false);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setShowCamera(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5Qrcode = new Html5Qrcode("file-scanner");
      const result = await html5Qrcode.scanFile(file, true);
      setSearchHash(result);
      verifyCertificate(result);
      await html5Qrcode.clear();
    } catch (err: any) {
      toast({
        title: "Scan Failed",
        description: "Could not find a valid QR code in the uploaded file.",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setSearchHash('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-warning">
              <CheckCircle className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">Verify Certificate</h1>
            <p className="text-muted-foreground mt-2">
              Verify any certificate authenticity on the blockchain
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Contract: {DEFAULT_CONTRACT_ADDRESS.slice(0, 10)}...{DEFAULT_CONTRACT_ADDRESS.slice(-6)}
            </p>
          </div>

          {/* Hidden div for file scanning */}
          <div id="file-scanner" style={{ display: 'none' }} />

          {/* Camera Modal */}
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
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <p className="text-destructive">{cameraError}</p>
                  </div>
                ) : (
                  <div id="qr-reader" className="w-full" />
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Verification Result */}
          {verificationResult && (
            <Card className={`mb-6 ${verificationResult.isValid ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'}`}>
              <CardContent className="pt-6">
                {verificationResult.isValid && (verificationResult.certificate || verificationResult.localData) ? (
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

                    {/* Certificate Details */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Student Name</p>
                        <p className="font-medium">
                          {verificationResult.certificate?.studentName || verificationResult.localData?.studentName}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Enrollment Number</p>
                        <p className="font-medium">
                          {verificationResult.certificate?.enrollmentNumber || verificationResult.localData?.enrollmentNumber}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="font-medium">
                          {verificationResult.certificate?.course || verificationResult.localData?.course}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Institution</p>
                        <p className="font-medium">
                          {verificationResult.certificate?.institution || verificationResult.localData?.institution}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Issue Year</p>
                        <p className="font-medium">
                          {verificationResult.certificate?.issueYear || verificationResult.localData?.issueYear}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="font-medium">
                          {verificationResult.certificate 
                            ? new Date(verificationResult.certificate.issueDate * 1000).toLocaleDateString()
                            : verificationResult.localData 
                              ? new Date(verificationResult.localData.issueDate).toLocaleDateString()
                              : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Certificate Hash</p>
                      <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">
                        {verificationResult.certificate?.certificateHash || verificationResult.localData?.certificateHash}
                      </p>
                    </div>

                    {verificationResult.certificate?.issuerAddress && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Issuer Wallet Address</p>
                        <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">
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
                                className="max-w-full max-h-[400px] rounded-lg object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {verificationResult.localData?.certificatePdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(verificationResult.localData?.certificatePdf, '_blank')}
                        >
                          <FileCheck className="h-4 w-4" />
                          View Original PDF
                        </Button>
                      )}
                    </div>

                    <Button onClick={resetVerification} variant="outline" className="w-full">
                      Verify Another Certificate
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                      <XCircle className="h-10 w-10 text-destructive" />
                    </div>
                    <h3 className="text-2xl font-bold text-destructive mb-2">✗ INVALID</h3>
                    <p className="text-muted-foreground mb-4">
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

          {/* Verification Methods */}
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

                  <TabsContent value="hash" className="space-y-4 mt-6">
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

                  <TabsContent value="camera" className="space-y-4 mt-6">
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                      <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Scan the QR code on the certificate
                      </p>
                      <Button onClick={startCameraScanner} className="gap-2">
                        <Camera className="h-4 w-4" />
                        Start Camera
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="space-y-4 mt-6">
                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Upload a certificate image or PDF with QR code
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
        </div>
      </div>
    </div>
  );
}
