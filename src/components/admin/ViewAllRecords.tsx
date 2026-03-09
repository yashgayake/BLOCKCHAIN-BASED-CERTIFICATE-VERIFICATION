import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { List, FileCheck, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { useToast } from '@/hooks/use-toast';

interface BlockchainCertificate {
  certificateHash: string;
  studentName: string;
  enrollmentNumber: string;
  course: string;
  institution: string;
  issueYear: number;
  issueDate: number;
  ipfsHash: string;
  issuerAddress: string;
}

interface BlockchainStudent {
  enrollmentNumber: string;
  name: string;
  email: string;
  course: string;
  isRegistered: boolean;
  registrationDate: number;
}

export function ViewAllRecords() {
  const { service } = useBlockchain();
  const { toast } = useToast();

  const [certificates, setCertificates] = useState<BlockchainCertificate[]>([]);
  const [students, setStudents] = useState<BlockchainStudent[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    loadCertificates();
    loadStudents();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoadingCertificates(true);

      const hashes = await service.getAllCertificateHashes();

      const certData = await Promise.all(
        hashes.map(async (hash: string) => {
          const cert = await service.getCertificate(hash);
          return {
            certificateHash: hash,
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

      setCertificates(certData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load certificates from blockchain',
        variant: 'destructive'
      });
    } finally {
      setLoadingCertificates(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);

      const enrollmentNumbers = await service.getAllEnrollmentNumbers();

      const studentData = await Promise.all(
        enrollmentNumbers.map(async (enrollment: string) => {
          const student = await service.getStudent(enrollment);
          return {
            enrollmentNumber: enrollment,
            name: student.name,
            email: student.email,
            course: student.course,
            isRegistered: student.isRegistered,
            registrationDate: student.registrationDate
          };
        })
      );

      setStudents(studentData.filter((student) => student.isRegistered));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load students from blockchain',
        variant: 'destructive'
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          All Records
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="certificates">
          <TabsList className="mb-4">
            <TabsTrigger value="certificates" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Certificates ({certificates.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Students ({students.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certificates">
            {loadingCertificates ? (
              <p className="text-center py-8 text-muted-foreground">Loading certificates from blockchain...</p>
            ) : certificates.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No certificates issued yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.certificateHash}>
                        <TableCell className="font-medium">{cert.studentName}</TableCell>
                        <TableCell>{cert.enrollmentNumber}</TableCell>
                        <TableCell>{cert.course}</TableCell>
                        <TableCell>{cert.institution}</TableCell>
                        <TableCell>{cert.issueYear}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="students">
            {loadingStudents ? (
              <p className="text-center py-8 text-muted-foreground">Loading students from blockchain...</p>
            ) : students.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No students registered yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.enrollmentNumber}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.enrollmentNumber}</TableCell>
                        <TableCell>{student.course}</TableCell>
                        <TableCell>{student.email || '-'}</TableCell>
                        <TableCell>
                          {student.registrationDate
                            ? new Date(student.registrationDate * 1000).toLocaleDateString()
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}