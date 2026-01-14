import { useState } from 'react';
import { FileCheck, Upload, CheckCircle2, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { generateCertificateHash } from '@/lib/blockchain';
import { QRCodeSVG } from 'qrcode.react';

export function IssueCertificate() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ enrollmentNumber: '', studentName: '', course: '', institution: '', issueYear: new Date().getFullYear().toString() });
  const [studentPhoto, setStudentPhoto] = useState<string>('');
  const [certificatePdf, setCertificatePdf] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ certificateHash: string; transactionHash: string } | null>(null);

  const { service } = useBlockchain();
  const { addCertificate, getStudentByEnrollment } = useAppContext();
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'pdf') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'photo') setStudentPhoto(reader.result as string);
        else setCertificatePdf(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIssue = async () => {
    if (!formData.enrollmentNumber || !formData.studentName || !formData.course || !formData.institution) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const student = getStudentByEnrollment(formData.enrollmentNumber);
    if (!student) {
      toast({ title: "Error", description: "Student not registered. Please register first.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const certHash = await generateCertificateHash({
        studentName: formData.studentName,
        enrollmentNumber: formData.enrollmentNumber,
        course: formData.course,
        institution: formData.institution,
        issueYear: parseInt(formData.issueYear)
      });

      const tx = await service.issueCertificate(
        certHash, formData.enrollmentNumber, formData.studentName, formData.course, formData.institution, parseInt(formData.issueYear), ''
      );
      const receipt = await tx.wait();

      addCertificate({
        certificateHash: certHash,
        transactionHash: receipt.transactionHash,
        studentName: formData.studentName,
        enrollmentNumber: formData.enrollmentNumber,
        course: formData.course,
        institution: formData.institution,
        issueYear: parseInt(formData.issueYear),
        issueDate: new Date().toISOString(),
        studentPhoto,
        certificatePdf
      });

      setResult({ certificateHash: certHash, transactionHash: receipt.transactionHash });
      setStep(3);
      toast({ title: "Success!", description: "Certificate issued on blockchain" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3 && result) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-success mb-4">Certificate Issued Successfully!</h3>
          <div className="flex justify-center mb-6"><div className="p-4 bg-white rounded-xl"><QRCodeSVG value={result.certificateHash} size={150} /></div></div>
          <div className="text-left space-y-3 max-w-md mx-auto">
            <div><p className="text-sm text-muted-foreground">Certificate Hash</p><p className="font-mono text-xs break-all bg-muted p-2 rounded">{result.certificateHash}</p></div>
            <div><p className="text-sm text-muted-foreground">Transaction Hash</p><p className="font-mono text-xs break-all bg-muted p-2 rounded">{result.transactionHash}</p></div>
          </div>
          <Button onClick={() => { setStep(1); setResult(null); setFormData({ enrollmentNumber: '', studentName: '', course: '', institution: '', issueYear: new Date().getFullYear().toString() }); }} className="mt-6">Issue Another</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" />Issue Certificate</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="manual">
          <TabsList className="grid w-full grid-cols-2 mb-6"><TabsTrigger value="manual">Manual Entry</TabsTrigger><TabsTrigger value="upload">Upload & Extract (AI)</TabsTrigger></TabsList>
          <TabsContent value="manual" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Enrollment Number *</Label><Input value={formData.enrollmentNumber} onChange={(e) => setFormData({...formData, enrollmentNumber: e.target.value})} className="mt-2" /></div>
              <div><Label>Student Name *</Label><Input value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})} className="mt-2" /></div>
              <div><Label>Course *</Label><Input value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="mt-2" /></div>
              <div><Label>Institution *</Label><Input value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="mt-2" /></div>
              <div><Label>Issue Year</Label><Input type="number" value={formData.issueYear} onChange={(e) => setFormData({...formData, issueYear: e.target.value})} className="mt-2" /></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Student Photo</Label><Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} className="mt-2" /></div>
              <div><Label>Certificate PDF</Label><Input type="file" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'pdf')} className="mt-2" /></div>
            </div>
            <Button onClick={handleIssue} disabled={isLoading} className="w-full">{isLoading ? 'Issuing...' : 'Issue & Register on Blockchain'}</Button>
          </TabsContent>
          <TabsContent value="upload" className="text-center py-8">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">AI extraction requires Gemini API integration.<br/>Use manual entry for now.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
