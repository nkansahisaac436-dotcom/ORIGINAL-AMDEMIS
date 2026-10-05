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
} from 'lucide-react';
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

  return (
    <AdminLayout
      adminName="District Administrator"
      activeRoundTitle={activeRound?.title || 'No Active Round'}
    >
      <div className="space-y-8">
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

        {/* First-Run Setup Checklist (Ticks automatically!) */}
        {!setupChecklist.is_first_run_complete && (
          <Card className="border-2 border-brand-gold/60 bg-amber-50/50 dark:bg-slate-900 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-extrabold flex items-center gap-2 text-brand-navy dark:text-brand-gold">
                  <Layers className="h-5 w-5 text-brand-gold" />
                  First-Run District System Setup Checklist
                </CardTitle>
                <Badge variant="gold" className="text-xs">
                  Action Required
                </Badge>
              </div>
              <CardDescription>
                Complete these initial steps to prepare AMDEMIS for district-wide annual data collection.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Step 1: Add Circuits */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    setupChecklist.circuits_created
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-800 border-slate-300'
                  }`}
                >
                  {setupChecklist.circuits_created ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">1. Add Circuits</span>
                    <span className="text-[11px] text-muted-foreground">
                      {setupChecklist.circuits_created
                        ? `${setupChecklist.circuits_count} circuits created`
                        : 'Create district circuits'}
                    </span>
                    {!setupChecklist.circuits_created && (
                      <Link
                        href="/admin/circuits"
                        className="text-[11px] font-bold text-brand-midBlue block mt-1 hover:underline"
                      >
                        Add Circuits →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Step 2: Add Schools & Assign */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    setupChecklist.schools_created
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-800 border-slate-300'
                  }`}
                >
                  {setupChecklist.schools_created ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">2. Add Schools</span>
                    <span className="text-[11px] text-muted-foreground">
                      {setupChecklist.schools_created
                        ? `${setupChecklist.schools_count} schools registered`
                        : 'Import or add schools'}
                    </span>
                    {!setupChecklist.schools_created && (
                      <Link
                        href="/admin/schools"
                        className="text-[11px] font-bold text-brand-midBlue block mt-1 hover:underline"
                      >
                        Add Schools →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Step 3: Generate PINs */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    setupChecklist.pins_generated
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-800 border-slate-300'
                  }`}
                >
                  {setupChecklist.pins_generated ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">3. Generate PINs</span>
                    <span className="text-[11px] text-muted-foreground">
                      {setupChecklist.pins_generated
                        ? 'Headteacher credentials generated'
                        : 'Print PIN slips'}
                    </span>
                    {!setupChecklist.pins_generated && (
                      <Link
                        href="/admin/schools"
                        className="text-[11px] font-bold text-brand-midBlue block mt-1 hover:underline"
                      >
                        Generate PINs →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Step 4: Open Round */}
                <div
                  className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                    setupChecklist.round_opened
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-white dark:bg-slate-800 border-slate-300'
                  }`}
                >
                  {setupChecklist.round_opened ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-xs font-bold block">4. Open Round</span>
                    <span className="text-[11px] text-muted-foreground">
                      {setupChecklist.round_opened
                        ? `Round "${activeRound?.title}" is open`
                        : 'Open collection window'}
                    </span>
                    {!setupChecklist.round_opened && (
                      <Link
                        href="/admin/rounds"
                        className="text-[11px] font-bold text-brand-midBlue block mt-1 hover:underline"
                      >
                        Open Round →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
      </div>
    </AdminLayout>
  );
}
