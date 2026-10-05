'use client';

import * as React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, ShieldCheck, UserCheck, Lock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Add User Modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState<'district_officer' | 'super_admin'>('district_officer');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      toast.error('Failed to load user accounts');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) {
      toast.error('All fields are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Officer account created successfully!');
      setModalOpen(false);
      setEmail('');
      setPassword('');
      setFullName('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Error creating officer account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">District Officers &amp; Administrators</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Super Admin panel: Provision accounts for Planning &amp; Statistics district officers.
            </p>
          </div>

          <Button
            onClick={() => setModalOpen(true)}
            className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold text-xs h-10 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add District Officer</span>
          </Button>
        </div>

        {/* Users Table */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email Address</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No officer accounts found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-foreground flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-brand-midBlue" />
                          <span>{u.full_name}</span>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">{u.email}</td>
                        <td className="p-3.5">
                          {u.role === 'super_admin' ? (
                            <Badge variant="gold" className="text-[10px]">
                              Super Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              District Officer
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-muted-foreground">
                          {formatDateTime(u.created_at)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-brand-navy dark:text-brand-gold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Add District Officer
            </DialogTitle>
            <DialogDescription>
              Create credentials for Directorate officers to manage circuits, rounds, and export data.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
            <Input
              label="Full Name & Title"
              required
              placeholder="e.g. Samuel Osei (District Statistics Officer)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <Input
              label="Email Address"
              type="email"
              required
              placeholder="e.g. s.osei@amdemis.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Initial Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Minimum 6 characters"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">Role Permissions</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                <option value="district_officer">
                  District Officer (Manage circuits, schools, view &amp; export data)
                </option>
                <option value="super_admin">
                  Super Admin (Full administrative control &amp; officer management)
                </option>
              </select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim() || !password || !fullName.trim()}
                className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Officer Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
