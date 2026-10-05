'use client';

import * as React from 'react';
import { FormWizardState } from '@/types';
import { Building2, Zap, Droplets, Laptop, BookMarked, DoorOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepInfrastructureProps {
  formData: FormWizardState;
  updateInfrastructure: (data: Partial<FormWizardState['infrastructure']>) => void;
  errors?: Record<string, string>;
}

export function StepInfrastructure({
  formData,
  updateInfrastructure,
}: StepInfrastructureProps) {
  const infra = formData.infrastructure;

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          School Facilities &amp; Utilities Ownership
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Indicate the status of facilities, laboratories, and functional utilities available at your school.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* ICT Lab */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center gap-2 text-brand-navy dark:text-blue-300 font-bold text-sm">
            <Laptop className="h-4 w-4 text-brand-midBlue" />
            <span>Number of ICT Labs</span>
          </div>
          <p className="text-xs text-muted-foreground">Select whether your school has a functional ICT lab</p>
          <Select
            value={infra.ict_lab}
            onValueChange={(val: '1' | 'N/A') => updateInfrastructure({ ict_lab: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 (Available)</SelectItem>
              <SelectItem value="N/A">N/A (Not Available)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Staff Common Room */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center gap-2 text-brand-navy dark:text-blue-300 font-bold text-sm">
            <DoorOpen className="h-4 w-4 text-brand-midBlue" />
            <span>Staff Common Room</span>
          </div>
          <p className="text-xs text-muted-foreground">Does the school have a designated staff common room?</p>
          <Select
            value={infra.staff_common_room ? 'yes' : 'no'}
            onValueChange={(val) => updateInfrastructure({ staff_common_room: val === 'yes' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Library */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center gap-2 text-brand-navy dark:text-blue-300 font-bold text-sm">
            <BookMarked className="h-4 w-4 text-brand-midBlue" />
            <span>Number of Library</span>
          </div>
          <p className="text-xs text-muted-foreground">Select whether your school has a library facility</p>
          <Select
            value={infra.library}
            onValueChange={(val: '1' | 'N/A') => updateInfrastructure({ library: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 (Available)</SelectItem>
              <SelectItem value="N/A">N/A (Not Available)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Functional Electricity */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center gap-2 text-brand-navy dark:text-blue-300 font-bold text-sm">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Functional Electricity</span>
          </div>
          <p className="text-xs text-muted-foreground">Is functional electricity connected to the school premises?</p>
          <Select
            value={infra.electricity ? 'yes' : 'no'}
            onValueChange={(val) => updateInfrastructure({ electricity: val === 'yes' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Potable Water */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center gap-2 text-brand-navy dark:text-blue-300 font-bold text-sm">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span>Potable Water</span>
          </div>
          <p className="text-xs text-muted-foreground">Is treated or clean potable water available on site?</p>
          <Select
            value={infra.potable_water ? 'yes' : 'no'}
            onValueChange={(val) => updateInfrastructure({ potable_water: val === 'yes' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Toilet Facility Owned */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center gap-2 text-brand-navy dark:text-blue-300 font-bold text-sm">
            <Building2 className="h-4 w-4 text-brand-midBlue" />
            <span>Toilet Facility Owned</span>
          </div>
          <p className="text-xs text-muted-foreground">Does the school own its toilet facilities?</p>
          <Select
            value={infra.toilet_facility ? 'yes' : 'no'}
            onValueChange={(val) => updateInfrastructure({ toilet_facility: val === 'yes' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Urinal Facility Owned */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 sm:col-span-2">
          <div className="flex items-center gap-2 text-brand-navy dark:text-blue-300 font-bold text-sm">
            <Building2 className="h-4 w-4 text-brand-midBlue" />
            <span>Urinal Facility Owned</span>
          </div>
          <p className="text-xs text-muted-foreground">Does the school own its urinal facilities?</p>
          <Select
            value={infra.urinal_facility ? 'yes' : 'no'}
            onValueChange={(val) => updateInfrastructure({ urinal_facility: val === 'yes' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
