'use client';

import * as React from 'react';
import { FormWizardState, School } from '@/types';
import { EDUCATION_LEVELS, LevelId } from '@/lib/levels-config';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, School as SchoolIcon, Shield, MapPin, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface StepSchoolDetailsProps {
  formData: FormWizardState;
  schoolInfo?: Partial<School>;
  updateSchoolDetails: (data: Partial<FormWizardState['school_details']>) => void;
  errors?: Record<string, string>;
}

export function StepSchoolDetails({
  formData,
  schoolInfo,
  updateSchoolDetails,
  errors = {},
}: StepSchoolDetailsProps) {
  const chosenLevels = formData.school_details.chosen_levels || [];
  const [levelToRemove, setLevelToRemove] = React.useState<LevelId | null>(null);

  const isPrivate = schoolInfo?.status === 'private';

  const handleLevelToggle = (levelId: LevelId) => {
    if (chosenLevels.includes(levelId)) {
      if (chosenLevels.length === 1) {
        return; // At least one level must remain
      }
      // Check if this level has data to prompt warning
      setLevelToRemove(levelId);
    } else {
      updateSchoolDetails({
        chosen_levels: [...chosenLevels, levelId],
      });
    }
  };

  const confirmRemoveLevel = () => {
    if (levelToRemove) {
      updateSchoolDetails({
        chosen_levels: chosenLevels.filter((id) => id !== levelToRemove),
      });
      setLevelToRemove(null);
    }
  };

  // Teachers sum calculation
  const male = Number(formData.school_details.male_teachers) || 0;
  const female = Number(formData.school_details.female_teachers) || 0;
  const total = Number(formData.school_details.total_teachers) || 0;
  const isTeacherSumBalanced = male + female === total && total > 0;

  return (
    <div className="space-y-6">
      {/* Read-Only Admin Pre-filled Details Banner */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <SchoolIcon className="h-4 w-4 text-brand-navy dark:text-brand-gold" />
          <span>School Administrative Profile (Pre-filled by Directorate)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">School Name</span>
            <span className="font-bold text-foreground">{schoolInfo?.name || 'School Name'}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Circuit</span>
            <span className="font-semibold text-foreground">{schoolInfo?.circuits?.name || 'District Circuit'}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">School Status</span>
            <span className="inline-flex items-center gap-1 font-semibold capitalize text-foreground">
              <Shield className="h-3.5 w-3.5 text-brand-midBlue" />
              {schoolInfo?.status === 'private' ? 'Private Institution' : 'Public (Government)'}
            </span>
          </div>
        </div>
      </div>

      {/* 0. Level Selection Section */}
      <div className="p-5 rounded-xl border-2 border-brand-midBlue/30 bg-blue-50/50 dark:bg-slate-900/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-foreground">
            0. Which levels does your school run this year? <span className="text-brand-error">*</span>
          </label>
          <span className="text-xs text-brand-midBlue dark:text-blue-300 font-medium">
            (Select all that apply)
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          The form wizard will automatically adapt to show only the sections matching your selected levels.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {EDUCATION_LEVELS.map((level) => {
            const isChecked = chosenLevels.includes(level.id);
            return (
              <label
                key={level.id}
                className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                  isChecked
                    ? 'border-brand-navy bg-white dark:bg-slate-800 shadow-xs ring-1 ring-brand-navy dark:ring-brand-gold'
                    : 'border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleLevelToggle(level.id)}
                  className="mt-0.5"
                />
                <div className="space-y-0.5 select-none">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{level.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${level.badgeBg}`}>
                      {level.shortLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {level.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        {errors['school_details.chosen_levels'] && (
          <p className="text-xs font-medium text-brand-error">
            {errors['school_details.chosen_levels']}
          </p>
        )}
      </div>

      {/* Main School Details Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* EMIS Code */}
        <div>
          <Input
            label="1. EMIS CODE"
            required
            placeholder="e.g. 1066320014"
            value={formData.school_details.emis_code}
            onChange={(e) => updateSchoolDetails({ emis_code: e.target.value })}
            helperText="Please use the New EMIS Code. Schools without an EMIS code should use 1066329999"
            error={errors['school_details.emis_code']}
          />
        </div>

        {/* Year of Establishment */}
        <div>
          <Input
            label="2. Year of Establishment (School)"
            required
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="e.g. 2005"
            value={formData.school_details.established_year}
            onChange={(e) =>
              updateSchoolDetails({ established_year: e.target.value.replace(/\D/g, '').slice(0, 4) })
            }
            error={errors['school_details.established_year']}
          />
        </div>

        {/* Full Name of Headteacher */}
        <div>
          <Input
            label="3. Full Name of Headteacher"
            required
            placeholder="Enter full name"
            value={formData.school_details.headteacher_name}
            onChange={(e) => updateSchoolDetails({ headteacher_name: e.target.value })}
            error={errors['school_details.headteacher_name']}
          />
        </div>

        {/* Permanent Contact of Headteacher */}
        <div>
          <Input
            label="4. Permanent Contact of Headteacher"
            required
            type="tel"
            inputMode="tel"
            placeholder="e.g. 0244123456"
            value={formData.school_details.headteacher_phone}
            onChange={(e) => updateSchoolDetails({ headteacher_phone: e.target.value })}
            error={errors['school_details.headteacher_phone']}
          />
        </div>

        {/* Name of Assistant Headteacher */}
        <div>
          <Input
            label="5. Name of Assistant Headteacher (Optional)"
            placeholder="Enter assistant full name"
            value={formData.school_details.assistant_name}
            onChange={(e) => updateSchoolDetails({ assistant_name: e.target.value })}
          />
        </div>

        {/* Permanent Contact of Assistant Headteacher */}
        <div>
          <Input
            label="6. Permanent Contact of Assistant Headteacher (Optional)"
            type="tel"
            inputMode="tel"
            placeholder="e.g. 0244123456"
            value={formData.school_details.assistant_phone}
            onChange={(e) => updateSchoolDetails({ assistant_phone: e.target.value })}
          />
        </div>
      </div>

      {/* Teachers Summary Fields */}
      <div className="pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          School-Wide Teaching Staff Summary
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Input
              label="7. Total Teachers (incl. Headteacher)"
              required
              type="number"
              min={0}
              placeholder="e.g. 20"
              value={formData.school_details.total_teachers}
              onChange={(e) => updateSchoolDetails({ total_teachers: e.target.value })}
              error={errors['school_details.total_teachers']}
            />
          </div>

          <div>
            <Input
              label="8. Total Male Teachers"
              required
              type="number"
              min={0}
              placeholder="e.g. 10"
              helperText="If None, enter '0'"
              value={formData.school_details.male_teachers}
              onChange={(e) => updateSchoolDetails({ male_teachers: e.target.value })}
              error={errors['school_details.male_teachers']}
            />
          </div>

          <div>
            <Input
              label="9. Total Female Teachers"
              required
              type="number"
              min={0}
              placeholder="e.g. 10"
              helperText="If None, enter '0'"
              value={formData.school_details.female_teachers}
              onChange={(e) => updateSchoolDetails({ female_teachers: e.target.value })}
              error={errors['school_details.female_teachers']}
            />
          </div>
        </div>

        {/* Balance Status indicator */}
        <div className="mt-3">
          {total > 0 && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                isTeacherSumBalanced
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {isTeacherSumBalanced ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Teacher totals match: {male} Male + {female} Female = {total} Total Teachers.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Discrepancy: {male} Male + {female} Female ({male + female}) does not equal {total} Total Teachers.
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Private School Town Confirmation */}
      {isPrivate && (
        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 uppercase">
            <MapPin className="h-4 w-4 text-amber-600" />
            <span>Private School Requirement: Confirm Town / Location</span>
          </div>
          <Input
            label="Town / Community Location"
            required
            placeholder="e.g. Nyinahin Town"
            value={formData.school_details.town}
            onChange={(e) => updateSchoolDetails({ town: e.target.value })}
            error={errors['school_details.town']}
          />
        </div>
      )}

      {/* Level Removal Warning Modal */}
      <Dialog open={!!levelToRemove} onOpenChange={() => setLevelToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-error">
              <AlertCircle className="h-5 w-5" />
              Remove Level Confirmation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this education level from your school&apos;s current submission? Any draft figures entered for this level will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLevelToRemove(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoveLevel}>
              Yes, Remove Level
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
