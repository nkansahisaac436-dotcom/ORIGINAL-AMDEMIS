'use client';

import * as React from 'react';
import { FormWizardState } from '@/types';
import { Input } from '@/components/ui/input';
import { Users, BookOpen, Armchair, AlertCircle } from 'lucide-react';

interface StepCrecheProps {
  formData: FormWizardState;
  updateCreche: (data: Partial<FormWizardState['creche']>) => void;
  errors?: Record<string, string>;
}

export function StepCreche({ formData, updateCreche, errors = {} }: StepCrecheProps) {
  const c = formData.creche;

  const totalBoys = Number(c.boys) || 0;
  const totalGirls = Number(c.girls) || 0;
  const totalPupils = totalBoys + totalGirls;

  const perm = Number(c.classrooms.permanent) || 0;
  const good = Number(c.classrooms.good_condition) || 0;
  const dilap = Number(c.classrooms.dilapidated) || 0;
  const isClassroomConditionValid = good + dilap <= perm;

  const handleClassroomChange = (field: keyof FormWizardState['creche']['classrooms'], val: string) => {
    updateCreche({
      classrooms: {
        ...c.classrooms,
        [field]: val,
      },
    });
  };

  const handleFurnitureChange = (field: keyof FormWizardState['creche']['furniture'], val: string) => {
    updateCreche({
      furniture: {
        ...c.furniture,
        [field]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Enrolment Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Crèche / Nursery Enrolment
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Boys Enrolment"
            required
            type="number"
            min={0}
            placeholder="0"
            value={c.boys}
            onChange={(e) => updateCreche({ boys: e.target.value })}
            error={errors['creche.boys']}
          />
          <Input
            label="Girls Enrolment"
            required
            type="number"
            min={0}
            placeholder="0"
            value={c.girls}
            onChange={(e) => updateCreche({ girls: e.target.value })}
            error={errors['creche.girls']}
          />
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-xs font-semibold text-purple-900 dark:text-purple-200 flex justify-between">
          <span>Total Crèche / Nursery Enrolment:</span>
          <span>{totalPupils} Pupils ({totalBoys} Boys, {totalGirls} Girls)</span>
        </div>
      </div>

      {/* 2. Teachers Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Crèche / Nursery Teachers
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Male Teachers (Crèche)"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText="If None, enter '0'"
            value={c.male_teachers}
            onChange={(e) => updateCreche({ male_teachers: e.target.value })}
            error={errors['creche.male_teachers']}
          />
          <Input
            label="Female Teachers (Crèche)"
            required
            type="number"
            min={0}
            placeholder="0"
            helperText="If None, enter '0'"
            value={c.female_teachers}
            onChange={(e) => updateCreche({ female_teachers: e.target.value })}
            error={errors['creche.female_teachers']}
          />
        </div>
      </div>

      {/* 3. Classrooms Condition */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Classrooms Condition &amp; Under Tree
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Permanent Classrooms"
            required
            type="number"
            min={0}
            placeholder="0"
            value={c.classrooms.permanent}
            onChange={(e) => handleClassroomChange('permanent', e.target.value)}
            error={errors['creche.classrooms.permanent']}
          />
          <Input
            label="In GOOD Condition"
            required
            type="number"
            min={0}
            placeholder="0"
            value={c.classrooms.good_condition}
            onChange={(e) => handleClassroomChange('good_condition', e.target.value)}
            error={errors['creche.classrooms.good_condition']}
          />
          <Input
            label="In DILAPIDATED Condition"
            required
            type="number"
            min={0}
            placeholder="0"
            value={c.classrooms.dilapidated}
            onChange={(e) => handleClassroomChange('dilapidated', e.target.value)}
            error={errors['creche.classrooms.dilapidated']}
          />
          <Input
            label="Classes UNDER TREE"
            type="number"
            min={0}
            placeholder="0"
            helperText="Optional, blank = 0"
            value={c.classrooms.under_tree}
            onChange={(e) => handleClassroomChange('under_tree', e.target.value)}
          />
        </div>

        {!isClassroomConditionValid && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-brand-error rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Good condition ({good}) + Dilapidated ({dilap}) cannot exceed Permanent classrooms ({perm}).</span>
          </div>
        )}
      </div>

      {/* 4. Furniture */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Armchair className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Crèche / Nursery Furniture
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Mono Desk"
            required
            type="number"
            min={0}
            placeholder="0"
            value={c.furniture.mono_desk}
            onChange={(e) => handleFurnitureChange('mono_desk', e.target.value)}
          />
          <Input
            label="Dual Desk"
            required
            type="number"
            min={0}
            placeholder="0"
            value={c.furniture.dual_desk}
            onChange={(e) => handleFurnitureChange('dual_desk', e.target.value)}
          />
          <Input
            label="Others (Bench, Hexagon etc.)"
            required
            type="number"
            min={0}
            placeholder="0"
            value={c.furniture.others}
            onChange={(e) => handleFurnitureChange('others', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
