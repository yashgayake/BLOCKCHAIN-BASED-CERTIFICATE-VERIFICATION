// on-chain certificateNumber add ho gaya

// new student fields use ho rahe hain:

// mobileNumber

// department

// batchYear


// student course hata diya gaya

// certificate table me certificate number column add hai


// Full updated src/components/admin/ViewAllRecords.tsx

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
  Check,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { useToast } from '@/hooks/use-toast';

interface BlockchainCertificate {
  certificateHash: string;
  certificateNumber: string;
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
  mobileNumber: string;
  department: string;
  batchYear: string;
  isRegistered: boolean;
  registrationDate: number;
}

const FRESH_START_KEY = 'recordsFreshStartTimestamp';

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
  const [studentDepartmentFilter, setStudentDepartmentFilter] = useState('All');

  const [copiedHash, setCopiedHash] = useState<string>('');
  const [freshStartTimestamp, setFreshStartTimestamp] = useState<number | null>(() => {
    const saved = localStorage.getItem(FRESH_START_KEY);
    return saved ? Number(saved) : null;
  });

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
            certificateNumber: cert.certificateNumber,
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
            mobileNumber: student.mobileNumber,
            department: student.department,
            batchYear: student.batchYear,
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

  const startFreshRecords = () => {
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem(FRESH_START_KEY, String(now));
    setFreshStartTimestamp(now);

    toast({
      title: 'Fresh Start Enabled',
      description: 'Old blockchain records are now hidden. Only new records will be shown.'
    });
  };

  const resetFreshRecordsFilter = () => {
    localStorage.removeItem(FRESH_START_KEY);
    setFreshStartTimestamp(null);

    toast({
      title: 'Filter Removed',
      description: 'All blockchain records will be shown again.'
    });
  };

  const visibleCertificates = useMemo(() => {
    if (!freshStartTimestamp) return certificates;
    return certificates.filter((cert) => cert.issueDate >= freshStartTimestamp);
  }, [certificates, freshStartTimestamp]);

  const visibleStudents = useMemo(() => {
    if (!freshStartTimestamp) return students;
    return students.filter((student) => student.registrationDate >= freshStartTimestamp);
  }, [students, freshStartTimestamp]);

  const certificateCourses = useMemo(() => {
    const uniqueCourses = Array.from(new Set(visibleCertificates.map((c) => c.course))).filter(Boolean);
    return ['All', ...uniqueCourses.sort()];
  }, [visibleCertificates]);

  const certificateYears = useMemo(() => {
    const uniqueYears = Array.from(new Set(visibleCertificates.map((c) => String(c.issueYear)))).filter(Boolean);
    return ['All', ...uniqueYears.sort((a, b) => Number(b) - Number(a))];
  }, [visibleCertificates]);

  const studentDepartments = useMemo(() => {
    const uniqueDepartments = Array.from(new Set(visibleStudents.map((s) => s.department))).filter(Boolean);
    return ['All', ...uniqueDepartments.sort()];
  }, [visibleStudents]);

  const filteredCertificates = useMemo(() => {
    const query = certificateSearch.trim().toLowerCase();

    return visibleCertificates.filter((cert) => {
      const matchesSearch =
        !query ||
        cert.studentName.toLowerCase().includes(query) ||
        cert.enrollmentNumber.toLowerCase().includes(query) ||
        cert.course.toLowerCase().includes(query) ||
        cert.institution.toLowerCase().includes(query) ||
        cert.certificateHash.toLowerCase().includes(query) ||
        cert.certificateNumber.toLowerCase().includes(query) ||
        String(cert.issueYear).includes(query);

      const matchesCourse =
        certificateCourseFilter === 'All' || cert.course === certificateCourseFilter;

      const matchesYear =
        certificateYearFilter === 'All' || String(cert.issueYear) === certificateYearFilter;

      return matchesSearch && matchesCourse && matchesYear;
    });
  }, [
    visibleCertificates,
    certificateSearch,
    certificateCourseFilter,
    certificateYearFilter
  ]);

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();

    return visibleStudents.filter((student) => {
      const matchesSearch =
        !query ||
        student.name.toLowerCase().includes(query) ||
        student.enrollmentNumber.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.mobileNumber.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query) ||
        student.batchYear.toLowerCase().includes(query);

      const matchesDepartment =
        studentDepartmentFilter === 'All' || student.department === studentDepartmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [visibleStudents, studentSearch, studentDepartmentFilter]);

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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              All Records
            </CardTitle>

            <div className="flex flex-wrap gap-2">
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

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={startFreshRecords}
              >
                <Trash2 className="h-4 w-4" />
                Start Fresh
              </Button>

              {freshStartTimestamp && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={resetFreshRecordsFilter}
                >
                  <RotateCcw className="h-4 w-4" />
                  Show All
                </Button>
              )}
            </div>
          </div>

          {freshStartTimestamp && (
            <p className="text-sm text-muted-foreground">
              Fresh mode is active. Showing only records created after{' '}
              {new Date(freshStartTimestamp * 1000).toLocaleString()}.
            </p>
          )}
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
                  : 'No certificates available in current view.'}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate No</TableHead>
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
                        <TableCell className="font-semibold">
                          {cert.certificateNumber || '-'}
                        </TableCell>
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
                value={studentDepartmentFilter}
                onChange={(e) => setStudentDepartmentFilter(e.target.value)}
                className="h-10 rounded-md border bg-background px-3 text-sm"
              >
                {studentDepartments.map((department) => (
                  <option key={department} value={department}>
                    {department === 'All' ? 'All Departments' : department}
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
                {studentSearch || studentDepartmentFilter !== 'All'
                  ? 'No matching students found.'
                  : 'No students available in current view.'}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Enrollment</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Batch / Year</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.enrollmentNumber}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.enrollmentNumber}</TableCell>
                        <TableCell>{student.email || '-'}</TableCell>
                        <TableCell>{student.mobileNumber || '-'}</TableCell>
                        <TableCell>{student.department || '-'}</TableCell>
                        <TableCell>{student.batchYear || '-'}</TableCell>
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
