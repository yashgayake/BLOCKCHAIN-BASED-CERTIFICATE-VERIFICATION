import { useState, useEffect } from 'react';
import { Users, Shield, GraduationCap, Eye, Loader2, Plus, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole } from '@/hooks/useAuth';

interface UserWithRoles {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  roles: AppRole[];
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-destructive text-destructive-foreground' },
  student: { label: 'Student', icon: GraduationCap, color: 'bg-primary text-primary-foreground' },
  verifier: { label: 'Verifier', icon: Eye, color: 'bg-accent text-accent-foreground' },
};

export function UserManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name');

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Map roles to users
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
        ...profile,
        roles: (allRoles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole),
      }));

      setUsers(usersWithRoles);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addRole = async (userId: string, role: AppRole) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Assigned',
            description: `User already has the ${role} role`,
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Role Added',
        description: `Successfully added ${role} role`,
      });
      fetchUsers();
    } catch (err: any) {
      console.error('Error adding role:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to add role',
        variant: 'destructive',
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const removeRole = async (userId: string, role: AppRole) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: 'Role Removed',
        description: `Successfully removed ${role} role`,
      });
      fetchUsers();
    } catch (err: any) {
      console.error('Error removing role:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove role',
        variant: 'destructive',
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Current Roles</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No roles</span>
                        ) : (
                          user.roles.map((role) => {
                            const config = roleConfig[role];
                            const Icon = config.icon;
                            return (
                              <Badge
                                key={role}
                                className={`${config.color} gap-1 cursor-pointer hover:opacity-80`}
                                onClick={() => removeRole(user.user_id, role)}
                                title="Click to remove"
                              >
                                <Icon className="h-3 w-3" />
                                {config.label}
                                <Trash2 className="h-3 w-3 ml-1" />
                              </Badge>
                            );
                          })
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedRole}
                          onValueChange={(value) => setSelectedRole(value as AppRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Add role" />
                          </SelectTrigger>
                          <SelectContent>
                            {(['admin', 'student', 'verifier'] as AppRole[])
                              .filter(role => !user.roles.includes(role))
                              .map((role) => {
                                const config = roleConfig[role];
                                const Icon = config.icon;
                                return (
                                  <SelectItem key={role} value={role}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (selectedRole) {
                              addRole(user.user_id, selectedRole as AppRole);
                              setSelectedRole('');
                            }
                          }}
                          disabled={!selectedRole || processingUser === user.user_id}
                        >
                          {processingUser === user.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Total Users: {users.length}</span>
          <span>•</span>
          <span>Admins: {users.filter(u => u.roles.includes('admin')).length}</span>
          <span>•</span>
          <span>Students: {users.filter(u => u.roles.includes('student')).length}</span>
          <span>•</span>
          <span>Verifiers: {users.filter(u => u.roles.includes('verifier')).length}</span>
        </div>
      </CardContent>
    </Card>
  );
}
