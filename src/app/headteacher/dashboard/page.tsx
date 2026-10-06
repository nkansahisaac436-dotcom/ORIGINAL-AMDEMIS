'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeadteacherLayout } from '@/components/layout/headteacher-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileEdit,
  Clock,
  CalendarDays,
  School,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bell,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

export default function HeadteacherDashboardPage() {
  const router = useRouter();
  const [context, setContext] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/headteacher/current-context');
        if (res.ok) {
          const data = await res.json();
          setContext(data);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const school = context?.school || {
    name: 'District Basic School',
    status: 'public',
    school_login_id: 'AMD-0042',
    circuits: { name: 'District Circuit' },
  };

  const round = context?.round;
  const submission = context?.submission;
  const status = submission?.status || 'not_started';

  // Calculate countdown to deadline if round exists
  const diffDays = round?.deadline
    ? Math.max(0, Math.ceil((new Date(round.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <HeadteacherLayout
      schoolName={school.name}
      roundTitle={round?.title || 'No Active Collection Round'}
      headteacherName={context?.headteacher_name || 'Headteacher'}
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 rounded-2xl bg-brand-navy text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>School Login ID: {school.school_login_id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {school.name}
            </h1>
            <p className="text-sm text-blue-200 max-w-2xl leading-relaxed">
              Annual data collection portal for the Atwima Mponua District Education Directorate. Please submit your statistics before the official deadline.
            </p>
          </div>
        </div>

        {/* Current Round Status KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Submission Status */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Submission Status
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5">
                {status === 'submitted' ? (
                  <Badge variant="success" className="text-sm py-1 px-3 gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Submitted
                  </Badge>
                ) : status === 'draft' ? (
                  <Badge variant="gold" className="text-sm py-1 px-3 gap-1.5">
                    <FileEdit className="h-4 w-4" />
                    Draft Saved
                  </Badge>
                ) : status === 'reopened' ? (
                  <Badge variant="destructive" className="text-sm py-1 px-3 gap-1.5">
                    <AlertCircle className="h-4 w-4" />
                    Reopened by Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm py-1 px-3 gap-1.5">
                    <Clock className="h-4 w-4" />
                    Not Started
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {status === 'submitted'
                  ? `Submitted on ${formatDateTime(submission.submitted_at)}. Your response is locked.`
                  : status === 'draft'
                  ? 'You have draft figures saved. You can continue filling anytime.'
                  : status === 'reopened'
                  ? `Submission reopened: ${submission.reopened_reason || 'Please update and resubmit.'}`
                  : 'You have not submitted data for this collection round yet.'}
              </p>
            </CardContent>
          </Card>

          {/* Deadline & Countdown */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Collection Deadline
              </span>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-brand-midBlue dark:text-brand-gold" />
                <span className="text-lg font-bold text-foreground">
                  {round?.deadline
                    ? new Date(round.deadline).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'No Active Round'}
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                <Clock className="h-3.5 w-3.5" />
                <span>{round ? `${diffDays} days remaining` : 'Collection closed'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Circuit Info */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                District Assignment
              </span>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-muted-foreground">Circuit:</span>
                <span className="font-bold text-foreground">{school.circuits?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-semibold capitalize text-foreground">{school.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">EMIS Code:</span>
                <span className="font-mono font-bold text-foreground">{school.emis_code || '1066329999'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Action Card */}
        <Card className="border-2 border-brand-midBlue/40 bg-white dark:bg-slate-900 shadow-md p-6 sm:p-8 rounded-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-midBlue dark:text-brand-gold">
                Annual Data Collection — {round?.title || 'Academic Cycle'}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
                {status === 'submitted'
                  ? 'Your Annual Submission is Complete'
                  : 'Start or Continue Your School EMIS Return'}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {status === 'submitted'
                  ? 'Thank you for submitting your school’s annual statistics on time. You can view or print your submission receipt below.'
                  : 'Complete your enrolment, teacher qualifications, classrooms condition, and furniture counts step-by-step.'}
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              {status === 'submitted' ? (
                <Button
                  onClick={() => router.push('/headteacher/submissions')}
                  className="w-full md:w-auto bg-brand-navy hover:bg-brand-midBlue text-white font-bold h-12 px-6"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>View Submission &amp; Slip</span>
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/headteacher/form')}
                  className="w-full md:w-auto bg-brand-gold hover:bg-brand-goldHover text-brand-navy font-bold text-base h-13 px-8 shadow-md border-b-4 border-brand-navy dark:border-yellow-600 flex items-center justify-center gap-2"
                >
                  <FileEdit className="h-5 w-5" />
                  <span>{status === 'draft' ? 'Continue Form' : 'Start School Form'}</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/headteacher/profile"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-midBlue dark:hover:border-brand-gold transition-all shadow-2xs space-y-1 block"
          >
            <School className="h-5 w-5 text-brand-midBlue dark:text-brand-gold mb-2" />
            <h3 className="text-sm font-bold text-foreground">My School Profile</h3>
            <p className="text-xs text-muted-foreground">View administrative records and update contact info.</p>
          </Link>

          <Link
            href="/headteacher/guidelines"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-midBlue dark:hover:border-brand-gold transition-all shadow-2xs space-y-1 block"
          >
            <FileText className="h-5 w-5 text-brand-midBlue dark:text-brand-gold mb-2" />
            <h3 className="text-sm font-bold text-foreground">EMIS Guidelines</h3>
            <p className="text-xs text-muted-foreground">Official definitions for classrooms, furniture, and age groups.</p>
          </Link>

          <Link
            href="/headteacher/help"
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-midBlue dark:hover:border-brand-gold transition-all shadow-2xs space-y-1 block"
          >
            <Bell className="h-5 w-5 text-brand-midBlue dark:text-brand-gold mb-2" />
            <h3 className="text-sm font-bold text-foreground">Planning Unit Support</h3>
            <p className="text-xs text-muted-foreground">Direct helpline and assistance for headteachers in Atwima Mponua.</p>
          </Link>
        </div>
      </div>
    </HeadteacherLayout>
  );
}
