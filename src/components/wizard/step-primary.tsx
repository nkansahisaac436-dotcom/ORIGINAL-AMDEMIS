'use client';

import * as React from 'react';
import { FormWizardState } from '@/types';
import { Input } from '@/components/ui/input';
import { Users, GraduationCap, Armchair, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { getPrimaryTotals } from '@/lib/enrolment-totals';

interface StepPrimaryProps {
  formData: FormWizardState;
  updatePrimary: (data: Partial<FormWizardState['primary']>) => void;
  errors?: Record<string, string>;
}

export function StepPrimary({ formData, updatePrimary, errors = {} }: StepPrimaryProps) {
  const p = formData.primary;
  const primaryTotals = getPrimaryTotals(p.enrolment);

  const handleEnrolmentChange = (field: keyof FormWizardState['primary']['enrolment'], val: string) => {
    updatePrimary({
      enrolment: {
        ...p.enrolment,
        [field]: val,
      },
    });
  };

  const handleTeachersPerClassChange = (
    field: keyof FormWizardState['primary']['teachers_per_class'],
    val: string
  ) => {
    updatePrimary({
      teachers_per_class: {
        ...p.teachers_per_class,
        [field]: val,
      },
    });
  };

  const handleTeachersSummaryChange = (
    field: keyof FormWizardState['primary']['teachers_summary'],
    val: string
  ) => {
    updatePrimary({
      teachers_summary: {
        ...p.teachers_summary,
        [field]: val,
      },
    });
  };

  const handleBSDetailChange = (
    cls: 'bs1' | 'bs2' | 'bs3',
    field: 'trained_m' | 'trained_f' | 'untrained_m' | 'untrained_f',
    val: string
  ) => {
    updatePrimary({
      bs_detail: {
        ...p.bs_detail,
        [cls]: {
          ...p.bs_detail[cls],
          [field]: val,
        },
      },
    });
  };

  const handleClassroomsChange = (
    field: keyof FormWizardState['primary']['classrooms'],
    val: string
  ) => {
    updatePrimary({
      classrooms: {
        ...p.classrooms,
        [field]: val,
      },
    });
  };

  const handleFurnitureChange = (
    field: keyof FormWizardState['primary']['furniture'],
    val: string
  ) => {
    updatePrimary({
      furniture: {
        ...p.furniture,
        [field]: val,
      },
    });
  };

  const handlePayrollChange = (field: 'male' | 'female', val: string) => {
    updatePrimary({
      payroll: {
        ...p.payroll,
        [field]: val,
      },
    });
  };

  // Enrolment calculations
  const bsClasses = ['bs1', 'bs2', 'bs3', 'bs4', 'bs5', 'bs6'] as const;
  const boysPerClass = bsClasses.map((c) => primaryTotals[c].boys);
  const girlsPerClass = bsClasses.map((c) => primaryTotals[c].girls);

  const totalPrimaryBoys = primaryTotals.boys;
  const totalPrimaryGirls = primaryTotals.girls;
  const grandTotalPrimary = primaryTotals.total;

  // Teacher totals check
  const totalPerClassTeachers =
    (Number(p.teachers_per_class.bs1) || 0) +
    (Number(p.teachers_per_class.bs2) || 0) +
    (Number(p.teachers_per_class.bs3) || 0) +
    (Number(p.teachers_per_class.bs4) || 0) +
    (Number(p.teachers_per_class.bs5) || 0) +
    (Number(p.teachers_per_class.bs6) || 0);

  const totalTrainingSummary =
    (Number(p.teachers_summary.trained_male) || 0) +
    (Number(p.teachers_summary.trained_female) || 0) +
    (Number(p.teachers_summary.untrained_male) || 0) +
    (Number(p.teachers_summary.untrained_female) || 0);

  const isTeacherTotalConsistent = totalPerClassTeachers === totalTrainingSummary;

  // Detail consistency check for BS1, BS2, BS3
  const getDetailSum = (cls: 'bs1' | 'bs2' | 'bs3') => {
    return (
      (Number(p.bs_detail[cls].trained_m) || 0) +
      (Number(p.bs_detail[cls].trained_f) || 0) +
      (Number(p.bs_detail[cls].untrained_m) || 0) +
      (Number(p.bs_detail[cls].untrained_f) || 0)
    );
  };

  const isBS1Consistent = getDetailSum('bs1') === (Number(p.teachers_per_class.bs1) || 0);
  const isBS2Consistent = getDetailSum('bs2') === (Number(p.teachers_per_class.bs2) || 0);
  const isBS3Consistent = getDetailSum('bs3') === (Number(p.teachers_per_class.bs3) || 0);

  // Classroom check
  const perm = Number(p.classrooms.permanent) || 0;
  const good = Number(p.classrooms.good_condition) || 0;
  const dilap = Number(p.classrooms.dilapidated) || 0;
  const isClassroomValid = good + dilap <= perm;

  return (
    <div className="space-y-6">
      {/* 1. Primary Enrolment by Class BS1 - BS6 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            1. Primary School Enrolment (BS1 to BS6)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bsClasses.map((clsName) => (
            <div
              key={clsName}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2.5"
            >
              <span className="font-bold text-xs uppercase text-brand-navy dark:text-amber-300">
                Class {clsName.toUpperCase()}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <Input
                  label="Boys"
                  required
                  type="number"
                  min={0}
                  placeholder="0"
                  value={p.enrolment[`${clsName}_boys`]}
                  onChange={(e) => handleEnrolmentChange(`${clsName}_boys`, e.target.value)}
                  error={errors[`primary.enrolment.${clsName}_boys`]}
                />
                <Input
                  label="Girls"
                  required
                  type="number"
                  min={0}
                  placeholder="0"
                  value={p.enrolment[`${clsName}_girls`]}
                  onChange={(e) => handleEnrolmentChange(`${clsName}_girls`, e.target.value)}
                  error={errors[`primary.enrolment.${clsName}_girls`]}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    {clsName.toUpperCase()} Total
                  </label>
                  <div
                    className="flex h-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50/90 dark:bg-blue-950/50 dark:border-blue-800 px-3 py-2 font-mono text-base font-bold text-blue-900 dark:text-blue-200 shadow-xs select-none"
                    aria-label={`${clsName.toUpperCase()} Total`}
                  >
                    {primaryTotals[clsName].total}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800 text-xs font-semibold text-blue-950 dark:text-blue-200 flex flex-wrap items-center justify-between gap-2">
          <span>Total Boys: <strong className="font-bold text-blue-900 dark:text-blue-100">{primaryTotals.boys}</strong></span>
          <span>Total Girls: <strong className="font-bold text-blue-900 dark:text-blue-100">{primaryTotals.girls}</strong></span>
          <span className="font-bold text-blue-900 dark:text-blue-100">Total Pupils: {primaryTotals.total}</span>
        </div>
      </div>

      {/* 2. Age-Based Enrolment */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            2. Primary Age Distribution
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="BS1 Boys Aged 6"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed BS1 Boys (${boysPerClass[0]})`}
            value={p.enrolment.bs1_boys_age6}
            onChange={(e) => handleEnrolmentChange('bs1_boys_age6', e.target.value)}
            error={errors['primary.enrolment.bs1_boys_age6']}
          />
          <Input
            label="BS1 Girls Aged 6"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed BS1 Girls (${girlsPerClass[0]})`}
            value={p.enrolment.bs1_girls_age6}
            onChange={(e) => handleEnrolmentChange('bs1_girls_age6', e.target.value)}
            error={errors['primary.enrolment.bs1_girls_age6']}
          />
          <Input
            label="BS1 to BS6 Boys Aged 6 to 11"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed total Primary Boys (${totalPrimaryBoys})`}
            value={p.enrolment.bs_boys_age6_11}
            onChange={(e) => handleEnrolmentChange('bs_boys_age6_11', e.target.value)}
            error={errors['primary.enrolment.bs_boys_age6_11']}
          />
          <Input
            label="BS1 to BS6 Girls Aged 6 to 11"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed total Primary Girls (${totalPrimaryGirls})`}
            value={p.enrolment.bs_girls_age6_11}
            onChange={(e) => handleEnrolmentChange('bs_girls_age6_11', e.target.value)}
            error={errors['primary.enrolment.bs_girls_age6_11']}
          />
        </div>
      </div>

      {/* 3. Teachers per class BS1-BS6 */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            3. Teachers Assigned per Class (BS1 to BS6)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {bsClasses.map((cls) => (
            <Input
              key={`tc-${cls}`}
              label={`Class ${cls.toUpperCase()}`}
              required
              type="number"
              min={0}
              placeholder="0"
              value={p.teachers_per_class[cls]}
              onChange={(e) => handleTeachersPerClassChange(cls, e.target.value)}
            />
          ))}
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Primary Teaching Staff Qualification Summary
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Primary Trained Male"
              required
              type="number"
              min={0}
              placeholder="0"
              value={p.teachers_summary.trained_male}
              onChange={(e) => handleTeachersSummaryChange('trained_male', e.target.value)}
            />
            <Input
              label="Primary Trained Female"
              required
              type="number"
              min={0}
              placeholder="0"
              value={p.teachers_summary.trained_female}
              onChange={(e) => handleTeachersSummaryChange('trained_female', e.target.value)}
            />
            <Input
              label="Primary Untrained Male"
              required
              type="number"
              min={0}
              placeholder="0"
              value={p.teachers_summary.untrained_male}
              onChange={(e) => handleTeachersSummaryChange('untrained_male', e.target.value)}
            />
            <Input
              label="Primary Untrained Female"
              required
              type="number"
              min={0}
              placeholder="0"
              value={p.teachers_summary.untrained_female}
              onChange={(e) => handleTeachersSummaryChange('untrained_female', e.target.value)}
            />
          </div>
        </div>

        {totalPerClassTeachers > 0 && (
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
                  Primary teacher total matches: {totalPerClassTeachers} class teachers = {totalTrainingSummary} qualified &amp; unqualified teachers.
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Discrepancy: Class teachers sum ({totalPerClassTeachers}) must match Training breakdown total ({totalTrainingSummary}).
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* 4. BS1 to BS3 Trained/Untrained Detail */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            4. BS1 to BS3 Early Grade Teacher Breakdown (12 fields)
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {(['bs1', 'bs2', 'bs3'] as const).map((cls) => {
            const assigned = Number(p.teachers_per_class[cls]) || 0;
            const sum = getDetailSum(cls);
            const isMatch = assigned === sum;

            return (
              <div
                key={`detail-${cls}`}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <span className="font-bold text-xs uppercase text-brand-navy dark:text-amber-300">
                    {cls.toUpperCase()} Teacher Details
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isMatch
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sum} / {assigned} Assigned
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Input
                    label="Trained Male"
                    required
                    type="number"
                    min={0}
                    placeholder="0"
                    value={p.bs_detail[cls].trained_m}
                    onChange={(e) => handleBSDetailChange(cls, 'trained_m', e.target.value)}
                  />
                  <Input
                    label="Trained Female"
                    required
                    type="number"
                    min={0}
                    placeholder="0"
                    value={p.bs_detail[cls].trained_f}
                    onChange={(e) => handleBSDetailChange(cls, 'trained_f', e.target.value)}
                  />
                  <Input
                    label="Untrained Male"
                    required
                    type="number"
                    min={0}
                    placeholder="0"
                    value={p.bs_detail[cls].untrained_m}
                    onChange={(e) => handleBSDetailChange(cls, 'untrained_m', e.target.value)}
                  />
                  <Input
                    label="Untrained Female"
                    required
                    type="number"
                    min={0}
                    placeholder="0"
                    value={p.bs_detail[cls].untrained_f}
                    onChange={(e) => handleBSDetailChange(cls, 'untrained_f', e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Classrooms Condition */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <GraduationCap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            5. Primary Classrooms Condition &amp; Under Tree
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Permanent Classrooms"
            required
            type="number"
            min={0}
            placeholder="0"
            value={p.classrooms.permanent}
            onChange={(e) => handleClassroomsChange('permanent', e.target.value)}
            error={errors['primary.classrooms.permanent']}
          />
          <Input
            label="GOOD Condition"
            required
            type="number"
            min={0}
            placeholder="0"
            value={p.classrooms.good_condition}
            onChange={(e) => handleClassroomsChange('good_condition', e.target.value)}
            error={errors['primary.classrooms.good_condition']}
          />
          <Input
            label="DILAPIDATED Condition"
            required
            type="number"
            min={0}
            placeholder="0"
            value={p.classrooms.dilapidated}
            onChange={(e) => handleClassroomsChange('dilapidated', e.target.value)}
            error={errors['primary.classrooms.dilapidated']}
          />
          <Input
            label="Classes UNDER TREE"
            type="number"
            min={0}
            placeholder="0"
            helperText="Optional, blank = 0"
            value={p.classrooms.under_tree}
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

      {/* 6. Furniture */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Armchair className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            6. Primary School Furniture
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Mono Desk"
            required
            type="number"
            min={0}
            placeholder="0"
            value={p.furniture.mono_desk}
            onChange={(e) => handleFurnitureChange('mono_desk', e.target.value)}
          />
          <Input
            label="Dual Desk"
            required
            type="number"
            min={0}
            placeholder="0"
            value={p.furniture.dual_desk}
            onChange={(e) => handleFurnitureChange('dual_desk', e.target.value)}
          />
          <Input
            label="Others (Bench, Hexagon etc.)"
            required
            type="number"
            min={0}
            placeholder="0"
            value={p.furniture.others}
            onChange={(e) => handleFurnitureChange('others', e.target.value)}
          />
        </div>
      </div>

      {/* 7. Non-teaching Staff on Payroll (KG & Primary) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            7. Non-Teaching Staff on Payroll (KG &amp; Primary)
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
            value={p.payroll.male}
            onChange={(e) => handlePayrollChange('male', e.target.value)}
          />
          <Input
            label="Female Non-Teaching Staff"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText="If None, enter '0'"
            value={p.payroll.female}
            onChange={(e) => handlePayrollChange('female', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
