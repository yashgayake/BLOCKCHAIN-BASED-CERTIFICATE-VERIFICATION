import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Files,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Link as LinkIcon,
  Building2
} from 'lucide-react';

interface AnalyticsCertificate {
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

interface AnalyticsDashboardProps {
  certificates: AnalyticsCertificate[];
  totalStudents?: number;
  contractConnected?: boolean;
}

export default function AnalyticsDashboard({
  certificates,
  totalStudents = 0,
  contractConnected = false
}: AnalyticsDashboardProps) {
  const totalCertificates = certificates.length;

  const normalizedInstitution = (name: string) =>
    (name || 'Unknown Institution').trim().toLowerCase();

  const displayInstitution = (name: string) =>
    (name || 'Unknown Institution').trim();

  const uniqueStudents = new Set(
    certificates.map((cert) => cert.enrollmentNumber.trim().toLowerCase())
  ).size;

  const uniqueCourses = new Set(
    certificates.map((cert) => cert.course.trim().toLowerCase()).filter(Boolean)
  ).size;

  const latestYear =
    certificates.length > 0
      ? Math.max(...certificates.map((cert) => Number(cert.issueYear) || 0))
      : 0;

  const courseCounts = certificates.reduce<Record<string, number>>((acc, cert) => {
    const key = cert.course?.trim() || 'Unknown Course';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const yearCounts = certificates.reduce<Record<string, number>>((acc, cert) => {
    const key = String(cert.issueYear || 'Unknown');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const institutionCountsMap = certificates.reduce<
    Record<string, { label: string; count: number }>
  >((acc, cert) => {
    const normalized = normalizedInstitution(cert.institution);
    const label = displayInstitution(cert.institution);

    if (!acc[normalized]) {
      acc[normalized] = {
        label,
        count: 0
      };
    }

    acc[normalized].count += 1;
    return acc;
  }, {});

  const courseData = Object.entries(courseCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const yearData = Object.entries(yearCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => Number(a.name) - Number(b.name));

  const institutionData = Object.values(institutionCountsMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCourseCount = Math.max(...courseData.map((item) => item.count), 1);
  const maxYearCount = Math.max(...yearData.map((item) => item.count), 1);
  const maxInstitutionCount = Math.max(...institutionData.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      {/* Top main cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Certificates</p>
                <h3 className="mt-2 text-2xl font-bold">{totalCertificates}</h3>
              </div>
              <div className="rounded-2xl bg-success/10 p-3">
                <Files className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <h3 className="mt-2 text-2xl font-bold">{totalStudents}</h3>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Courses</p>
                <h3 className="mt-2 text-2xl font-bold">{uniqueCourses}</h3>
              </div>
              <div className="rounded-2xl bg-purple-500/10 p-3">
                <BookOpen className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contract Connected</p>
                <h3 className="mt-2 text-lg font-bold text-primary">
                  {contractConnected ? 'Yes' : 'No'}
                </h3>
              </div>
              <div className="rounded-2xl bg-orange-500/10 p-3">
                <LinkIcon className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        
        <Card className="glass-card">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Students</p>
                <h3 className="mt-2 text-2xl font-bold">{uniqueStudents}</h3>
              </div>
              <div className="rounded-2xl bg-sky-500/10 p-3">
                <GraduationCap className="h-6 w-6 text-sky-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Courses</p>
                <h3 className="mt-2 text-2xl font-bold">{uniqueCourses}</h3>
              </div>
              <div className="rounded-2xl bg-violet-500/10 p-3">
                <BookOpen className="h-6 w-6 text-violet-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latest Issue Year</p>
                <h3 className="mt-2 text-2xl font-bold">
                  {latestYear > 0 ? latestYear : '-'}
                </h3>
              </div>
              <div className="rounded-2xl bg-rose-500/10 p-3">
                <CalendarDays className="h-6 w-6 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Certificates by Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {courseData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certificate data available.
              </p>
            ) : (
              courseData.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{item.name}</span>
                    <span className="shrink-0 text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                      style={{
                        width: `${(item.count / maxCourseCount) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Certificates by Year</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {yearData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No certificate data available.
              </p>
            ) : (
              yearData.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="shrink-0 text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-3 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${(item.count / maxYearCount) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top institutions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Top Institutions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {institutionData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No institution data available.
            </p>
          ) : (
            institutionData.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{item.label}</span>
                  <span className="shrink-0 text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-3 rounded-full bg-orange-500 transition-all duration-500"
                    style={{
                      width: `${(item.count / maxInstitutionCount) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
