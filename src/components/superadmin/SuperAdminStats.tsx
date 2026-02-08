import { useState, useEffect } from 'react';
import { Building2, Users, Shield, GraduationCap, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalInstitutes: number;
  activeInstitutes: number;
  totalUsers: number;
  instituteAdmins: number;
  students: number;
}

export function SuperAdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [instRes, profilesRes, rolesRes] = await Promise.all([
          supabase.from('institutes').select('id, is_active'),
          supabase.from('profiles').select('id'),
          supabase.from('user_roles').select('role'),
        ]);

        const institutes = instRes.data || [];
        const profiles = profilesRes.data || [];
        const roles = rolesRes.data || [];

        setStats({
          totalInstitutes: institutes.length,
          activeInstitutes: institutes.filter(i => i.is_active).length,
          totalUsers: profiles.length,
          instituteAdmins: roles.filter(r => r.role === 'institute_admin').length,
          students: roles.filter(r => r.role === 'student').length,
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { label: 'Total Institutes', value: stats.totalInstitutes, sub: `${stats.activeInstitutes} active`, icon: Building2, color: 'text-blue-500' },
    { label: 'Total Users', value: stats.totalUsers, sub: 'registered', icon: Users, color: 'text-green-500' },
    { label: 'Institute Admins', value: stats.instituteAdmins, sub: 'assigned', icon: Shield, color: 'text-orange-500' },
    { label: 'Students', value: stats.students, sub: 'enrolled', icon: GraduationCap, color: 'text-purple-500' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold mt-1">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
