import { useState, useEffect } from 'react';
import { Building2, Plus, Pencil, Trash2, Loader2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Institute {
  id: string;
  name: string;
  code: string;
  address: string | null;
  contact_email: string | null;
  is_active: boolean;
  created_at: string;
}

interface InstituteForm {
  name: string;
  code: string;
  address: string;
  contact_email: string;
}

const emptyForm: InstituteForm = { name: '', code: '', address: '', contact_email: '' };

export function InstituteManagement() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<InstituteForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchInstitutes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('institutes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstitutes(data || []);
    } catch (err: any) {
      console.error('Error fetching institutes:', err);
      toast({ title: 'Error', description: 'Failed to load institutes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchInstitutes(); }, []);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({ title: 'Error', description: 'Name and Code are required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('institutes')
          .update({
            name: formData.name,
            code: formData.code.toUpperCase(),
            address: formData.address || null,
            contact_email: formData.contact_email || null,
          })
          .eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Institute updated successfully' });
      } else {
        const { error } = await supabase
          .from('institutes')
          .insert({
            name: formData.name,
            code: formData.code.toUpperCase(),
            address: formData.address || null,
            contact_email: formData.contact_email || null,
          });
        if (error) {
          if (error.code === '23505') {
            toast({ title: 'Duplicate', description: 'Institute code already exists', variant: 'destructive' });
            return;
          }
          throw error;
        }
        toast({ title: 'Created', description: 'Institute created successfully' });
      }

      setFormData(emptyForm);
      setEditingId(null);
      setIsDialogOpen(false);
      fetchInstitutes();
    } catch (err: any) {
      console.error('Error saving institute:', err);
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (institute: Institute) => {
    try {
      const { error } = await supabase
        .from('institutes')
        .update({ is_active: !institute.is_active })
        .eq('id', institute.id);
      if (error) throw error;
      toast({
        title: institute.is_active ? 'Deactivated' : 'Activated',
        description: `${institute.name} is now ${institute.is_active ? 'inactive' : 'active'}`,
      });
      fetchInstitutes();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('institutes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: `${name} has been removed` });
      fetchInstitutes();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openEdit = (inst: Institute) => {
    setFormData({
      name: inst.name,
      code: inst.code,
      address: inst.address || '',
      contact_email: inst.contact_email || '',
    });
    setEditingId(inst.id);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const filtered = institutes.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.code.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Institute Management</CardTitle>
              <CardDescription>Create and manage registered institutes</CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Add Institute
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Institute' : 'Create New Institute'}</DialogTitle>
                <DialogDescription>
                  {editingId ? 'Update institute details' : 'Add a new institute to the system'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Institute Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Maharashtra Institute of Technology"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Institute Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., MIT"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Unique code, auto-uppercased</p>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g., Pune, Maharashtra"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="e.g., admin@mit.edu"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Institute</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {institutes.length === 0 ? 'No institutes yet. Create your first one!' : 'No matching institutes'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inst) => (
                  <TableRow key={inst.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{inst.name}</p>
                        {inst.address && <p className="text-sm text-muted-foreground">{inst.address}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{inst.code}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inst.contact_email || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inst.is_active ? 'default' : 'secondary'}>
                        {inst.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(inst)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => toggleActive(inst)} title={inst.is_active ? 'Deactivate' : 'Activate'}>
                          {inst.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(inst.id, inst.name)} title="Delete" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          Total: {institutes.length} institutes ({institutes.filter(i => i.is_active).length} active)
        </p>
      </CardContent>
    </Card>
  );
}
