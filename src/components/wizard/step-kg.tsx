'use client';

import * as React from 'react';
import { FormWizardState } from '@/types';
import { Input } from '@/components/ui/input';
import { Users, GraduationCap, Armchair, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StepKGProps {
  formData: FormWizardState;
  updateKG: (data: Partial<FormWizardState['kg']>) => void;
  errors?: Record<string, string>;
}

export function StepKG({ formData, updateKG, errors = {} }: StepKGProps) {
  const kg = formData.kg;

  // Helpers for enrolment changes
  const handleEnrolmentChange = (field: keyof FormWizardState['kg']['enrolment'], val: string) => {
    updateKG({
      enrolment: {
        ...kg.enrolment,
        [field]: val,
      },
    });
  };

  const handleTeachersChange = (field: keyof FormWizardState['kg']['teachers'], val: string) => {
    updateKG({
      teachers: {
        ...kg.teachers,
        [field]: val,
      },
    });
  };

  const handleClassroomsChange = (field: keyof FormWizardState['kg']['classrooms'], val: string) => {
    updateKG({
      classrooms: {
        ...kg.classrooms,
        [field]: val,
      },
    });
  };

  const handleFurnitureChange = (field: keyof FormWizardState['kg']['furniture'], val: string) => {
    updateKG({
      furniture: {
        ...kg.furniture,
        [field]: val,
      },
    });
  };

  // Calculations
  const kg1B = Number(kg.enrolment.kg1_boys) || 0;
  const kg1G = Number(kg.enrolment.kg1_girls) || 0;
  const kg2B = Number(kg.enrolment.kg2_boys) || 0;
  const kg2G = Number(kg.enrolment.kg2_girls) || 0;

  const totalKGBoys = kg1B + kg2B;
  const totalKGGirls = kg1G + kg2G;
  const grandTotalKG = totalKGBoys + totalKGGirls;

  // Teacher balance check
  const classTeachers = (Number(kg.teachers.kg1_teachers) || 0) + (Number(kg.teachers.kg2_teachers) || 0);
  const trainingTeachers =
    (Number(kg.teachers.trained_male) || 0) +
    (Number(kg.teachers.trained_female) || 0) +
    (Number(kg.teachers.untrained_male) || 0) +
    (Number(kg.teachers.untrained_female) || 0);
  const isTeacherConsistent = classTeachers === trainingTeachers;

  // Classroom condition check
  const perm = Number(kg.classrooms.permanent) || 0;
  const good = Number(kg.classrooms.good_condition) || 0;
  const dilap = Number(kg.classrooms.dilapidated) || 0;
  const isClassroomValid = good + dilap <= perm;

  return (
    <div className="space-y-6">
      {/* 1. General Enrolment */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            1. Kindergarten (KG) Enrolment by Class
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="KG1 Boys"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.enrolment.kg1_boys}
            onChange={(e) => handleEnrolmentChange('kg1_boys', e.target.value)}
            error={errors['kg.enrolment.kg1_boys']}
          />
          <Input
            label="KG1 Girls"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.enrolment.kg1_girls}
            onChange={(e) => handleEnrolmentChange('kg1_girls', e.target.value)}
            error={errors['kg.enrolment.kg1_girls']}
          />
          <Input
            label="KG2 Boys"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.enrolment.kg2_boys}
            onChange={(e) => handleEnrolmentChange('kg2_boys', e.target.value)}
            error={errors['kg.enrolment.kg2_boys']}
          />
          <Input
            label="KG2 Girls"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.enrolment.kg2_girls}
            onChange={(e) => handleEnrolmentChange('kg2_girls', e.target.value)}
            error={errors['kg.enrolment.kg2_girls']}
          />
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex flex-wrap justify-between gap-2">
          <span>KG1 Total: {kg1B + kg1G} ({kg1B} Boys, {kg1G} Girls)</span>
          <span>KG2 Total: {kg2B + kg2G} ({kg2B} Boys, {kg2G} Girls)</span>
          <span className="font-bold">Grand Total KG: {grandTotalKG} Pupils</span>
        </div>
      </div>

      {/* 2. Age-Based Enrolment */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            2. Kindergarten Age Distribution
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="KG1 Boys Aged 4"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed KG1 Boys (${kg1B})`}
            value={kg.enrolment.kg1_boys_age4}
            onChange={(e) => handleEnrolmentChange('kg1_boys_age4', e.target.value)}
            error={errors['kg.enrolment.kg1_boys_age4']}
          />
          <Input
            label="KG1 Girls Aged 4"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed KG1 Girls (${kg1G})`}
            value={kg.enrolment.kg1_girls_age4}
            onChange={(e) => handleEnrolmentChange('kg1_girls_age4', e.target.value)}
            error={errors['kg.enrolment.kg1_girls_age4']}
          />
          <Input
            label="KG2 Boys Aged 5"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed KG2 Boys (${kg2B})`}
            value={kg.enrolment.kg2_boys_age5}
            onChange={(e) => handleEnrolmentChange('kg2_boys_age5', e.target.value)}
            error={errors['kg.enrolment.kg2_boys_age5']}
          />
          <Input
            label="KG2 Girls Aged 5"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed KG2 Girls (${kg2G})`}
            value={kg.enrolment.kg2_girls_age5}
            onChange={(e) => handleEnrolmentChange('kg2_girls_age5', e.target.value)}
            error={errors['kg.enrolment.kg2_girls_age5']}
          />
          <Input
            label="KG1 &amp; KG2 Boys Aged 4 to 5"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed total KG Boys (${totalKGBoys})`}
            value={kg.enrolment.kg_boys_age4_5}
            onChange={(e) => handleEnrolmentChange('kg_boys_age4_5', e.target.value)}
            error={errors['kg.enrolment.kg_boys_age4_5']}
          />
          <Input
            label="KG1 &amp; KG2 Girls Aged 4 to 5"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText={`Cannot exceed total KG Girls (${totalKGGirls})`}
            value={kg.enrolment.kg_girls_age4_5}
            onChange={(e) => handleEnrolmentChange('kg_girls_age4_5', e.target.value)}
            error={errors['kg.enrolment.kg_girls_age4_5']}
          />
        </div>
      </div>

      {/* 3. KG Teachers */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            3. Kindergarten Teachers
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="KG1 Teachers Count"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.teachers.kg1_teachers}
            onChange={(e) => handleTeachersChange('kg1_teachers', e.target.value)}
            error={errors['kg.teachers.kg1_teachers']}
          />
          <Input
            label="KG2 Teachers Count"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.teachers.kg2_teachers}
            onChange={(e) => handleTeachersChange('kg2_teachers', e.target.value)}
            error={errors['kg.teachers.kg2_teachers']}
          />
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            KG Professional Training Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              label="Trained Male"
              required
              type="number"
              min={0}
              placeholder="0"
              value={kg.teachers.trained_male}
              onChange={(e) => handleTeachersChange('trained_male', e.target.value)}
            />
            <Input
              label="Trained Female"
              required
              type="number"
              min={0}
              placeholder="0"
              value={kg.teachers.trained_female}
              onChange={(e) => handleTeachersChange('trained_female', e.target.value)}
            />
            <Input
              label="Untrained Male"
              required
              type="number"
              min={0}
              placeholder="0"
              value={kg.teachers.untrained_male}
              onChange={(e) => handleTeachersChange('untrained_male', e.target.value)}
            />
            <Input
              label="Untrained Female"
              required
              type="number"
              min={0}
              placeholder="0"
              value={kg.teachers.untrained_female}
              onChange={(e) => handleTeachersChange('untrained_female', e.target.value)}
            />
          </div>
        </div>

        {/* Teacher verification banner */}
        <div className="mt-2">
          {classTeachers > 0 && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                isTeacherConsistent
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/40 text-brand-error border border-red-200 dark:border-red-900'
              }`}
            >
              {isTeacherConsistent ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    KG teacher totals match: {classTeachers} class teachers = {trainingTeachers} trained &amp; untrained staff.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    Discrepancy: Class teachers (KG1 + KG2 = {classTeachers}) does not match Training breakdown ({trainingTeachers}).
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Classrooms & Condition */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            4. KG Classrooms Condition
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Permanent Classrooms"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.classrooms.permanent}
            onChange={(e) => handleClassroomsChange('permanent', e.target.value)}
            error={errors['kg.classrooms.permanent']}
          />
          <Input
            label="GOOD Condition"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.classrooms.good_condition}
            onChange={(e) => handleClassroomsChange('good_condition', e.target.value)}
            error={errors['kg.classrooms.good_condition']}
          />
          <Input
            label="DILAPIDATED Condition"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.classrooms.dilapidated}
            onChange={(e) => handleClassroomsChange('dilapidated', e.target.value)}
            error={errors['kg.classrooms.dilapidated']}
          />
          <Input
            label="Classes UNDER TREE"
            type="number"
            min={0}
            placeholder="0"
            helperText="Optional, blank = 0"
            value={kg.classrooms.under_tree}
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
          <Armchair className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            5. KG Furniture
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Mono Desk"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.furniture.mono_desk}
            onChange={(e) => handleFurnitureChange('mono_desk', e.target.value)}
          />
          <Input
            label="Dual Desk"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.furniture.dual_desk}
            onChange={(e) => handleFurnitureChange('dual_desk', e.target.value)}
          />
          <Input
            label="Others (Hexagon, Chairs etc.)"
            required
            type="number"
            min={0}
            placeholder="0"
            value={kg.furniture.others}
            onChange={(e) => handleFurnitureChange('others', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
