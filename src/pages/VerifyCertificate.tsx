import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Search, Camera, Upload, XCircle, FileCheck, User, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext, StoredCertificate } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Html5Qrcode } from 'html5-qrcode';

export default function VerifyCertificate() {
  const [searchHash, setSearchHash] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    certificate?: StoredCertificate;
  } | null>(null);
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

  const verifyCertificate = (hash: string) => {
    if (!hash.trim()) {
      toast({
        title: "Error",
        description: "Please enter a certificate hash",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    // Simulate blockchain verification delay
    setTimeout(() => {
      const certificate = getCertificateByHash(hash);
      
      if (certificate) {
        setVerificationResult({
          isValid: true,
          certificate
        });
        toast({
          title: "Certificate Verified!",
          description: "This certificate is valid and recorded on the blockchain.",
        });
      } else {
        setVerificationResult({
          isValid: false
        });
        toast({
          title: "Verification Failed",
          description: "Certificate not found on the blockchain.",
          variant: "destructive",
        });
      }
      
      setIsVerifying(false);
    }, 1500);
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
          // QR code scanned successfully
          html5Qrcode.stop().then(() => {
            setShowCamera(false);
            setSearchHash(decodedText);
            verifyCertificate(decodedText);
          });
        },
        () => {} // Ignore errors during scanning
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

    // Reset file input
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
              Verify any certificate authenticity using blockchain
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
                {verificationResult.isValid && verificationResult.certificate ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                        <CheckCircle className="h-10 w-10 text-success" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-success">Verified!</h3>
                        <p className="text-muted-foreground">Certificate is authentic and on blockchain</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Student Name</p>
                        <p className="font-medium">{verificationResult.certificate.studentName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Enrollment Number</p>
                        <p className="font-medium">{verificationResult.certificate.enrollmentNumber}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="font-medium">{verificationResult.certificate.course}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Institution</p>
                        <p className="font-medium">{verificationResult.certificate.institution}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Issue Year</p>
                        <p className="font-medium">{verificationResult.certificate.issueYear}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="font-medium">{new Date(verificationResult.certificate.issueDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Certificate Hash</p>
                      <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">
                        {verificationResult.certificate.certificateHash}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {verificationResult.certificate.studentPhoto && (
                        <Dialog>
                          <Button variant="outline" size="sm" className="gap-2" asChild>
                            <label>
                              <User className="h-4 w-4" />
                              View Student Photo
                            </label>
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Student Photo</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center py-4">
                              <img
                                src={verificationResult.certificate.studentPhoto}
                                alt="Student"
                                className="max-w-full max-h-[400px] rounded-lg object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {verificationResult.certificate.certificatePdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(verificationResult.certificate?.certificatePdf, '_blank')}
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
                    <h3 className="text-2xl font-bold text-destructive mb-2">Not Found</h3>
                    <p className="text-muted-foreground mb-4">
                      This certificate was not found on the blockchain. It may be invalid or forged.
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
                      <Search className="h-4 w-4" />
                      {isVerifying ? 'Verifying...' : 'Verify Certificate'}
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
