import { useState } from 'react';
import { UserPlus, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { useToast } from '@/hooks/use-toast';

export function RegisterStudent() {
  const [formData, setFormData] = useState({
    enrollmentNumber: '',
    name: '',
    email: '',
    course: '',
    password: '0777'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState(false);

  const { service } = useBlockchain();
  const { toast } = useToast();

  const isValidEmail = (email: string) => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkDuplicateStudent = async (enrollmentNumber: string) => {
    const cleanEnrollment = enrollmentNumber.trim();

    if (!cleanEnrollment) {
      setDuplicateFound(false);
      return;
    }

    try {
      setCheckingDuplicate(true);

      const existingStudent = await service.getStudent(cleanEnrollment);

      if (existingStudent && existingStudent.isRegistered) {
        setDuplicateFound(true);
        toast({
          title: 'Duplicate Student',
          description: 'Student with this enrollment number already exists.',
          variant: 'destructive'
        });
      } else {
        setDuplicateFound(false);
      }
    } catch {
      setDuplicateFound(false);
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleSubmit = async () => {
    const cleanEnrollment = formData.enrollmentNumber.trim();
    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanCourse = formData.course.trim();
    const cleanPassword = formData.password.trim();

    if (!cleanEnrollment || !cleanName || !cleanCourse) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill enrollment number, full name, and course.',
        variant: 'destructive'
      });
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive'
      });
      return;
    }

    if (duplicateFound) {
      toast({
        title: 'Duplicate Student',
        description: 'Student with this enrollment number is already registered.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const existingStudent = await service.getStudent(cleanEnrollment);

      if (existingStudent && existingStudent.isRegistered) {
        setDuplicateFound(true);
        toast({
          title: 'Duplicate Student',
          description: 'Student with this enrollment number is already registered.',
          variant: 'destructive'
        });
        return;
      }
    } catch {
      // continue if no student found
    }

    try {
      const tx = await service.registerStudent(
        cleanEnrollment,
        cleanName,
        cleanEmail,
        cleanCourse,
        cleanPassword
      );

      await tx.wait();

      setSuccess(true);
      setDuplicateFound(false);

      toast({
        title: 'Success!',
        description: 'Student registered on blockchain successfully.'
      });

      setFormData({
        enrollmentNumber: cleanEnrollment,
        name: cleanName,
        email: cleanEmail,
        course: cleanCourse,
        password: cleanPassword
      });
    } catch (err: any) {
      toast({
        title: 'Registration Failed',
        description: err.message || 'Failed to register student on blockchain.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-success mb-2">Student Registered!</h3>
          <p className="text-muted-foreground mb-4">
            Enrollment: {formData.enrollmentNumber}
          </p>
          <Button
            onClick={() => {
              setSuccess(false);
              setDuplicateFound(false);
              setFormData({
                enrollmentNumber: '',
                name: '',
                email: '',
                course: '',
                password: '0777'
              });
            }}
          >
            Register Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Register New Student
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Enrollment Number *</Label>
            <Input
              value={formData.enrollmentNumber}
              onChange={(e) =>
                setFormData({ ...formData, enrollmentNumber: e.target.value })
              }
              onBlur={() => checkDuplicateStudent(formData.enrollmentNumber)}
              className="mt-2"
              placeholder="Enter enrollment number"
            />
            {checkingDuplicate && (
              <p className="text-xs text-muted-foreground mt-1">Checking duplicate...</p>
            )}
            {duplicateFound && (
              <p className="text-xs text-destructive mt-1">
                This enrollment number is already registered.
              </p>
            )}
          </div>

          <div>
            <Label>Full Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <Label>Course *</Label>
            <Input
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="mt-2"
              placeholder="Enter course name"
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-2"
              placeholder="Enter password"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Institute password for student login
            </p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading || checkingDuplicate || duplicateFound}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Registering...
            </span>
          ) : (
            'Register Student'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}