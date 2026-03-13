import { useRef, useState } from 'react';
import {
  FileCheck,
  Upload,
  CheckCircle2,
  Loader2,
  Eye,
  Download
} from 'lucide-react';
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
import { CertificatePreview } from '@/components/admin/CertificatePreview';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function IssueCertificate() {
  const [step, setStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    enrollmentNumber: '',
    studentName: '',
    course: '',
    institution: '',
    issueYear: new Date().getFullYear().toString()
  });

  const [studentPhoto, setStudentPhoto] = useState<string>('');
  const [certificatePdf, setCertificatePdf] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStudent, setIsFetchingStudent] = useState(false);
  const [studentFound, setStudentFound] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const [result, setResult] = useState<{
    certificateHash: string;
    certificateNumber: string;
    transactionHash: string;
  } | null>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const successPreviewRef = useRef<HTMLDivElement | null>(null);

  const { service } = useBlockchain();
  const { addCertificate, certificates } = useAppContext();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();

  const isValidIssueYear = (year: string) => {
    const parsed = Number(year);
    return !Number.isNaN(parsed) && parsed >= 2000 && parsed <= currentYear + 1;
  };

  const generateCertificateNumber = (issueYear: number) => {
    const sameYearCertificates = certificates.filter(
      (cert) => Number(cert.issueYear) === issueYear
    );

    const existingNumbers = sameYearCertificates
      .map((cert) => cert.certificateNumber)
      .filter(Boolean)
      .map((number) => {
        const parts = number.split('-');
        const lastPart = parts[parts.length - 1];
        return Number(lastPart);
      })
      .filter((num) => !Number.isNaN(num));

    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    return `CERT-${issueYear}-${String(nextNumber).padStart(4, '0')}`;
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'photo' | 'pdf'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (type === 'photo') {
        setStudentPhoto(reader.result as string);
      } else {
        setCertificatePdf(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchStudentData = async (enrollmentNumber: string) => {
    const cleanEnrollment = enrollmentNumber.trim();

    if (!cleanEnrollment) {
      setStudentFound(false);
      setFormData((prev) => ({
        ...prev,
        studentName: '',
        course: ''
      }));
      return;
    }

    try {
      setIsFetchingStudent(true);

      const student = await service.getStudent(cleanEnrollment);

      if (student && student.isRegistered) {
        setStudentFound(true);

        setFormData((prev) => ({
          ...prev,
          enrollmentNumber: cleanEnrollment,
          studentName: student.name || '',
          course: student.course || ''
        }));

        toast({
          title: 'Student Found',
          description: 'Student data fetched from blockchain successfully.'
        });
      } else {
        setStudentFound(false);

        setFormData((prev) => ({
          ...prev,
          studentName: '',
          course: ''
        }));

        toast({
          title: 'Student Not Found',
          description: 'No registered student found with this enrollment number.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      setStudentFound(false);

      setFormData((prev) => ({
        ...prev,
        studentName: '',
        course: ''
      }));

      toast({
        title: 'Fetch Failed',
        description: error.message || 'Could not fetch student from blockchain.',
        variant: 'destructive'
      });
    } finally {
      setIsFetchingStudent(false);
    }
  };

  const checkDuplicateCertificate = () => {
    const cleanEnrollment = formData.enrollmentNumber.trim();
    const cleanInstitution = formData.institution.trim().toLowerCase();
    const cleanCourse = formData.course.trim().toLowerCase();
    const parsedYear = Number(formData.issueYear);

    return certificates.some((cert) => {
      return (
        cert.enrollmentNumber.trim() === cleanEnrollment &&
        cert.course.trim().toLowerCase() === cleanCourse &&
        cert.institution.trim().toLowerCase() === cleanInstitution &&
        Number(cert.issueYear) === parsedYear
      );
    });
  };

  const downloadPdfFromElement = async (
    element: HTMLDivElement | null,
    fileName: string
  ) => {
    if (!element) {
      toast({
        title: 'Preview Missing',
        description: 'Certificate preview is not available.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsDownloadingPdf(true);

      const canvas = await html2canvas(element, {
        scale: 4,
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

      pdf.save(fileName);

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

  const handleIssue = async () => {
    const cleanEnrollment = formData.enrollmentNumber.trim();
    const cleanInstitution = formData.institution.trim();
    const cleanStudentName = formData.studentName.trim();
    const cleanCourse = formData.course.trim();
    const parsedYear = Number(formData.issueYear);

    if (!cleanEnrollment || !cleanInstitution) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill enrollment number and institution.',
        variant: 'destructive'
      });
      return;
    }

    if (!cleanStudentName || !cleanCourse || !studentFound) {
      toast({
        title: 'Student Data Missing',
        description: 'Please fetch a valid registered student first.',
        variant: 'destructive'
      });
      return;
    }

    if (!isValidIssueYear(formData.issueYear)) {
      toast({
        title: 'Invalid Issue Year',
        description: `Please enter a valid issue year between 2000 and ${currentYear + 1}.`,
        variant: 'destructive'
      });
      return;
    }

    if (checkDuplicateCertificate()) {
      toast({
        title: 'Duplicate Certificate',
        description:
          'A certificate for this student, course, institution, and year already exists.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const student = await service.getStudent(cleanEnrollment);

      if (!student || !student.isRegistered) {
        toast({
          title: 'Student Not Registered',
          description: 'Student is not registered on blockchain. Please register first.',
          variant: 'destructive'
        });
        return;
      }

      const certificateNumber = generateCertificateNumber(parsedYear);

      const certHash = await generateCertificateHash({
        studentName: cleanStudentName,
        enrollmentNumber: cleanEnrollment,
        course: cleanCourse,
        institution: cleanInstitution,
        issueYear: parsedYear
      });

      const tx = await service.issueCertificate(
        certHash,
        cleanEnrollment,
        cleanStudentName,
        cleanCourse,
        cleanInstitution,
        parsedYear,
        ''
      );

      const receipt = await tx.wait();

      addCertificate({
        certificateHash: certHash,
        certificateNumber,
        transactionHash: receipt.transactionHash,
        studentName: cleanStudentName,
        enrollmentNumber: cleanEnrollment,
        course: cleanCourse,
        institution: cleanInstitution,
        issueYear: parsedYear,
        issueDate: new Date().toISOString(),
        studentPhoto,
        certificatePdf
      });

      setResult({
        certificateHash: certHash,
        certificateNumber,
        transactionHash: receipt.transactionHash
      });

      setStep(3);

      toast({
        title: 'Success!',
        description: 'Certificate issued on blockchain successfully.'
      });
    } catch (err: any) {
      toast({
        title: 'Issue Failed',
        description: err.message || 'Failed to issue certificate on blockchain.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewCertificateNumber = isValidIssueYear(formData.issueYear)
    ? generateCertificateNumber(Number(formData.issueYear))
    : 'Enter valid issue year';

  const previewHash = `preview-${formData.enrollmentNumber || 'hash'}-${formData.issueYear || 'year'}`;

  if (step === 3 && result) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-success mb-4">
            Certificate Issued Successfully!
          </h3>

          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Certificate Number</p>
            <p className="text-lg font-semibold">{result.certificateNumber}</p>
          </div>

          <div className="mb-6 flex justify-center">
            <div className="rounded-xl bg-white p-4">
              <QRCodeSVG value={result.certificateHash} size={150} />
            </div>
          </div>

          <div className="mx-auto max-w-md space-y-3 text-left">
            <div>
              <p className="text-sm text-muted-foreground">Certificate Number</p>
              <p className="rounded bg-muted p-2 text-sm font-medium">
                {result.certificateNumber}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Certificate Hash</p>
              <p className="break-all rounded bg-muted p-2 font-mono text-xs">
                {result.certificateHash}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Transaction Hash</p>
              <p className="break-all rounded bg-muted p-2 font-mono text-xs">
                {result.transactionHash}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() =>
                downloadPdfFromElement(
                  successPreviewRef.current,
                  `${result.certificateNumber}.pdf`
                )
              }
              disabled={isDownloadingPdf}
            >
              <Download className="h-4 w-4" />
              {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
            </Button>

            <Button
              onClick={() => {
                setStep(1);
                setShowPreview(false);
                setResult(null);
                setStudentFound(false);
                setFormData({
                  enrollmentNumber: '',
                  studentName: '',
                  course: '',
                  institution: '',
                  issueYear: new Date().getFullYear().toString()
                });
                setStudentPhoto('');
                setCertificatePdf('');
              }}
            >
              Issue Another
            </Button>
          </div>

          <div className="mt-8 hidden">
            <CertificatePreview
              ref={successPreviewRef}
              certificateNumber={result.certificateNumber}
              studentName={formData.studentName || 'Student Name'}
              course={formData.course || 'Course Name'}
              institution={formData.institution || 'Institute Name'}
              issueDate={new Date().toISOString()}
              certificateHash={result.certificateHash}
              issuerName="Yash Gayake"
              issuerTitle="Registrar"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Issue Certificate
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="manual">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="upload">Upload & Extract (AI)</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Enrollment Number *</Label>
                <Input
                  value={formData.enrollmentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, enrollmentNumber: e.target.value })
                  }
                  onBlur={() => fetchStudentData(formData.enrollmentNumber)}
                  className="mt-2"
                  placeholder="Enter enrollment number"
                />
                {isFetchingStudent && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fetching student data...
                  </p>
                )}
                {studentFound && !isFetchingStudent && (
                  <p className="mt-1 text-xs text-success">
                    Student found on blockchain.
                  </p>
                )}
              </div>

              <div>
                <Label>Student Name *</Label>
                <Input
                  value={formData.studentName}
                  readOnly
                  className="mt-2 bg-muted"
                  placeholder="Auto-filled from blockchain"
                />
              </div>

              <div>
                <Label>Course *</Label>
                <Input
                  value={formData.course}
                  readOnly
                  className="mt-2 bg-muted"
                  placeholder="Auto-filled from blockchain"
                />
              </div>

              <div>
                <Label>Institution *</Label>
                <Input
                  value={formData.institution}
                  onChange={(e) =>
                    setFormData({ ...formData, institution: e.target.value })
                  }
                  className="mt-2"
                  placeholder="Enter institution name"
                />
              </div>

              <div>
                <Label>Issue Year</Label>
                <Input
                  type="number"
                  value={formData.issueYear}
                  onChange={(e) =>
                    setFormData({ ...formData, issueYear: e.target.value })
                  }
                  className="mt-2"
                  placeholder="Enter issue year"
                />
                {!isValidIssueYear(formData.issueYear) && formData.issueYear && (
                  <p className="mt-1 text-xs text-destructive">
                    Enter a valid year between 2000 and {currentYear + 1}.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="mb-1 text-sm text-muted-foreground">
                Certificate Number Preview
              </p>
              <p className="font-semibold">{previewCertificateNumber}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Student Photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'photo')}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Certificate PDF</Label>
                <Input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, 'pdf')}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview((prev) => !prev)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() =>
                  downloadPdfFromElement(
                    previewRef.current,
                    `${previewCertificateNumber}.pdf`
                  )
                }
                disabled={isDownloadingPdf}
              >
                <Download className="h-4 w-4" />
                {isDownloadingPdf ? 'Downloading...' : 'Download Preview PDF'}
              </Button>

              <Button
                onClick={handleIssue}
                disabled={isLoading || isFetchingStudent}
                className="flex-1"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Issuing...
                  </span>
                ) : (
                  'Issue & Register on Blockchain'
                )}
              </Button>
            </div>

            {showPreview && (
              <div className="pt-4">
                <CertificatePreview
                  ref={previewRef}
                  certificateNumber={previewCertificateNumber}
                  studentName={formData.studentName || 'Student Name'}
                  course={formData.course || 'Course Name'}
                  institution={formData.institution || 'Institute Name'}
                  issueDate={new Date().toISOString()}
                  certificateHash={previewHash}
                  issuerName="Yash Gayake"
                  issuerTitle="Registrar"
                />
              </div>
            )}

            {!showPreview && (
              <div className="hidden">
                <CertificatePreview
                  ref={previewRef}
                  certificateNumber={previewCertificateNumber}
                  studentName={formData.studentName || 'Student Name'}
                  course={formData.course || 'Course Name'}
                  institution={formData.institution || 'Institute Name'}
                  issueDate={new Date().toISOString()}
                  certificateHash={previewHash}
                  issuerName="Yash Gayake"
                  issuerTitle="Registrar"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="py-8 text-center">
            <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">
              AI extraction requires Gemini API integration.
              <br />
              Use manual entry for now.
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}