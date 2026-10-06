'use client';

import * as React from 'react';
import { FormWizardState, School } from '@/types';
import { calculateTotals, getValidationWarnings } from '@/lib/schemas/submission';
import { getLevelName } from '@/lib/levels-config';
import { getSchoolTotals } from '@/lib/enrolment-totals';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  School as SchoolIcon,
  Users,
  GraduationCap,
  Building2,
  Armchair,
  Send,
} from 'lucide-react';

interface StepReviewProps {
  formData: FormWizardState;
  schoolInfo?: Partial<School>;
  onConfirmChange: (confirmed: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  onNavigateToStep: (stepId: string) => void;
}

export function StepReview({
  formData,
  schoolInfo,
  onConfirmChange,
  onSubmit,
  isSubmitting,
  onNavigateToStep,
}: StepReviewProps) {
  const totals = calculateTotals(formData);
  const warnings = getValidationWarnings(formData);
  const chosenLevels = formData.school_details.chosen_levels || [];

  // Check blocking validation issues
  const blockingErrors: { message: string; stepId: string }[] = [];

  // School Details validation
  if (!formData.school_details.emis_code) {
    blockingErrors.push({ message: 'EMIS Code is required', stepId: 'school_details' });
  }
  if (!formData.school_details.headteacher_name) {
    blockingErrors.push({ message: 'Headteacher full name is required', stepId: 'school_details' });
  }
  if (!formData.school_details.headteacher_phone) {
    blockingErrors.push({ message: 'Headteacher phone number is required', stepId: 'school_details' });
  }
  const totalT = Number(formData.school_details.total_teachers) || 0;
  const maleT = Number(formData.school_details.male_teachers) || 0;
  const femaleT = Number(formData.school_details.female_teachers) || 0;
  if (maleT + femaleT !== totalT) {
    blockingErrors.push({
      message: `Total teachers (${totalT}) must equal Male (${maleT}) + Female (${femaleT})`,
      stepId: 'school_details',
    });
  }

  // KG Validation
  if (chosenLevels.includes('kg')) {
    const kg = formData.kg;
    const kgClassT = (Number(kg.teachers.kg1_teachers) || 0) + (Number(kg.teachers.kg2_teachers) || 0);
    const kgTrainT =
      (Number(kg.teachers.trained_male) || 0) +
      (Number(kg.teachers.trained_female) || 0) +
      (Number(kg.teachers.untrained_male) || 0) +
      (Number(kg.teachers.untrained_female) || 0);
    if (kgClassT !== kgTrainT) {
      blockingErrors.push({
        message: `KG class teachers (${kgClassT}) must match Trained + Untrained breakdown (${kgTrainT})`,
        stepId: 'kg',
      });
    }
  }

  // Primary Validation
  if (chosenLevels.includes('primary')) {
    const p = formData.primary;
    const pClassT =
      (Number(p.teachers_per_class.bs1) || 0) +
      (Number(p.teachers_per_class.bs2) || 0) +
      (Number(p.teachers_per_class.bs3) || 0) +
      (Number(p.teachers_per_class.bs4) || 0) +
      (Number(p.teachers_per_class.bs5) || 0) +
      (Number(p.teachers_per_class.bs6) || 0);
    const pTrainT =
      (Number(p.teachers_summary.trained_male) || 0) +
      (Number(p.teachers_summary.trained_female) || 0) +
      (Number(p.teachers_summary.untrained_male) || 0) +
      (Number(p.teachers_summary.untrained_female) || 0);
    if (pClassT !== pTrainT) {
      blockingErrors.push({
        message: `Primary class teachers sum (${pClassT}) must match Trained + Untrained breakdown (${pTrainT})`,
        stepId: 'primary',
      });
    }
  }

  // JHS Validation
  if (chosenLevels.includes('jhs')) {
    const j = formData.jhs;
    const jhsTotalT = Number(j.total_jhs_teachers) || 0;
    const jhsTrainT =
      (Number(j.teachers_summary.trained_male) || 0) +
      (Number(j.teachers_summary.trained_female) || 0) +
      (Number(j.teachers_summary.untrained_male) || 0) +
      (Number(j.teachers_summary.untrained_female) || 0);
    if (jhsTotalT !== jhsTrainT) {
      blockingErrors.push({
        message: `JHS total teachers (${jhsTotalT}) must match Trained + Untrained breakdown (${jhsTrainT})`,
        stepId: 'jhs',
      });
    }
  }

  const hasBlockingErrors = blockingErrors.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <h3 className="text-base font-bold uppercase tracking-wider text-foreground">
          Review &amp; Final Submission
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Please review the auto-calculated summary below. Ensure all figures match your official register before confirming.
        </p>
      </div>

      {/* Blocking Errors Alert */}
      {hasBlockingErrors && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-900 text-brand-error space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Please resolve the following issues before submitting:</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 pl-2">
            {blockingErrors.map((err, idx) => (
              <li key={idx}>
                {err.message}{' '}
                <button
                  type="button"
                  onClick={() => onNavigateToStep(err.stepId)}
                  className="font-bold underline ml-1 text-brand-navy dark:text-blue-300 hover:text-brand-midBlue"
                >
                  (Fix in {err.stepId})
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Soft Warnings (Non-blocking) */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Important Data Quality Warnings (Please Double Check)</span>
          </div>
          <ul className="list-disc list-inside text-xs space-y-1 text-amber-800 dark:text-amber-300 pl-1">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grand Totals KPI Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-brand-navy text-white space-y-1">
          <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider block">
            Grand Total Pupils
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold">{totals.grandTotalPupils}</span>
          <span className="text-[10px] text-blue-300 block">
            {totals.grandTotalBoys} Boys, {totals.grandTotalGirls} Girls
          </span>
        </div>

        <div className="p-4 rounded-xl bg-brand-midBlue text-white space-y-1">
          <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider block">
            Total School Teachers
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold">
            {formData.school_details.total_teachers || 0}
          </span>
          <span className="text-[10px] text-blue-300 block">
            {totals.trainedTeachers} Trained, {totals.untrainedTeachers} Untrained
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Permanent Classrooms
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {totals.totalClassrooms}
          </span>
          <span className="text-[10px] text-muted-foreground block">
            {totals.goodClassrooms} Good, {totals.dilapidatedClassrooms} Dilapidated
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Total Desks &amp; Seats
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {totals.furniture.total}
          </span>
          <span className="text-[10px] text-muted-foreground block">
            {totals.furniture.mono} Mono, {totals.furniture.dual} Dual
          </span>
        </div>
      </div>

      {/* Summary Accordion / Cards by Level */}
      <div className="space-y-4">
        {/* School Details Summary */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-bold text-sm text-brand-navy dark:text-brand-gold flex items-center gap-2">
              <SchoolIcon className="h-4 w-4" />
              School Details
            </span>
            <button
              type="button"
              onClick={() => onNavigateToStep('school_details')}
              className="font-bold text-brand-midBlue dark:text-blue-400 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <span className="text-muted-foreground block">School Name:</span>
              <span className="font-semibold text-foreground">{schoolInfo?.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">EMIS Code:</span>
              <span className="font-mono font-semibold text-foreground">{formData.school_details.emis_code}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Headteacher:</span>
              <span className="font-semibold text-foreground">{formData.school_details.headteacher_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Contact:</span>
              <span className="font-semibold text-foreground">{formData.school_details.headteacher_phone}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Active Levels:</span>
              <span className="font-semibold text-foreground">
                {chosenLevels.map((l) => getLevelName(l)).join(', ')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Established:</span>
              <span className="font-semibold text-foreground">{formData.school_details.established_year}</span>
            </div>
          </div>
        </div>

        {/* Level Summaries */}
        {chosenLevels.map((levelId) => {
          const lTotals = totals[levelId as 'creche' | 'kg' | 'primary' | 'jhs'];
          const schoolSummary = getSchoolTotals(formData);

          return (
            <div
              key={levelId}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-sm text-brand-navy dark:text-brand-gold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {getLevelName(levelId)} Section Summary
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateToStep(levelId)}
                  className="font-bold text-brand-midBlue dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              </div>

              {/* Class-level breakdown pills */}
              {levelId === 'kg' && (
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-brand-navy dark:text-blue-200 block">KG1 Total</span>
                    <span className="text-base font-extrabold text-foreground font-mono">{schoolSummary.kg.kg1.total}</span>
                    <span className="text-[10px] text-muted-foreground block">{schoolSummary.kg.kg1.boys} Boys, {schoolSummary.kg.kg1.girls} Girls</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-brand-navy dark:text-blue-200 block">KG2 Total</span>
                    <span className="text-base font-extrabold text-foreground font-mono">{schoolSummary.kg.kg2.total}</span>
                    <span className="text-[10px] text-muted-foreground block">{schoolSummary.kg.kg2.boys} Boys, {schoolSummary.kg.kg2.girls} Girls</span>
                  </div>
                </div>
              )}

              {levelId === 'primary' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {(['bs1', 'bs2', 'bs3', 'bs4', 'bs5', 'bs6'] as const).map((cls) => (
                    <div key={cls} className="p-2 rounded-lg bg-blue-50/70 dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                      <span className="text-[11px] font-bold uppercase text-brand-navy dark:text-blue-200 block">{cls} Total</span>
                      <span className="text-base font-extrabold text-foreground font-mono">{schoolSummary.primary[cls].total}</span>
                      <span className="text-[10px] text-muted-foreground block">{schoolSummary.primary[cls].boys}B / {schoolSummary.primary[cls].girls}G</span>
                    </div>
                  ))}
                </div>
              )}

              {levelId === 'jhs' && (
                <div className="grid grid-cols-3 gap-2">
                  {(['jhs1', 'jhs2', 'jhs3'] as const).map((cls) => (
                    <div key={cls} className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-slate-800 border border-blue-100 dark:border-slate-700">
                      <span className="text-[11px] font-bold uppercase text-brand-navy dark:text-blue-200 block">{cls} Total</span>
                      <span className="text-base font-extrabold text-foreground font-mono">{schoolSummary.jhs[cls].total}</span>
                      <span className="text-[10px] text-muted-foreground block">{schoolSummary.jhs[cls].boys}B / {schoolSummary.jhs[cls].girls}G</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-2.5 bg-blue-50/90 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                <span>Total {getLevelName(levelId)} Boys: <strong className="font-bold text-blue-900 dark:text-blue-100">{lTotals.boys}</strong></span>
                <span>Total {getLevelName(levelId)} Girls: <strong className="font-bold text-blue-900 dark:text-blue-100">{lTotals.girls}</strong></span>
                <span className="font-bold text-blue-900 dark:text-blue-100">Total {getLevelName(levelId)} Pupils: {lTotals.total}</span>
              </div>
            </div>
          );
        })}

        {/* Infrastructure Summary */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
          <div className="flex items-center justify-between border-b pb-2">
            <span className="font-bold text-sm text-brand-navy dark:text-brand-gold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Infrastructure &amp; Utilities
            </span>
            <button
              type="button"
              onClick={() => onNavigateToStep('infrastructure')}
              className="font-bold text-brand-midBlue dark:text-blue-400 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div>
              <span className="text-muted-foreground block">ICT Lab:</span>
              <span className="font-semibold text-foreground">{formData.infrastructure.ict_lab}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Library:</span>
              <span className="font-semibold text-foreground">{formData.infrastructure.library}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Electricity:</span>
              <span className="font-semibold text-foreground">{formData.infrastructure.electricity ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Potable Water:</span>
              <span className="font-semibold text-foreground">{formData.infrastructure.potable_water ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Toilet Owned:</span>
              <span className="font-semibold text-foreground">{formData.infrastructure.toilet_facility ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Urinal Owned:</span>
              <span className="font-semibold text-foreground">{formData.infrastructure.urinal_facility ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="p-4 rounded-xl border-2 border-brand-navy/30 dark:border-brand-gold/40 bg-blue-50/70 dark:bg-slate-900/80">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            id="confirmation-checkbox"
            checked={formData.confirmed}
            onCheckedChange={(checked) => onConfirmChange(!!checked)}
            className="mt-1"
          />
          <div className="space-y-0.5 select-none">
            <span className="text-sm font-bold text-brand-navy dark:text-brand-gold block">
              Official Headteacher Confirmation
            </span>
            <p className="text-xs text-foreground leading-relaxed">
              I confirm that these figures are correct, accurate, and represent the official annual statistics of{' '}
              <span className="font-bold">{schoolInfo?.name || 'this school'}</span> for the active collection round.
            </p>
          </div>
        </label>
      </div>

      {/* Submit Action */}
      <div className="pt-2">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || hasBlockingErrors || !formData.confirmed}
          className="w-full h-14 text-base font-bold bg-brand-navy hover:bg-brand-midBlue text-white border-b-4 border-brand-gold shadow-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            'Submitting School Statistics...'
          ) : (
            <>
              <Send className="h-5 w-5 text-brand-gold" />
              <span>Submit School Annual Data</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
