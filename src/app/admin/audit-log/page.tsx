'use client';

import * as React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Clock, User, Shield } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAuditLogPage() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/audit-log');
        if (res.ok) {
          setLogs(await res.json());
        }
      } catch {
        toast.error('Failed to load audit logs');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const getActionBadge = (action: string) => {
    if (action.includes('PIN')) return <Badge variant="destructive">{action}</Badge>;
    if (action.includes('REOPEN')) return <Badge variant="gold">{action}</Badge>;
    if (action.includes('CREATE')) return <Badge variant="success">{action}</Badge>;
    return <Badge variant="secondary">{action}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">System Audit Log</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable audit trail of administrative operations, school edits, PIN resets, and submission re-openings.
          </p>
        </div>

        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Target Type</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 text-muted-foreground font-mono">
                          {formatDateTime(l.created_at)}
                        </td>
                        <td className="p-3.5">{getActionBadge(l.action)}</td>
                        <td className="p-3.5 uppercase font-semibold text-muted-foreground text-[10px]">
                          {l.target_type}
                        </td>
                        <td className="p-3.5 font-medium text-foreground">
                          {l.profiles?.full_name || 'System / Admin'}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                          {JSON.stringify(l.details || {})}
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
    </AdminLayout>
  );
}
