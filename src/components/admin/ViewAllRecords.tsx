import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  List,
  FileCheck,
  Users,
  Search,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

  const [certificateSearch, setCertificateSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [certificateCourseFilter, setCertificateCourseFilter] = useState('All');
  const [certificateYearFilter, setCertificateYearFilter] = useState('All');
  const [studentCourseFilter, setStudentCourseFilter] = useState('All');

  const [copiedHash, setCopiedHash] = useState<string>('');

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
        description: error.message || 'Failed to load certificates from blockchain',
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
        description: error.message || 'Failed to load students from blockchain',
        variant: 'destructive'
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const certificateCourses = useMemo(() => {
    const uniqueCourses = Array.from(new Set(certificates.map((c) => c.course))).filter(Boolean);
    return ['All', ...uniqueCourses.sort()];
  }, [certificates]);

  const certificateYears = useMemo(() => {
    const uniqueYears = Array.from(new Set(certificates.map((c) => String(c.issueYear)))).filter(Boolean);
    return ['All', ...uniqueYears.sort((a, b) => Number(b) - Number(a))];
  }, [certificates]);

  const studentCourses = useMemo(() => {
    const uniqueCourses = Array.from(new Set(students.map((s) => s.course))).filter(Boolean);
    return ['All', ...uniqueCourses.sort()];
  }, [students]);

  const filteredCertificates = useMemo(() => {
    const query = certificateSearch.trim().toLowerCase();

    return certificates.filter((cert) => {
      const matchesSearch =
        !query ||
        cert.studentName.toLowerCase().includes(query) ||
        cert.enrollmentNumber.toLowerCase().includes(query) ||
        cert.course.toLowerCase().includes(query) ||
        cert.institution.toLowerCase().includes(query) ||
        cert.certificateHash.toLowerCase().includes(query) ||
        String(cert.issueYear).includes(query);

      const matchesCourse =
        certificateCourseFilter === 'All' || cert.course === certificateCourseFilter;

      const matchesYear =
        certificateYearFilter === 'All' || String(cert.issueYear) === certificateYearFilter;

      return matchesSearch && matchesCourse && matchesYear;
    });
  }, [certificates, certificateSearch, certificateCourseFilter, certificateYearFilter]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.enrollmentNumber.toLowerCase().includes(query) ||
        student.course.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);

      const matchesCourse =
        studentCourseFilter === 'All' || student.course === studentCourseFilter;

      return matchesSearch && matchesCourse;
    });
  }, [students, studentSearch, studentCourseFilter]);

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);

      toast({
        title: 'Copied',
        description: 'Certificate hash copied to clipboard.'
      });

      setTimeout(() => {
        setCopiedHash('');
      }, 1500);
    } catch {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy certificate hash.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            All Records
          </CardTitle>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={loadCertificates}
              disabled={loadingCertificates}
            >
              <RefreshCw className={`h-4 w-4 ${loadingCertificates ? 'animate-spin' : ''}`} />
              Certificates
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={loadStudents}
              disabled={loadingStudents}
            >
              <RefreshCw className={`h-4 w-4 ${loadingStudents ? 'animate-spin' : ''}`} />
              Students
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="certificates">
          <TabsList className="mb-4">
            <TabsTrigger value="certificates" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Certificates ({filteredCertificates.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Students ({filteredStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search certificates..."
                  value={certificateSearch}
                  onChange={(e) => setCertificateSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={certificateCourseFilter}
                onChange={(e) => setCertificateCourseFilter(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {certificateCourses.map((course) => (
                  <option key={course} value={course}>
                    {course === 'All' ? 'All Courses' : course}
                  </option>
                ))}
              </select>

              <select
                value={certificateYearFilter}
                onChange={(e) => setCertificateYearFilter(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {certificateYears.map((year) => (
                  <option key={year} value={year}>
                    {year === 'All' ? 'All Years' : year}
                  </option>
                ))}
              </select>
            </div>

            {loadingCertificates ? (
              <p className="py-8 text-center text-muted-foreground">
                Loading certificates from blockchain...
              </p>
            ) : filteredCertificates.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {certificateSearch || certificateCourseFilter !== 'All' || certificateYearFilter !== 'All'
                  ? 'No matching certificates found.'
                  : 'No certificates issued yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Certificate Hash</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredCertificates.map((cert) => (
                      <TableRow key={cert.certificateHash}>
                        <TableCell className="font-medium">{cert.studentName}</TableCell>
                        <TableCell>{cert.enrollmentNumber}</TableCell>
                        <TableCell>{cert.course}</TableCell>
                        <TableCell>{cert.institution}</TableCell>
                        <TableCell>{cert.issueYear}</TableCell>
                        <TableCell>
                          {cert.issueDate
                            ? new Date(cert.issueDate * 1000).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {cert.certificateHash.slice(0, 12)}...
                            </span>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleCopyHash(cert.certificateHash)}
                            >
                              {copiedHash === cert.certificateHash ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <select
                value={studentCourseFilter}
                onChange={(e) => setStudentCourseFilter(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {studentCourses.map((course) => (
                  <option key={course} value={course}>
                    {course === 'All' ? 'All Courses' : course}
                  </option>
                ))}
              </select>
            </div>

            {loadingStudents ? (
              <p className="py-8 text-center text-muted-foreground">
                Loading students from blockchain...
              </p>
            ) : filteredStudents.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {studentSearch || studentCourseFilter !== 'All'
                  ? 'No matching students found.'
                  : 'No students registered yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
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
                    {filteredStudents.map((student) => (
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