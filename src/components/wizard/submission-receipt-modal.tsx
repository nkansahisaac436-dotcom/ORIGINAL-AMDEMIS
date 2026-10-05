'use client';

import * as React from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Printer, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/utils';

interface SubmissionReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submissionId: string;
  submittedAt: string;
  schoolName: string;
  circuitName: string;
  emisCode: string;
  roundTitle: string;
  totalPupils: number;
  totalTeachers: number;
}

export function SubmissionReceiptModal({
  open,
  onOpenChange,
  submissionId,
  submittedAt,
  schoolName,
  circuitName,
  emisCode,
  roundTitle,
  totalPupils,
  totalTeachers,
}: SubmissionReceiptModalProps) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  const handleDone = () => {
    onOpenChange(false);
    router.push('/headteacher/dashboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Printable Receipt Container */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-white dark:bg-slate-900 text-foreground space-y-6">
          {/* Header with Coat of Arms */}
          <div className="flex flex-col items-center text-center space-y-2 border-b-2 border-brand-gold pb-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden">
              <Image
                src="/branding/coat_of_arms.png"
                alt="Ghana Coat of Arms"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-brand-navy dark:text-brand-gold">
                Atwima Mponua District Education Directorate
              </h2>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                Planning &amp; Statistics Unit
              </p>
              <h3 className="text-base font-extrabold text-foreground mt-1">
                Official Submission Receipt
              </h3>
            </div>
          </div>

          {/* Success Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold block">Annual Statistics Successfully Submitted!</span>
              <span>Your data is recorded in the central district database.</span>
            </div>
          </div>

          {/* Key Receipt Fields */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">School Name</span>
              <span className="font-bold text-foreground">{schoolName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Circuit</span>
              <span className="font-semibold text-foreground">{circuitName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">EMIS Code</span>
              <span className="font-mono font-semibold text-foreground">{emisCode}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Collection Round</span>
              <span className="font-semibold text-foreground">{roundTitle}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Enrolment</span>
              <span className="font-extrabold text-brand-navy dark:text-brand-gold text-sm">{totalPupils} Pupils</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Total Teachers</span>
              <span className="font-extrabold text-brand-navy dark:text-brand-gold text-sm">{totalTeachers} Teachers</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Submitted Date &amp; Time</span>
              <span className="font-semibold text-foreground">{formatDateTime(submittedAt)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Reference Receipt ID</span>
              <span className="font-mono text-[11px] text-muted-foreground">{submissionId}</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[10px] text-muted-foreground">
            <p>Official Record of the Atwima Mponua District Education Directorate.</p>
            <p>Retain this receipt as proof of annual statistical submission.</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 no-print">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 border-slate-300 dark:border-slate-700 font-semibold"
            >
              <Printer className="h-4 w-4" />
              <span>Print Slip</span>
            </Button>
            <Button
              type="button"
              onClick={handleDone}
              className="w-full sm:w-1/2 bg-brand-navy hover:bg-brand-midBlue text-white font-bold flex items-center justify-center gap-2"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
