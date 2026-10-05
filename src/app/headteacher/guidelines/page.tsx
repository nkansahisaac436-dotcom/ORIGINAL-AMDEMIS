'use client';

import * as React from 'react';
import { HeadteacherLayout } from '@/components/layout/headteacher-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle, HelpCircle, AlertTriangle } from 'lucide-react';

export default function GuidelinesPage() {
  return (
    <HeadteacherLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">EMIS Data Collection Guidelines</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Standard definitions and rules set by the Planning &amp; Statistics Unit, Ghana Education Service.
          </p>
        </div>

        {/* EMIS Code Guide */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <BookOpen className="h-4 w-4" />
              1. School EMIS Code &amp; Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              Please use the official 10-digit <strong>New EMIS Code</strong> assigned to your school.
            </p>
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-brand-navy dark:text-blue-300">
              <strong>Notice for Unassigned Schools:</strong> Schools without an assigned EMIS code must enter the placeholder code: <code className="font-mono font-bold bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded">1066329999</code>.
            </div>
          </CardContent>
        </Card>

        {/* Classroom Condition Definitions */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <BookOpen className="h-4 w-4" />
              2. Classrooms Condition Definitions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <span className="font-bold text-foreground block mb-1">Permanent Classrooms</span>
                <span>Structures built with cement block, brick, or stone with concrete foundation and roof.</span>
              </div>
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">GOOD Condition</span>
                <span>Classrooms with intact roof, secure doors/windows, and no structural wall cracks.</span>
              </div>
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">DILAPIDATED Condition</span>
                <span>Structures with leaking roofs, cracked walls, broken flooring, or imminent safety hazards.</span>
              </div>
            </div>
            <p className="text-[11px] italic">
              * Note: The number of Good condition + Dilapidated classrooms cannot exceed Total Permanent classrooms.
            </p>
          </CardContent>
        </Card>

        {/* Furniture Definitions */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <BookOpen className="h-4 w-4" />
              3. Pupil Furniture Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <ul className="list-disc list-inside space-y-1.5 pl-1">
              <li><strong>Mono Desk:</strong> Single-seat desk with attached or detached individual chair.</li>
              <li><strong>Dual Desk:</strong> Two-seater desk with shared bench or table surface.</li>
              <li><strong>Others:</strong> Benches, plastic preschool chairs, hexagonal group tables, etc.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Age group rules */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <BookOpen className="h-4 w-4" />
              4. Age Bracket Enrolment Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              Age-based counts represent specific target planning brackets and cannot exceed the total number of pupils enrolled in the corresponding class for that gender.
            </p>
          </CardContent>
        </Card>
      </div>
    </HeadteacherLayout>
  );
}
