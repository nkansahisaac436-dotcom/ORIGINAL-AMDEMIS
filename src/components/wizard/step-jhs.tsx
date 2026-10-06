'use client';

import * as React from 'react';
import { FormWizardState } from '@/types';
import { Input } from '@/components/ui/input';
import { Users, GraduationCap, Armchair, AlertCircle, CheckCircle2, Languages } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { getJHSTotals } from '@/lib/enrolment-totals';

interface StepJHSProps {
  formData: FormWizardState;
  updateJHS: (data: Partial<FormWizardState['jhs']>) => void;
  errors?: Record<string, string>;
}

export function StepJHS({ formData, updateJHS, errors = {} }: StepJHSProps) {
  const j = formData.jhs;
  const jhsTotals = getJHSTotals(j.enrolment);

  const handleEnrolmentChange = (field: keyof FormWizardState['jhs']['enrolment'], val: string) => {
    updateJHS({
      enrolment: {
        ...j.enrolment,
        [field]: val,
      },
    });
  };

  const handleSpecialTeachersChange = (field: 'has_french' | 'has_arabic', val: boolean) => {
    updateJHS({
      special_teachers: {
        ...j.special_teachers,
        [field]: val,
      },
    });
  };

  const handleTeachersSummaryChange = (
    field: keyof FormWizardState['jhs']['teachers_summary'],
    val: string
  ) => {
    updateJHS({
      teachers_summary: {
        ...j.teachers_summary,
        [field]: val,
      },
    });
  };

  const handleClassroomsChange = (field: keyof FormWizardState['jhs']['classrooms'], val: string) => {
    updateJHS({
      classrooms: {
        ...j.classrooms,
        [field]: val,
      },
    });
  };

  const handleFurnitureChange = (field: keyof FormWizardState['jhs']['furniture'], val: string) => {
    updateJHS({
      furniture: {
        ...j.furniture,
        [field]: val,
      },
    });
  };

  const handlePayrollChange = (field: 'male' | 'female', val: string) => {
    updateJHS({
      payroll: {
        ...j.payroll,
        [field]: val,
      },
    });
  };

  // Calculations
  const jhs1B = jhsTotals.jhs1.boys;
  const jhs1G = jhsTotals.jhs1.girls;
  const jhs2B = jhsTotals.jhs2.boys;
  const jhs2G = jhsTotals.jhs2.girls;
  const jhs3B = jhsTotals.jhs3.boys;
  const jhs3G = jhsTotals.jhs3.girls;

  const totalJHSBoys = jhsTotals.boys;
  const totalJHSGirls = jhsTotals.girls;
  const grandTotalJHS = jhsTotals.total;

  // Teacher balance check
  const totalJHSTeachers = Number(j.total_jhs_teachers) || 0;
  const totalTrainingSummary =
    (Number(j.teachers_summary.trained_male) || 0) +
    (Number(j.teachers_summary.trained_female) || 0) +
    (Number(j.teachers_summary.untrained_male) || 0) +
    (Number(j.teachers_summary.untrained_female) || 0);

  const isTeacherTotalConsistent = totalJHSTeachers === totalTrainingSummary;

  // Classroom check
  const perm = Number(j.classrooms.permanent) || 0;
  const good = Number(j.classrooms.good_condition) || 0;
  const dilap = Number(j.classrooms.dilapidated) || 0;
  const isClassroomValid = good + dilap <= perm;

  return (
    <div className="space-y-6">
      {/* 1. JHS Enrolment */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            1. Junior High School (JHS) Enrolment
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* JHS1 */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
            <span className="font-bold text-xs uppercase text-brand-navy dark:text-rose-300">
              Class JHS 1
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
              <Input
                label="Boys"
                required
                type="number"
                min={0}
                placeholder="0"
                value={j.enrolment.jhs1_boys}
                onChange={(e) => handleEnrolmentChange('jhs1_boys', e.target.value)}
                error={errors['jhs.enrolment.jhs1_boys']}
              />
              <Input
                label="Girls"
                required
                type="number"
                min={0}
                placeholder="0"
                value={j.enrolment.jhs1_girls}
                onChange={(e) => handleEnrolmentChange('jhs1_girls', e.target.value)}
                error={errors['jhs.enrolment.jhs1_girls']}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  JHS1 Total
                </label>
                <div
                  className="flex h-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50/90 dark:bg-blue-950/50 dark:border-blue-800 px-3 py-2 font-mono text-base font-bold text-blue-900 dark:text-blue-200 shadow-xs select-none"
                  aria-label="JHS1 Total"
                >
                  {jhsTotals.jhs1.total}
                </div>
              </div>
            </div>
          </div>

          {/* JHS2 */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
            <span className="font-bold text-xs uppercase text-brand-navy dark:text-rose-300">
              Class JHS 2
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
              <Input
                label="Boys"
                required
                type="number"
                min={0}
                placeholder="0"
                value={j.enrolment.jhs2_boys}
                onChange={(e) => handleEnrolmentChange('jhs2_boys', e.target.value)}
                error={errors['jhs.enrolment.jhs2_boys']}
              />
              <Input
                label="Girls"
                required
                type="number"
                min={0}
                placeholder="0"
                value={j.enrolment.jhs2_girls}
                onChange={(e) => handleEnrolmentChange('jhs2_girls', e.target.value)}
                error={errors['jhs.enrolment.jhs2_girls']}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  JHS2 Total
                </label>
                <div
                  className="flex h-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50/90 dark:bg-blue-950/50 dark:border-blue-800 px-3 py-2 font-mono text-base font-bold text-blue-900 dark:text-blue-200 shadow-xs select-none"
                  aria-label="JHS2 Total"
                >
                  {jhsTotals.jhs2.total}
                </div>
              </div>
            </div>
          </div>

          {/* JHS3 */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5">
            <span className="font-bold text-xs uppercase text-brand-navy dark:text-rose-300">
              Class JHS 3
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
              <Input
                label="Boys"
                required
                type="number"
                min={0}
                placeholder="0"
                value={j.enrolment.jhs3_boys}
                onChange={(e) => handleEnrolmentChange('jhs3_boys', e.target.value)}
                error={errors['jhs.enrolment.jhs3_boys']}
              />
              <Input
                label="Girls"
                required
                type="number"
                min={0}
                placeholder="0"
                value={j.enrolment.jhs3_girls}
                onChange={(e) => handleEnrolmentChange('jhs3_girls', e.target.value)}
                error={errors['jhs.enrolment.jhs3_girls']}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  JHS3 Total
                </label>
                <div
                  className="flex h-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50/90 dark:bg-blue-950/50 dark:border-blue-800 px-3 py-2 font-mono text-base font-bold text-blue-900 dark:text-blue-200 shadow-xs select-none"
                  aria-label="JHS3 Total"
                >
                  {jhsTotals.jhs3.total}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800 text-xs font-semibold text-blue-950 dark:text-blue-200 flex flex-wrap items-center justify-between gap-2">
          <span>Total Boys: <strong className="font-bold text-blue-900 dark:text-blue-100">{jhsTotals.boys}</strong></span>
          <span>Total Girls: <strong className="font-bold text-blue-900 dark:text-blue-100">{jhsTotals.girls}</strong></span>
          <span className="font-bold text-blue-900 dark:text-blue-100">Total Pupils: {jhsTotals.total}</span>
        </div>
      </div>

      {/* 2. JHS Age Distribution */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            2. JHS Age Distribution
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="JHS1 Boys Aged 12"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed JHS1 Boys (${jhs1B})`}
            value={j.enrolment.jhs1_boys_age12}
            onChange={(e) => handleEnrolmentChange('jhs1_boys_age12', e.target.value)}
            error={errors['jhs.enrolment.jhs1_boys_age12']}
          />
          <Input
            label="JHS1 Girls Aged 12"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed JHS1 Girls (${jhs1G})`}
            value={j.enrolment.jhs1_girls_age12}
            onChange={(e) => handleEnrolmentChange('jhs1_girls_age12', e.target.value)}
            error={errors['jhs.enrolment.jhs1_girls_age12']}
          />
          <Input
            label="JHS1 to JHS3 Boys Aged 12 to 14"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed total JHS Boys (${totalJHSBoys})`}
            value={j.enrolment.jhs_boys_age12_14}
            onChange={(e) => handleEnrolmentChange('jhs_boys_age12_14', e.target.value)}
            error={errors['jhs.enrolment.jhs_boys_age12_14']}
          />
          <Input
            label="JHS1 to JHS3 Girls Aged 12 to 14"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed total JHS Girls (${totalJHSGirls})`}
            value={j.enrolment.jhs_girls_age12_14}
            onChange={(e) => handleEnrolmentChange('jhs_girls_age12_14', e.target.value)}
            error={errors['jhs.enrolment.jhs_girls_age12_14']}
          />
        </div>
      </div>

      {/* 3. JHS Teachers & Languages */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <GraduationCap className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            3. JHS Teachers &amp; Subject Specialization
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <Input
              label="Total Number of JHS Teachers (Excl. Headteacher, French & Arabic teachers)"
              required
              type="number"
              min={0}
              placeholder="0"
              value={j.total_jhs_teachers}
              onChange={(e) => updateJHS({ total_jhs_teachers: e.target.value })}
              error={errors['jhs.total_jhs_teachers']}
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between sm:col-span-1">
            <div className="space-y-0.5">
              <label htmlFor="french-teacher" className="text-xs font-bold text-foreground block cursor-pointer">
                French Teacher
              </label>
              <p className="text-[11px] text-muted-foreground">Does school have a French teacher?</p>
            </div>
            <Checkbox
              id="french-teacher"
              checked={j.special_teachers.has_french}
              onCheckedChange={(c) => handleSpecialTeachersChange('has_french', !!c)}
            />
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between sm:col-span-1">
            <div className="space-y-0.5">
              <label htmlFor="arabic-teacher" className="text-xs font-bold text-foreground block cursor-pointer">
                Arabic Teacher
              </label>
              <p className="text-[11px] text-muted-foreground">Does school have an Arabic teacher?</p>
            </div>
            <Checkbox
              id="arabic-teacher"
              checked={j.special_teachers.has_arabic}
              onCheckedChange={(c) => handleSpecialTeachersChange('has_arabic', !!c)}
            />
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            JHS Teaching Staff Professional Qualifications
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="JHS Trained Male"
              required
              type="number"
              min={0}
              placeholder="0"
              value={j.teachers_summary.trained_male}
              onChange={(e) => handleTeachersSummaryChange('trained_male', e.target.value)}
            />
            <Input
              label="JHS Trained Female"
              required
              type="number"
              min={0}
              placeholder="0"
              value={j.teachers_summary.trained_female}
              onChange={(e) => handleTeachersSummaryChange('trained_female', e.target.value)}
            />
            <Input
              label="JHS Untrained Male"
              required
              type="number"
              min={0}
              placeholder="0"
              value={j.teachers_summary.untrained_male}
              onChange={(e) => handleTeachersSummaryChange('untrained_male', e.target.value)}
            />
            <Input
              label="JHS Untrained Female"
              required
              type="number"
              min={0}
              placeholder="0"
              value={j.teachers_summary.untrained_female}
              onChange={(e) => handleTeachersSummaryChange('untrained_female', e.target.value)}
            />
          </div>
        </div>

        {totalJHSTeachers > 0 && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              isTeacherTotalConsistent
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-brand-error border border-red-200 dark:border-red-900'
            }`}
          >
            {isTeacherTotalConsistent ? (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  JHS teacher total matches: {totalJHSTeachers} total teachers = {totalTrainingSummary} qualified &amp; unqualified teachers.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Discrepancy: Total JHS teachers ({totalJHSTeachers}) must match Training breakdown total ({totalTrainingSummary}).
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 4. Classrooms Condition */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <GraduationCap className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            4. JHS Classrooms Condition &amp; Under Tree
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Permanent Classrooms"
            required
            type="number"
            min={0}
            placeholder="0"
            value={j.classrooms.permanent}
            onChange={(e) => handleClassroomsChange('permanent', e.target.value)}
            error={errors['jhs.classrooms.permanent']}
          />
          <Input
            label="GOOD Condition"
            required
            type="number"
            min={0}
            placeholder="0"
            value={j.classrooms.good_condition}
            onChange={(e) => handleClassroomsChange('good_condition', e.target.value)}
            error={errors['jhs.classrooms.good_condition']}
          />
          <Input
            label="DILAPIDATED Condition"
            required
            type="number"
            min={0}
            placeholder="0"
            value={j.classrooms.dilapidated}
            onChange={(e) => handleClassroomsChange('dilapidated', e.target.value)}
            error={errors['jhs.classrooms.dilapidated']}
          />
          <Input
            label="Classes UNDER TREE"
            type="number"
            min={0}
            placeholder="0"
            helperText="Optional, blank = 0"
            value={j.classrooms.under_tree}
            onChange={(e) => handleClassroomsChange('under_tree', e.target.value)}
          />
        </div>

        {!isClassroomValid && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-brand-error rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Good condition ({good}) + Dilapidated ({dilap}) cannot exceed Permanent classrooms ({perm}).</span>
          </div>
        )}
      </div>

      {/* 5. Furniture */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Armchair className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            5. JHS Furniture
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Mono Desk"
            required
            type="number"
            min={0}
            placeholder="0"
            value={j.furniture.mono_desk}
            onChange={(e) => handleFurnitureChange('mono_desk', e.target.value)}
          />
          <Input
            label="Dual Desk"
            required
            type="number"
            min={0}
            placeholder="0"
            value={j.furniture.dual_desk}
            onChange={(e) => handleFurnitureChange('dual_desk', e.target.value)}
          />
          <Input
            label="Others (Bench, Chairs etc.)"
            required
            type="number"
            min={0}
            placeholder="0"
            value={j.furniture.others}
            onChange={(e) => handleFurnitureChange('others', e.target.value)}
          />
        </div>
      </div>

      {/* 6. Non-teaching Staff on Payroll (JHS) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            6. Non-Teaching Staff on Payroll (JHS)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Male Non-Teaching Staff"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText="If None, enter '0'"
            value={j.payroll.male}
            onChange={(e) => handlePayrollChange('male', e.target.value)}
          />
          <Input
            label="Female Non-Teaching Staff"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText="If None, enter '0'"
            value={j.payroll.female}
            onChange={(e) => handlePayrollChange('female', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
