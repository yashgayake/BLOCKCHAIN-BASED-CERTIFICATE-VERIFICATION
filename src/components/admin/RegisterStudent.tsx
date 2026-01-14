import { useState } from 'react';
import { UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBlockchain } from '@/contexts/BlockchainContext';
import { useAppContext } from '@/contexts/AppContext';
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

  const { service } = useBlockchain();
  const { addStudent } = useAppContext();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.enrollmentNumber || !formData.name || !formData.course) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const tx = await service.registerStudent(
        formData.enrollmentNumber, formData.name, formData.email, formData.course, formData.password
      );
      await tx.wait();

      addStudent({
        ...formData,
        registrationDate: new Date().toISOString()
      });

      setSuccess(true);
      toast({ title: "Success!", description: "Student registered on blockchain" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
          <p className="text-muted-foreground mb-4">Enrollment: {formData.enrollmentNumber}</p>
          <Button onClick={() => { setSuccess(false); setFormData({ enrollmentNumber: '', name: '', email: '', course: '', password: '0777' }); }}>
            Register Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Register New Student</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Enrollment Number *</Label><Input value={formData.enrollmentNumber} onChange={(e) => setFormData({...formData, enrollmentNumber: e.target.value})} className="mt-2" /></div>
          <div><Label>Full Name *</Label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-2" /></div>
          <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="mt-2" /></div>
          <div><Label>Course *</Label><Input value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})} className="mt-2" /></div>
          <div><Label>Password</Label><Input value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="mt-2" /><p className="text-xs text-muted-foreground mt-1">Institute password for student login</p></div>
        </div>
        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">{isLoading ? 'Registering...' : 'Register Student'}</Button>
      </CardContent>
    </Card>
  );
}
