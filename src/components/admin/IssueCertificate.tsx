import { useState } from 'react';
import { FileCheck, Upload, CheckCircle2, Loader2, Sparkles, ArrowRight, ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { generateCertificateHash } from '@/lib/blockchain';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';

export function IssueCertificate() {
  // AI Upload Flow State
  const [aiStep, setAiStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Review/Edit, 3: Result
  const [uploadedImage, setUploadedImage] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Common State
  const [formData, setFormData] = useState({ enrollmentNumber: '', studentName: '', course: '', institution: '', issueYear: new Date().getFullYear().toString() });
  const [studentPhoto, setStudentPhoto] = useState<string>('');
  const [certificatePdf, setCertificatePdf] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ certificateHash: string; transactionHash: string } | null>(null);

  const { service } = useBlockchain();
  const { addCertificate, getStudentByEnrollment } = useAppContext();
  const { toast } = useToast();

  // Handle certificate image upload for AI extraction
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setUploadedImage(base64);
      setCertificatePdf(base64);
      
      // Auto-extract with AI
      await extractWithAI(base64);
    };
    reader.readAsDataURL(file);
  };

  // AI Extraction Function
  const extractWithAI = async (imageBase64: string) => {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-certificate', {
        body: { imageBase64 }
      });

      if (error) {
        console.error('AI extraction error:', error);
        toast({
          title: "AI Extraction Failed",
          description: "Could not extract data. Please fill manually.",
          variant: "destructive"
        });
        setAiStep(2);
        return;
      }

      if (data?.success && data?.data) {
        setFormData({
          studentName: data.data.studentName || '',
          enrollmentNumber: data.data.enrollmentNumber || '',
          course: data.data.course || '',
          institution: data.data.institution || '',
          issueYear: data.data.issueYear || new Date().getFullYear().toString()
        });
        toast({
          title: "✨ AI Extraction Complete!",
          description: "Please review and edit the extracted data.",
        });
      }
      setAiStep(2);
    } catch (err: any) {
      console.error('Extraction error:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to process image",
        variant: "destructive"
      });
      setAiStep(2);
    } finally {
      setIsExtracting(false);
    }
  };

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

  // Send email notification to student
  const sendEmailNotification = async (
    studentEmail: string,
    certificateHash: string,
    transactionHash: string
  ) => {
    try {
      console.log("Sending email notification to:", studentEmail);
      const { data, error } = await supabase.functions.invoke('send-certificate-email', {
        body: {
          studentEmail,
          studentName: formData.studentName,
          enrollmentNumber: formData.enrollmentNumber,
          course: formData.course,
          institution: formData.institution,
          issueYear: parseInt(formData.issueYear),
          certificateHash,
          transactionHash
        }
      });

      if (error) {
        console.error("Email send error:", error);
        toast({
          title: "Email Warning",
          description: "Certificate issued but email notification failed.",
          variant: "destructive"
        });
        return;
      }

      console.log("Email sent successfully:", data);
      toast({
        title: "📧 Email Sent!",
        description: `Notification sent to ${studentEmail}`,
      });
    } catch (err: any) {
      console.error("Email notification error:", err);
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

      // Send email notification if student has email
      if (student.email) {
        await sendEmailNotification(student.email, certHash, receipt.transactionHash);
      }

      setResult({ certificateHash: certHash, transactionHash: receipt.transactionHash });
      setAiStep(3);
      toast({ title: "Success!", description: "Certificate issued on blockchain" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (aiStep === 3 && result) {
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
          <Button onClick={() => { setAiStep(1); setResult(null); setUploadedImage(''); setFormData({ enrollmentNumber: '', studentName: '', course: '', institution: '', issueYear: new Date().getFullYear().toString() }); }} className="mt-6">Issue Another</Button>
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
          <TabsContent value="upload" className="space-y-6">
            {/* Step 1: Upload */}
            {aiStep === 1 && (
              <div className="text-center py-8 space-y-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI-Powered Extraction</h3>
                  <p className="text-muted-foreground">Upload certificate image/PDF and let Gemini AI extract details automatically</p>
                </div>
                
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 hover:border-primary/50 transition-colors">
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleCertificateUpload}
                    className="hidden"
                    id="ai-upload"
                  />
                  <label htmlFor="ai-upload" className="cursor-pointer block">
                    <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="font-medium">Click to upload or drag & drop</p>
                    <p className="text-sm text-muted-foreground mt-1">Supports: JPG, PNG, PDF</p>
                  </label>
                </div>
              </div>
            )}

            {/* Extracting Loader */}
            {isExtracting && (
              <div className="text-center py-12 space-y-4">
                <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin" />
                <h3 className="text-xl font-semibold">🤖 AI is analyzing your certificate...</h3>
                <p className="text-muted-foreground">Extracting student name, enrollment number, course details...</p>
              </div>
            )}

            {/* Step 2: Review/Edit */}
            {aiStep === 2 && !isExtracting && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <Edit className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Review Extracted Data</h3>
                    <p className="text-sm text-muted-foreground">Verify and edit if needed before issuing</p>
                  </div>
                </div>

                {uploadedImage && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Uploaded Certificate:</p>
                    <img src={uploadedImage} alt="Certificate" className="max-h-40 rounded-lg mx-auto" />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Enrollment Number *</Label>
                    <Input value={formData.enrollmentNumber} onChange={(e) => setFormData({...formData, enrollmentNumber: e.target.value})} className="mt-2" />
                  </div>
                  <div>
                    <Label>Student Name *</Label>
                    <Input value={formData.studentName} onChange={(e) => setFormData({...formData, studentName: e.target.value})} className="mt-2" />
                  </div>
                  <div>
                    <Label>Course *</Label>
                    <Input value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="mt-2" />
                  </div>
                  <div>
                    <Label>Institution *</Label>
                    <Input value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})} className="mt-2" />
                  </div>
                  <div>
                    <Label>Issue Year</Label>
                    <Input type="number" value={formData.issueYear} onChange={(e) => setFormData({...formData, issueYear: e.target.value})} className="mt-2" />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Student Photo (Optional)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} className="mt-2" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setAiStep(1); setUploadedImage(''); }} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleIssue} disabled={isLoading} className="flex-1 gap-2">
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Issuing...</> : <><ArrowRight className="h-4 w-4" /> Issue & Register on Blockchain</>}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Result - handled by main result view */}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
