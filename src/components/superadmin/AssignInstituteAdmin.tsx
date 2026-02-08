import { useState, useEffect } from 'react';
import { UserCog, Loader2, Search, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Institute {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  institute_id: string | null;
}

interface InstituteAdmin {
  user_id: string;
  email: string | null;
  full_name: string | null;
  institute_name: string;
  institute_code: string;
  institute_id: string;
}

export function AssignInstituteAdmin() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<InstituteAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [instRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from('institutes').select('id, name, code, is_active').eq('is_active', true),
        supabase.from('profiles').select('id, user_id, email, full_name, institute_id'),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      if (instRes.error) throw instRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setInstitutes(instRes.data || []);
      setUsers(profilesRes.data || []);

      // Build admin list
      const instituteAdminRoles = (rolesRes.data || []).filter(r => r.role === 'institute_admin');
      const adminList: InstituteAdmin[] = [];

      for (const role of instituteAdminRoles) {
        const profile = (profilesRes.data || []).find(p => p.user_id === role.user_id);
        if (profile && profile.institute_id) {
          const inst = (instRes.data || []).find(i => i.id === profile.institute_id);
          if (inst) {
            adminList.push({
              user_id: role.user_id,
              email: profile.email,
              full_name: profile.full_name,
              institute_name: inst.name,
              institute_code: inst.code,
              institute_id: inst.id,
            });
          }
        }
      }

      setAdmins(adminList);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async () => {
    if (!selectedUser || !selectedInstitute) {
      toast({ title: 'Error', description: 'Select both a user and an institute', variant: 'destructive' });
      return;
    }

    setIsAssigning(true);
    try {
      // 1. Set institute_id on profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ institute_id: selectedInstitute })
        .eq('user_id', selectedUser);

      if (profileError) throw profileError;

      // 2. Add institute_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser, role: 'institute_admin' });

      if (roleError) {
        if (roleError.code === '23505') {
          toast({ title: 'Already Assigned', description: 'User already has institute_admin role', variant: 'destructive' });
        } else {
          throw roleError;
        }
      } else {
        toast({ title: 'Success', description: 'Institute admin assigned successfully' });
      }

      setSelectedUser('');
      setSelectedInstitute('');
      fetchData();
    } catch (err: any) {
      console.error('Error assigning admin:', err);
      toast({ title: 'Error', description: err.message || 'Failed to assign', variant: 'destructive' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevoke = async (userId: string, instituteId: string) => {
    if (!confirm('Are you sure you want to revoke this admin assignment?')) return;
    try {
      // Remove role
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'institute_admin');

      if (roleError) throw roleError;

      // Clear institute_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ institute_id: null })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({ title: 'Revoked', description: 'Institute admin access removed' });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const filteredAdmins = admins.filter(a =>
    a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.institute_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Users who don't already have institute_admin role
  const availableUsers = users.filter(u =>
    !admins.some(a => a.user_id === u.user_id)
  );

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Assign Institute Admins</CardTitle>
            <CardDescription>Link users to institutes as administrators</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assign Form */}
        <div className="rounded-lg border p-4 space-y-4">
          <h3 className="font-medium text-sm">New Assignment</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map(u => (
                  <SelectItem key={u.user_id} value={u.user_id}>
                    {u.full_name || u.email || 'Unknown user'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedInstitute} onValueChange={setSelectedInstitute}>
              <SelectTrigger>
                <SelectValue placeholder="Select institute..." />
              </SelectTrigger>
              <SelectContent>
                {institutes.map(i => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name} ({i.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleAssign} disabled={isAssigning || !selectedUser || !selectedInstitute} className="gap-2">
              {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Assign
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search admins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Admins Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Institute</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No institute admins assigned yet
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                  <TableRow key={`${admin.user_id}-${admin.institute_id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{admin.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{admin.institute_name}</span>
                        <Badge variant="outline" className="font-mono text-xs">{admin.institute_code}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevoke(admin.user_id, admin.institute_id)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          Total: {admins.length} institute admin(s) across {new Set(admins.map(a => a.institute_id)).size} institute(s)
        </p>
      </CardContent>
    </Card>
  );
}
