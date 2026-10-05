'use client';

import * as React from 'react';
import { HeadteacherLayout } from '@/components/layout/headteacher-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCheck2, Printer, Eye, Calendar, Users, Building2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { SubmissionReceiptModal } from '@/components/wizard/submission-receipt-modal';

export default function HeadteacherSubmissionsPage() {
  const [context, setContext] = React.useState<any>(null);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<any>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/headteacher/current-context');
        if (res.ok) {
          const data = await res.json();
          setContext(data);
        }
      } catch {}
    }
    load();
  }, []);

  const school = context?.school || { name: 'Atwima Mponua Basic School' };
  const submission = context?.submission;

  const handleOpenSlip = () => {
    if (!submission) return;
    setReceiptData({
      submissionId: submission.id,
      submittedAt: submission.submitted_at || new Date().toISOString(),
      schoolName: school.name,
      circuitName: school.circuits?.name || 'Circuit',
      emisCode: submission.emis_code || school.emis_code || '1066329999',
      roundTitle: context?.round?.title || 'Academic Year',
      totalPupils: 342,
      totalTeachers: submission.total_teachers || 12,
    });
    setReceiptOpen(true);
  };

  return (
    <HeadteacherLayout
      schoolName={school.name}
      roundTitle={context?.round?.title || '2025/2026 Academic Year'}
      headteacherName={context?.headteacher_name || 'Headteacher'}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Submissions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            History and status of annual statistical returns submitted by this school.
          </p>
        </div>

        {!submission ? (
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-12">
            <CardContent className="space-y-3">
              <FileCheck2 className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Submissions Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Your school has not yet submitted an annual data return for the active collection round.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base text-foreground font-bold">
                    {context?.round?.title || '2025/2026 Academic Year'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {formatDateTime(submission.submitted_at)}
                  </p>
                </div>
                <Badge variant="success" className="text-xs px-3 py-1">
                  Submitted &amp; Verified
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Teachers</span>
                    <span className="font-bold text-foreground text-sm">{submission.total_teachers}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Male Teachers</span>
                    <span className="font-semibold text-foreground">{submission.male_teachers}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Female Teachers</span>
                    <span className="font-semibold text-foreground">{submission.female_teachers}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">Headteacher</span>
                    <span className="font-semibold text-foreground">{submission.headteacher_name}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenSlip}
                    className="flex items-center gap-1.5 text-xs font-bold border-slate-300 dark:border-slate-700"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Official Receipt</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {receiptData && (
        <SubmissionReceiptModal
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          submissionId={receiptData.submissionId}
          submittedAt={receiptData.submittedAt}
          schoolName={receiptData.schoolName}
          circuitName={receiptData.circuitName}
          emisCode={receiptData.emisCode}
          roundTitle={receiptData.roundTitle}
          totalPupils={receiptData.totalPupils}
          totalTeachers={receiptData.totalTeachers}
        />
      )}
    </HeadteacherLayout>
  );
}
