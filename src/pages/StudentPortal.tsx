import { useState } from 'react';
import { GraduationCap, LogIn, AlertCircle, FileCheck, Download, QrCode, Eye, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/Navbar';
import { useAppContext, StoredCertificate } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function StudentPortal() {
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInStudent, setLoggedInStudent] = useState<{ enrollmentNumber: string; name: string } | null>(null);
  const [studentCertificates, setStudentCertificates] = useState<StoredCertificate[]>([]);
  
  const { getStudentByEnrollment, getCertificatesByEnrollment } = useAppContext();
  const { toast } = useToast();

  const handleLogin = () => {
    if (!enrollmentNumber.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter enrollment number and password",
        variant: "destructive",
      });
      return;
    }

    const student = getStudentByEnrollment(enrollmentNumber);
    
    if (!student) {
      toast({
        title: "Login Failed",
        description: "Student not found. Please check your enrollment number.",
        variant: "destructive",
      });
      return;
    }

    if (student.password !== password) {
      toast({
        title: "Login Failed",
        description: "Invalid password. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Login successful
    setIsLoggedIn(true);
    setLoggedInStudent({ enrollmentNumber: student.enrollmentNumber, name: student.name });
    
    // Get student's certificates
    const certs = getCertificatesByEnrollment(enrollmentNumber);
    setStudentCertificates(certs);

    toast({
      title: "Login Successful",
      description: `Welcome, ${student.name}!`,
    });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInStudent(null);
    setStudentCertificates([]);
    setEnrollmentNumber('');
    setPassword('');
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

  // Login form
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
                <CardDescription>
                  Login to view your certificates
                </CardDescription>
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
                  <p className="text-xs text-muted-foreground mt-2">
                    Use the password provided by your institute (e.g., 0777)
                  </p>
                </div>
                <Button onClick={handleLogin} className="w-full gap-2" size="lg">
                  <LogIn className="h-5 w-5" />
                  Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Student dashboard
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-success" />
              Welcome, {loggedInStudent?.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              Enrollment: {loggedInStudent?.enrollmentNumber}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Certificates */}
        {studentCertificates.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <FileCheck className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Certificates Found</h3>
              <p className="text-muted-foreground">
                No certificates have been issued to your account yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Your Certificates ({studentCertificates.length})</h2>
            
            <div className="grid gap-6 md:grid-cols-2">
              {studentCertificates.map((cert) => (
                <Card key={cert.certificateHash} className="glass-card">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{cert.course}</CardTitle>
                        <CardDescription>{cert.institution}</CardDescription>
                      </div>
                      <div className="rounded-lg bg-success/10 px-3 py-1 text-sm text-success font-medium">
                        Verified
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Issue Year</p>
                        <p className="font-medium">{cert.issueYear}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issue Date</p>
                        <p className="font-medium">{new Date(cert.issueDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Certificate Hash</p>
                      <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">
                        {cert.certificateHash}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Transaction Hash</p>
                      <p className="font-mono text-xs break-all bg-muted/50 p-2 rounded">
                        {cert.transactionHash}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {/* QR Code Dialog */}
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
                            <div className="p-4 bg-white rounded-xl">
                              <QRCodeSVG
                                id={`qr-${cert.certificateHash}`}
                                value={cert.certificateHash}
                                size={200}
                                level="H"
                              />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
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

                      {/* View Photo */}
                      {cert.studentPhoto && (
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
                                src={cert.studentPhoto}
                                alt="Student"
                                className="max-w-full max-h-[400px] rounded-lg object-contain"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* View Certificate */}
                      {cert.certificatePdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(cert.certificatePdf, '_blank')}
                        >
                          <FileCheck className="h-4 w-4" />
                          View Certificate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
