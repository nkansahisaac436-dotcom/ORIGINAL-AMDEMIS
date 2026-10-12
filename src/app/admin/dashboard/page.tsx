'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  Clock,
  School,
  FileCheck2,
  FileEdit,
  AlertCircle,
  Copy,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  MapPin,
  Building2,
  Armchair,
  GraduationCap,
  Users,
  Plus,
  Edit2,
  XCircle,
  CalendarDays,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { handleFieldFocus } from '@/hooks/use-visual-viewport';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [circuitFilter, setCircuitFilter] = React.useState('all');

  // Round Modal state (Create & Edit)
  const [roundModalOpen, setRoundModalOpen] = React.useState(false);
  const [editingRound, setEditingRound] = React.useState<any>(null);
  const [roundTitle, setRoundTitle] = React.useState('2026/2027 Academic Year');
  const [roundInstructions, setRoundInstructions] = React.useState(
    'Please complete your annual EMIS return accurately before the deadline.'
  );
  const [roundOpeningDate, setRoundOpeningDate] = React.useState(
    new Date().toISOString().split('T')[0]
  );
  const [roundDeadline, setRoundDeadline] = React.useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [isSubmittingRound, setIsSubmittingRound] = React.useState(false);

  // Extend Deadline Modal
  const [extendModalOpen, setExtendModalOpen] = React.useState(false);
  const [extendDeadlineVal, setExtendDeadlineVal] = React.useState('');
  const [isExtendingDeadline, setIsExtendingDeadline] = React.useState(false);

  // Close Round Confirm Modal
  const [closeModalOpen, setCloseModalOpen] = React.useState(false);
  const [isClosingRound, setIsClosingRound] = React.useState(false);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error('Failed to load overview data');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOverview();
  }, []);

  const metrics = data?.metrics || {
    totalSchools: 0,
    submitted: 0,
    draft: 0,
    notStarted: 0,
    completionRate: 0,
  };

  const setupChecklist = data?.setupChecklist || {
    circuits_created: false,
    circuits_count: 0,
    schools_created: false,
    schools_count: 0,
    pins_generated: false,
    round_opened: false,
  };

  const activeRound = data?.activeRound;
  const nonSubmitters = data?.nonSubmitters || [];

  const filteredNonSubmitters =
    circuitFilter === 'all'
      ? nonSubmitters
      : nonSubmitters.filter((s: any) => s.circuit_name === circuitFilter);

  const uniqueCircuits = Array.from(
    new Set(nonSubmitters.map((s: any) => s.circuit_name))
  ) as string[];

  const handleCopyReminder = (schoolName: string, phone: string) => {
    const roundTitle = activeRound?.title || 'Academic Year';
    const deadline = activeRound?.deadline
      ? new Date(activeRound.deadline).toLocaleDateString('en-GB')
      : 'the deadline';

    const text = `Dear Headteacher (${schoolName}), This is an urgent reminder from the Atwima Mponua District Directorate, Planning & Statistics Unit. Please submit your annual EMIS statistics for ${roundTitle} on AMDEMIS before ${deadline}. Thank you.`;

    navigator.clipboard.writeText(text);
    toast.success(`Copied reminder message for ${schoolName}!`);
  };

  const COLORS = ['#0A2A66', '#F2B705', '#10B981', '#EF4444', '#8B5CF6'];

  const handleOpenCreateRound = () => {
    setEditingRound(null);
    setRoundTitle('2026/2027 Academic Year');
    setRoundInstructions('Please complete your annual EMIS return accurately before the deadline.');
    setRoundOpeningDate(new Date().toISOString().split('T')[0]);
    setRoundDeadline(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setRoundModalOpen(true);
  };

  const handleOpenEditRound = () => {
    if (!activeRound) return;
    setEditingRound(activeRound);
    setRoundTitle(activeRound.title);
    setRoundInstructions(activeRound.instructions || '');
    setRoundOpeningDate(activeRound.opening_date ? activeRound.opening_date.split('T')[0] : '');
    setRoundDeadline(activeRound.deadline ? new Date(activeRound.deadline).toISOString().slice(0, 16) : '');
    setRoundModalOpen(true);
  };

  const handleSaveRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundTitle.trim() || !roundDeadline) {
      toast.error('Title and deadline are required');
      return;
    }

    setIsSubmittingRound(true);
    try {
      if (editingRound) {
        const res = await fetch('/api/admin/rounds', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingRound.id,
            title: roundTitle.trim(),
            instructions: roundInstructions.trim() || null,
            opening_date: roundOpeningDate,
            deadline: new Date(roundDeadline).toISOString(),
            is_active: true,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update round');
        }
        toast.success('Collection round updated successfully');
      } else {
        const res = await fetch('/api/admin/rounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: roundTitle.trim(),
            instructions: roundInstructions.trim() || null,
            opening_date: roundOpeningDate,
            deadline: new Date(roundDeadline).toISOString(),
            is_active: true,
            is_locked: false,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create round');
        }
        toast.success(`Collection round "${roundTitle}" created and activated!`);
      }
      setRoundModalOpen(false);
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Error saving collection round');
    } finally {
      setIsSubmittingRound(false);
    }
  };

  const handleExtendDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendDeadlineVal || !activeRound) return;
    setIsExtendingDeadline(true);
    try {
      const res = await fetch('/api/admin/rounds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeRound.id,
          action: 'extend_deadline',
          deadline: new Date(extendDeadlineVal).toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to extend deadline');
      }
      toast.success('Collection round deadline extended successfully');
      setExtendModalOpen(false);
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Error extending deadline');
    } finally {
      setIsExtendingDeadline(false);
    }
  };

  const handleCloseRound = async () => {
    if (!activeRound) return;
    setIsClosingRound(true);
    try {
      const res = await fetch('/api/admin/rounds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeRound.id,
          action: 'close',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to close round');
      }
      toast.success(`Collection round "${activeRound.title}" closed successfully`);
      setCloseModalOpen(false);
      fetchOverview();
    } catch (err: any) {
      toast.error(err.message || 'Error closing round');
    } finally {
      setIsClosingRound(false);
    }
  };

  return (
    <AdminLayout
      adminName="District Administrator"
      activeRoundTitle={activeRound?.title || 'No Active Round'}
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              District Planning &amp; Statistics Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Atwima Mponua District Education Directorate — Annual EMIS Monitoring
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/reports')}
              className="text-xs font-bold border-slate-300 dark:border-slate-700"
            >
              <Download className="h-4 w-4 mr-1.5" />
              <span>Export Reports</span>
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/admin/schools')}
              className="bg-brand-navy hover:bg-brand-midBlue text-white text-xs font-bold"
            >
              <School className="h-4 w-4 mr-1.5" />
              <span>Manage Schools</span>
            </Button>
          </div>
        </div>

        {/* Section E.1: Collection Round Banner (Active vs Inactive) */}
        {!activeRound ? (
          <Card className="border-2 border-brand-gold/70 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-900/90 shadow-md">
            <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs px-2.5 py-0.5">
                    No Active Collection Round
                  </Badge>
                  <span className="text-xs text-muted-foreground font-semibold">Submissions are currently closed</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-foreground">
                  No active collection round is open
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Schools cannot submit EMIS returns until a collection round is opened. Create one to begin annual data collection for the academic year.
                </p>
              </div>
              <Button
                onClick={handleOpenCreateRound}
                className="bg-brand-gold hover:bg-brand-goldHover text-brand-navy font-bold text-sm h-11 px-5 shadow shrink-0 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Collection Round</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-brand-midBlue bg-[#0A2A66] text-white shadow-md">
            <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVE COLLECTION ROUND
                  </span>
                  <span className="text-xs text-blue-200">
                    Opened: {activeRound.opening_date ? new Date(activeRound.opening_date).toLocaleDateString('en-GB') : 'N/A'}
                  </span>
                  <span className="text-xs text-brand-gold font-bold">
                    Deadline: {activeRound.deadline ? new Date(activeRound.deadline).toLocaleDateString('en-GB') : 'N/A'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {activeRound.title}
                </h2>
                {activeRound.instructions && (
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
                    {activeRound.instructions}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenEditRound}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  <span>Edit Round</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setExtendDeadlineVal(
                      activeRound.deadline
                        ? new Date(new Date(activeRound.deadline).getTime() + 7 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .slice(0, 16)
                        : ''
                    );
                    setExtendModalOpen(true);
                  }}
                  className="bg-brand-gold hover:bg-brand-goldHover text-brand-navy text-xs font-bold"
                >
                  <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                  <span>Extend Deadline</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setCloseModalOpen(true)}
                  className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1.5" />
                  <span>Close Round</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section E.4: Setup Checklist that ticks automatically (3 steps with button on each step) */}
        <Card className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-extrabold flex items-center gap-2 text-brand-navy dark:text-brand-gold">
                <Layers className="h-5 w-5 text-brand-gold" />
                District System Setup &amp; Readiness Checklist
              </CardTitle>
              <Badge variant={setupChecklist.is_first_run_complete ? 'success' : 'gold'} className="text-xs">
                {setupChecklist.is_first_run_complete ? 'Ready for Collection' : 'Setup In Progress'}
              </Badge>
            </div>
            <CardDescription>
              District monitoring readiness is automatically tracked based on registered circuits, schools, and active rounds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Step 1: Add Circuits */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  setupChecklist.circuits_created
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {setupChecklist.circuits_created ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">1. Add Circuits</span>
                    <span className="text-[11px] text-muted-foreground">
                      {setupChecklist.circuits_created
                        ? `${setupChecklist.circuits_count} circuits registered`
                        : 'Create district circuits'}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={setupChecklist.circuits_created ? 'outline' : 'default'}
                  onClick={() => router.push('/admin/circuits')}
                  className={`text-xs font-bold w-full ${
                    setupChecklist.circuits_created
                      ? 'border-emerald-300 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50'
                      : 'bg-brand-navy hover:bg-brand-midBlue text-white'
                  }`}
                >
                  {setupChecklist.circuits_created ? 'Manage Circuits' : 'Add Circuits'}
                </Button>
              </div>

              {/* Step 2: Add Schools & Issue PINs */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  setupChecklist.schools_created
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {setupChecklist.schools_created ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">2. Add Schools &amp; Issue PINs</span>
                    <span className="text-[11px] text-muted-foreground">
                      {setupChecklist.schools_created
                        ? `${setupChecklist.schools_count} schools registered & PINs issued`
                        : 'Add schools and generate login PINs'}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={setupChecklist.schools_created ? 'outline' : 'default'}
                  onClick={() => router.push('/admin/schools')}
                  className={`text-xs font-bold w-full ${
                    setupChecklist.schools_created
                      ? 'border-emerald-300 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50'
                      : 'bg-brand-navy hover:bg-brand-midBlue text-white'
                  }`}
                >
                  {setupChecklist.schools_created ? 'Manage Schools & PINs' : 'Add Schools & PINs'}
                </Button>
              </div>

              {/* Step 3: Create Collection Round */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  activeRound && activeRound.is_active
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-800 border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {activeRound && activeRound.is_active ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">3. Create Collection Round</span>
                    <span className="text-[11px] text-muted-foreground">
                      {activeRound && activeRound.is_active
                        ? `Active: ${activeRound.title}`
                        : 'Open annual EMIS collection window'}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={activeRound && activeRound.is_active ? 'outline' : 'default'}
                  onClick={() => {
                    if (activeRound && activeRound.is_active) {
                      router.push('/admin/rounds');
                    } else {
                      handleOpenCreateRound();
                    }
                  }}
                  className={`text-xs font-bold w-full ${
                    activeRound && activeRound.is_active
                      ? 'border-emerald-300 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50'
                      : 'bg-brand-gold hover:bg-brand-goldHover text-brand-navy'
                  }`}
                >
                  {activeRound && activeRound.is_active ? 'Manage Rounds' : 'Create Collection Round'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Total Schools
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  {metrics.totalSchools}
                </span>
                <School className="h-6 w-6 text-brand-midBlue opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Submitted
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {metrics.submitted}
                </span>
                <CheckCircle2 className="h-6 w-6 text-emerald-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                Draft In Progress
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                  {metrics.draft}
                </span>
                <FileEdit className="h-6 w-6 text-amber-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Not Started
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                  {metrics.notStarted}
                </span>
                <Clock className="h-6 w-6 text-rose-600 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-slate-800 bg-brand-navy text-white shadow-xs col-span-2 lg:col-span-1">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider block">
                District Completion
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-brand-gold">
                  {metrics.completionRate}%
                </span>
                <TrendingUp className="h-6 w-6 text-brand-gold opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1: Enrolment by Level & Gender and Enrolment by Circuit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enrolment by Level & Gender */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-midBlue" />
                Enrolment by Education Level &amp; Gender
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.charts?.enrolmentByLevel || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="level" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="boys" name="Boys" fill="#0A2A66" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="girls" name="Girls" fill="#F2B705" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Enrolment by Circuit */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-midBlue" />
                Total Pupils by District Circuit
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.charts?.enrolmentByCircuit || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="total" name="Total Enrolment" fill="#123B86" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Teachers & Classrooms & Infrastructure */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Teachers Training */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-brand-midBlue" />
                Teacher Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 flex flex-col items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.charts?.teachersTraining || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {(data?.charts?.teachersTraining || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Classroom Condition */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-midBlue" />
                Classrooms Condition
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.charts?.classroomCondition || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="condition" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Count" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure Availability */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-midBlue" />
                Facility Availability (%)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.charts?.infrastructure || []}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="facility" type="category" tick={{ fontSize: 9 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="percent" name="% Available" fill="#0A2A66" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Non-Submitters Follow-up Section */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-extrabold flex items-center gap-2 text-foreground">
                  <AlertCircle className="h-5 w-5 text-brand-error" />
                  Non-Submitters Follow-up List ({filteredNonSubmitters.length} Schools)
                </CardTitle>
                <CardDescription>
                  List of schools that have not finalized their submission for the active round. Copy personalized SMS reminders with one click.
                </CardDescription>
              </div>

              {/* Circuit Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-semibold">Filter Circuit:</span>
                <select
                  value={circuitFilter}
                  onChange={(e) => setCircuitFilter(e.target.value)}
                  className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  <option value="all">All Circuits ({nonSubmitters.length})</option>
                  {uniqueCircuits.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredNonSubmitters.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-foreground">All schools in this view have submitted!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-muted-foreground font-semibold">
                    <tr>
                      <th className="p-3">School Name</th>
                      <th className="p-3">Circuit</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Headteacher</th>
                      <th className="p-3">Phone Number</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredNonSubmitters.slice(0, 15).map((s: any) => (
                      <tr key={s.school_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-foreground">{s.school_name}</td>
                        <td className="p-3 text-muted-foreground">{s.circuit_name}</td>
                        <td className="p-3 capitalize">{s.status}</td>
                        <td className="p-3 font-medium">{s.headteacher_name}</td>
                        <td className="p-3 font-mono">{s.headteacher_phone}</td>
                        <td className="p-3">
                          {s.submission_status === 'draft' ? (
                            <Badge variant="gold" className="text-[10px]">
                              Draft Saved
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Not Started
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyReminder(s.school_name, s.headteacher_phone)}
                            className="text-[11px] h-8 border-slate-300 dark:border-slate-700 text-brand-navy dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 ml-auto"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Reminder</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal 1: Create / Edit Collection Round */}
        <Dialog open={roundModalOpen} onOpenChange={setRoundModalOpen}>
          <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
              <DialogHeader className="text-left">
                <DialogTitle className="flex items-center gap-2 text-brand-navy dark:text-brand-gold text-base sm:text-lg font-black">
                  <CalendarDays className="h-5 w-5 text-brand-gold shrink-0" />
                  <span>{editingRound ? 'Edit Collection Round' : 'Create Collection Round'}</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {editingRound
                    ? 'Update collection cycle parameters and guidance for headteachers.'
                    : 'Open a new annual EMIS return window for all schools across the district.'}
                </DialogDescription>
              </DialogHeader>
              <button
                type="button"
                onClick={() => setRoundModalOpen(false)}
                className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveRound}
              onFocusCapture={handleFieldFocus}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-4">
                <div>
                  <Input
                    label="Academic Year Title *"
                    required
                    autoFocus
                    enterKeyHint="next"
                    placeholder="e.g. 2026/2027 Academic Year"
                    value={roundTitle}
                    onChange={(e) => setRoundTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Instructions for Headteachers (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Instructions, guidelines, or notice for schools..."
                    value={roundInstructions}
                    onChange={(e) => setRoundInstructions(e.target.value)}
                    className="w-full text-base sm:text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 focus:outline-none focus:ring-2 focus:ring-brand-gold text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Opening Date *"
                      type="date"
                      required
                      enterKeyHint="next"
                      value={roundOpeningDate}
                      onChange={(e) => setRoundOpeningDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="Deadline *"
                      type="datetime-local"
                      required
                      enterKeyHint="done"
                      value={roundDeadline}
                      onChange={(e) => setRoundDeadline(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div
                className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
                style={{
                  bottom: 'var(--kb, 0px)',
                  paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
                }}
              >
                <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRoundModalOpen(false)}
                    disabled={isSubmittingRound}
                    className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingRound || !roundTitle.trim() || !roundDeadline}
                    className="h-11 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-midBlue text-white border-b-2 border-brand-gold w-full sm:w-auto"
                  >
                    {isSubmittingRound ? 'Saving...' : editingRound ? 'Save Changes' : 'Create & Activate Round'}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 2: Extend Deadline */}
        <Dialog open={extendModalOpen} onOpenChange={setExtendModalOpen}>
          <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
              <DialogHeader className="text-left">
                <DialogTitle className="flex items-center gap-2 text-brand-navy dark:text-brand-gold text-base sm:text-lg font-black">
                  <Clock className="h-5 w-5 text-brand-gold shrink-0" />
                  <span>Extend Collection Deadline</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Select a new submission deadline for &quot;{activeRound?.title}&quot;. Schools with drafts will be able to complete their submissions until the new date.
                </DialogDescription>
              </DialogHeader>
              <button
                type="button"
                onClick={() => setExtendModalOpen(false)}
                className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleExtendDeadline}
              onFocusCapture={handleFieldFocus}
              className="flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-4">
                <div>
                  <Input
                    label="New Deadline *"
                    type="datetime-local"
                    required
                    autoFocus
                    enterKeyHint="done"
                    value={extendDeadlineVal}
                    onChange={(e) => setExtendDeadlineVal(e.target.value)}
                  />
                </div>
              </div>

              <div
                className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
                style={{
                  bottom: 'var(--kb, 0px)',
                  paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
                }}
              >
                <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setExtendModalOpen(false)}
                    disabled={isExtendingDeadline}
                    className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isExtendingDeadline || !extendDeadlineVal}
                    className="h-11 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-[#0A2A66] w-full sm:w-auto"
                  >
                    {isExtendingDeadline ? 'Updating...' : 'Extend Deadline'}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal 3: Close Round Confirmation */}
        <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
          <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
              <DialogHeader className="text-left">
                <DialogTitle className="flex items-center gap-2 text-rose-600 text-base font-black">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>Close Collection Round?</span>
                </DialogTitle>
              </DialogHeader>
              <button
                type="button"
                onClick={() => setCloseModalOpen(false)}
                className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px]">
              <DialogDescription className="text-slate-600 dark:text-slate-300 pt-1 leading-relaxed text-xs">
                Are you sure you want to close &quot;{activeRound?.title}&quot;? Headteachers will immediately no longer be able to submit or edit their EMIS figures. This action locks all responses for final district reporting.
              </DialogDescription>
            </div>

            <div
              className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
              style={{
                bottom: 'var(--kb, 0px)',
                paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCloseModalOpen(false)}
                  disabled={isClosingRound}
                  className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCloseRound}
                  disabled={isClosingRound}
                  className="h-11 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto"
                >
                  {isClosingRound ? 'Closing...' : 'Yes, Close Round'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
