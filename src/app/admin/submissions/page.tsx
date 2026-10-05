'use client';

import * as React from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  FileSpreadsheet,
  Eye,
  RotateCcw,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  School,
  Calendar,
  Users,
  Building2,
  Armchair,
  BookOpen,
} from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [circuits, setCircuits] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Filters
  const [search, setSearch] = React.useState('');
  const [circuitFilter, setCircuitFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  // Drilldown Modal
  const [selectedSub, setSelectedSub] = React.useState<any>(null);
  const [drilldownOpen, setDrilldownOpen] = React.useState(false);

  // Reopen Modal
  const [reopenModalOpen, setReopenModalOpen] = React.useState(false);
  const [subToReopen, setSubToReopen] = React.useState<any>(null);
  const [reopenReason, setReopenReason] = React.useState('');
  const [isReopening, setIsReopening] = React.useState(false);

  const fetchSubmissions = async () => {
    try {
      const [subsRes, circuitsRes] = await Promise.all([
        fetch('/api/admin/submissions'),
        fetch('/api/admin/circuits'),
      ]);

      if (subsRes.ok) setSubmissions(await subsRes.json());
      if (circuitsRes.ok) setCircuits(await circuitsRes.json());
    } catch {
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleOpenDrilldown = async (subId: string) => {
    try {
      const res = await fetch(`/api/admin/submissions?id=${subId}`);
      if (res.ok) {
        const fullSub = await res.json();
        setSelectedSub(fullSub);
        setDrilldownOpen(true);
      }
    } catch {
      toast.error('Failed to load submission details');
    }
  };

  const handleReopenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subToReopen) return;

    setIsReopening(true);
    try {
      const res = await fetch('/api/admin/submissions/reopen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: subToReopen.id,
          reason: reopenReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Submission reopened for headteacher editing!');
      setReopenModalOpen(false);
      setReopenReason('');
      setSubToReopen(null);
      fetchSubmissions();
      if (drilldownOpen) setDrilldownOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Error reopening submission');
    } finally {
      setIsReopening(false);
    }
  };

  const filtered = submissions.filter((s) => {
    const sName = s.schools?.name || '';
    const loginId = s.schools?.school_login_id || '';
    const matchesSearch =
      sName.toLowerCase().includes(search.toLowerCase()) ||
      loginId.toLowerCase().includes(search.toLowerCase());

    const matchesCircuit = circuitFilter === 'all' || s.schools?.circuit_id === circuitFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesCircuit && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Annual Data Submissions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review submitted statistical returns, inspect figures, print slips, and reopen for corrections.
            </p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search school name, Login ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          <select
            value={circuitFilter}
            onChange={(e) => setCircuitFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="all">All Circuits</option>
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft Saved</option>
            <option value="reopened">Reopened</option>
          </select>
        </div>

        {/* Submissions Table */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">School Name</th>
                    <th className="p-3.5">Circuit</th>
                    <th className="p-3.5">Collection Round</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Total Teachers</th>
                    <th className="p-3.5">Submitted Date</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No submissions matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3.5">
                          <span className="font-bold text-foreground block">{s.schools?.name}</span>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {s.schools?.school_login_id}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{s.schools?.circuits?.name || 'Circuit'}</td>
                        <td className="p-3.5 font-semibold text-foreground">{s.rounds?.title}</td>
                        <td className="p-3.5">
                          {s.status === 'submitted' ? (
                            <Badge variant="success" className="text-[10px]">
                              Submitted
                            </Badge>
                          ) : s.status === 'draft' ? (
                            <Badge variant="gold" className="text-[10px]">
                              Draft
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Reopened
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 font-semibold text-foreground">{s.total_teachers}</td>
                        <td className="p-3.5 text-muted-foreground">
                          {s.submitted_at ? formatDateTime(s.submitted_at) : 'In Progress'}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDrilldown(s.id)}
                            className="h-8 text-[11px] font-semibold border-slate-300 dark:border-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            <span>View</span>
                          </Button>
                          {s.status === 'submitted' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSubToReopen(s);
                                setReopenReason('');
                                setReopenModalOpen(true);
                              }}
                              className="h-8 text-[11px] font-semibold text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              <span>Reopen</span>
                            </Button>
                          )}
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

      {/* Drill-down / Full Submission Modal (Printable) */}
      <Dialog open={drilldownOpen} onOpenChange={setDrilldownOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <div id="drilldown-printable-summary" className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900 text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-brand-gold pb-4">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
                  <Image
                    src="/branding/coat_of_arms.png"
                    alt="Ghana Coat of Arms"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-brand-navy dark:text-brand-gold">
                    Atwima Mponua District Education Directorate
                  </h3>
                  <p className="text-[11px] text-muted-foreground uppercase">
                    Planning &amp; Statistics Unit — Official Annual EMIS Return
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 no-print">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs font-bold"
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  <span>Print Summary</span>
                </Button>
                {selectedSub?.status === 'submitted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSubToReopen(selectedSub);
                      setReopenReason('');
                      setReopenModalOpen(true);
                    }}
                    className="text-xs font-bold text-amber-700 border-amber-300"
                  >
                    <RotateCcw className="h-4 w-4 mr-1.5" />
                    <span>Reopen Return</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Core School Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">School Name</span>
                <span className="font-bold text-foreground text-sm">{selectedSub?.schools?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Circuit</span>
                <span className="font-semibold text-foreground">{selectedSub?.schools?.circuits?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Login ID</span>
                <span className="font-mono font-bold text-foreground">{selectedSub?.schools?.school_login_id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">EMIS Code</span>
                <span className="font-mono font-semibold text-foreground">{selectedSub?.emis_code || selectedSub?.schools?.emis_code || '1066329999'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Headteacher</span>
                <span className="font-semibold text-foreground">{selectedSub?.headteacher_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Headteacher Phone</span>
                <span className="font-mono text-foreground">{selectedSub?.headteacher_phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Teachers</span>
                <span className="font-extrabold text-foreground">{selectedSub?.total_teachers} ({selectedSub?.male_teachers} M, {selectedSub?.female_teachers} F)</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Status</span>
                <span className="font-bold uppercase text-emerald-600">{selectedSub?.status}</span>
              </div>
            </div>

            {/* Enrolment Summary by Class */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="h-4 w-4 text-brand-midBlue" />
                Enrolment Distribution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(selectedSub?.enrolment || [])
                  .filter((e: any) => e.age_band === 'all')
                  .map((e: any) => (
                    <div key={e.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                      <span className="font-bold block uppercase text-[10px] text-muted-foreground">
                        {e.level.toUpperCase()} - {e.class_name} ({e.gender})
                      </span>
                      <span className="font-bold text-sm text-foreground">{e.count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Classrooms and Furniture */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border space-y-2">
                <span className="font-bold text-foreground block text-xs flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-brand-midBlue" />
                  Classrooms Breakdown
                </span>
                {(selectedSub?.classrooms || []).map((c: any) => (
                  <div key={c.id} className="flex justify-between border-b pb-1 text-[11px]">
                    <span className="uppercase font-bold text-muted-foreground">{c.level}:</span>
                    <span>
                      {c.permanent} Perm ({c.good_condition} Good, {c.dilapidated} Dilap, {c.under_tree} Tree)
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border space-y-2">
                <span className="font-bold text-foreground block text-xs flex items-center gap-1.5">
                  <Armchair className="h-4 w-4 text-brand-midBlue" />
                  Furniture Counts
                </span>
                {(selectedSub?.furniture || []).map((f: any) => (
                  <div key={f.id} className="flex justify-between border-b pb-1 text-[11px]">
                    <span className="capitalize">{f.level} - {f.furniture_type.replace('_', ' ')}:</span>
                    <span className="font-bold">{f.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reopen Reason Modal */}
      <Dialog open={reopenModalOpen} onOpenChange={setReopenModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-brand-error flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reopen School Submission
            </DialogTitle>
            <DialogDescription>
              Reopening will allow <strong>{subToReopen?.schools?.name}</strong> to edit and re-submit their figures.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReopenSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Reason for Reopening (Visible to Headteacher) <span className="text-brand-error">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Please update the BS3 teacher qualifications and re-submit."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="flex w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReopenModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isReopening || !reopenReason.trim()}
                className="bg-brand-error hover:bg-red-700 text-white font-bold"
              >
                {isReopening ? 'Reopening...' : 'Confirm & Reopen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
