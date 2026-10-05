'use client';

import * as React from 'react';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StepItem } from './stepper';

interface SectionsOverviewProps {
  steps: StepItem[];
  deadlineDate?: string;
}

export function SectionsOverview({
  steps,
  deadlineDate = '10th October, 2026',
}: SectionsOverviewProps) {
  const getBadgeColor = (index: number) => {
    const colors = [
      'bg-blue-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-rose-600 text-white',
      'bg-cyan-600 text-white',
      'bg-indigo-600 text-white',
      'bg-purple-600 text-white',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Form Guide Box */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-brand-navy dark:text-brand-gold font-bold text-sm">
            <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" />
            </div>
            <span>Form Guide</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This form captures annual statistics on school enrolment, teachers, classrooms, and furniture for district educational planning.
          </p>
        </CardContent>
      </Card>

      {/* Sections Overview Box */}
      <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Sections Overview
          </h4>
          <div className="space-y-2.5">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-2.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${getBadgeColor(
                    idx
                  )}`}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{step.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {step.id === 'school_details' && 'Basic information & selected levels'}
                    {step.id === 'creche' && 'Crèche enrolment, teachers & furniture'}
                    {step.id === 'kg' && 'KG enrolment, teachers, classrooms & furniture'}
                    {step.id === 'primary' && 'BS1–BS6 enrolment, teachers per class & condition'}
                    {step.id === 'jhs' && 'JHS enrolment, subject teachers & infrastructure'}
                    {step.id === 'infrastructure' && 'School facilities & utilities ownership'}
                    {step.id === 'review' && 'Summary review & digital confirmation'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Yellow Important Note Box */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2 text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Important Note</span>
        </div>
        <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          Ensure all figures are accurate before submitting. You can edit before the deadline.
        </p>
        <p className="text-xs font-bold text-amber-950 dark:text-amber-100 pt-1">
          Deadline: {deadlineDate}
        </p>
      </div>
    </div>
  );
}
