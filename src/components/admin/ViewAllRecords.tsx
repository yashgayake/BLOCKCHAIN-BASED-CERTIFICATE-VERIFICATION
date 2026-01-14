import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/contexts/AppContext';
import { List, FileCheck, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ViewAllRecords() {
  const { certificates, students } = useAppContext();

  return (
    <Card className="glass-card">
      <CardHeader><CardTitle className="flex items-center gap-2"><List className="h-5 w-5" />All Records</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="certificates">
          <TabsList className="mb-4"><TabsTrigger value="certificates" className="gap-2"><FileCheck className="h-4 w-4" />Certificates ({certificates.length})</TabsTrigger><TabsTrigger value="students" className="gap-2"><Users className="h-4 w-4" />Students ({students.length})</TabsTrigger></TabsList>
          <TabsContent value="certificates">
            {certificates.length === 0 ? <p className="text-center py-8 text-muted-foreground">No certificates issued yet</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Enrollment</TableHead><TableHead>Course</TableHead><TableHead>Institution</TableHead><TableHead>Year</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.certificateHash}><TableCell className="font-medium">{cert.studentName}</TableCell><TableCell>{cert.enrollmentNumber}</TableCell><TableCell>{cert.course}</TableCell><TableCell>{cert.institution}</TableCell><TableCell>{cert.issueYear}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="students">
            {students.length === 0 ? <p className="text-center py-8 text-muted-foreground">No students registered yet</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Enrollment</TableHead><TableHead>Course</TableHead><TableHead>Email</TableHead><TableHead>Registered</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.enrollmentNumber}><TableCell className="font-medium">{student.name}</TableCell><TableCell>{student.enrollmentNumber}</TableCell><TableCell>{student.course}</TableCell><TableCell>{student.email || '-'}</TableCell><TableCell>{new Date(student.registrationDate).toLocaleDateString()}</TableCell></TableRow>
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
