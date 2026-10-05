'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  id: string;
  title: string;
  shortTitle: string;
  isComplete: boolean;
}

interface StepperProps {
  steps: StepItem[];
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

export function HorizontalStepper({
  steps,
  currentStepIndex,
  onStepClick,
}: StepperProps) {
  return (
    <div className="w-full overflow-x-auto py-2 px-1">
      <div className="flex items-center min-w-max justify-between max-w-4xl mx-auto">
        {steps.map((step, idx) => {
          const isCurrent = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex || step.isComplete;
          const isAccessible = idx <= currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle & Title */}
              <button
                type="button"
                onClick={() => isAccessible && onStepClick && onStepClick(idx)}
                disabled={!isAccessible}
                className={cn(
                  'flex flex-col items-center group focus:outline-none transition-all',
                  !isAccessible && 'opacity-60 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xs',
                    isCurrent
                      ? 'bg-brand-midBlue text-white ring-4 ring-blue-100 dark:ring-blue-900/50'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1.5 font-medium whitespace-nowrap transition-colors',
                    isCurrent
                      ? 'font-bold text-brand-navy dark:text-brand-gold'
                      : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.shortTitle}
                </span>
              </button>

              {/* Connecting line between steps */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 min-w-[24px] sm:min-w-[40px] transition-colors',
                    idx < currentStepIndex
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
