import { useState } from 'react';
import { Shield, Building2, UserCog, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { SuperAdminStats } from '@/components/superadmin/SuperAdminStats';
import { InstituteManagement } from '@/components/superadmin/InstituteManagement';
import { AssignInstituteAdmin } from '@/components/superadmin/AssignInstituteAdmin';
import { UserManagement } from '@/components/admin/UserManagement';
import { useAuth } from '@/hooks/useAuth';

type DashboardAction = 'institutes' | 'assign-admins' | 'users' | null;

export default function SuperAdminDashboard() {
  const [currentAction, setCurrentAction] = useState<DashboardAction>(null);
  const { user, signOut } = useAuth();

  const actions = [
    {
      id: 'institutes' as const,
      icon: Building2,
      title: 'Manage Institutes',
      description: 'Create, edit, activate/deactivate registered institutes',
    },
    {
      id: 'assign-admins' as const,
      icon: UserCog,
      title: 'Assign Institute Admins',
      description: 'Link users to institutes as administrators',
    },
    {
      id: 'users' as const,
      icon: Users,
      title: 'User & Role Management',
      description: 'View all users and manage their roles globally',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Global system management — institutes, admins, and roles
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm">
              <span className="text-primary font-medium">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <SuperAdminStats />
        </div>

        {/* Actions */}
        {currentAction === null ? (
          <div className="grid gap-6 md:grid-cols-3">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.id}
                  className="glass-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  onClick={() => setCurrentAction(action.id)}
                >
                  <CardHeader>
                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{action.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{action.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <Button variant="outline" onClick={() => setCurrentAction(null)} className="gap-2">
              ← Back to Dashboard
            </Button>

            {currentAction === 'institutes' && <InstituteManagement />}
            {currentAction === 'assign-admins' && <AssignInstituteAdmin />}
            {currentAction === 'users' && <UserManagement />}
          </div>
        )}
      </div>
    </div>
  );
}
