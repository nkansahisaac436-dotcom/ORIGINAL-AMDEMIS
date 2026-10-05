'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { HeadteacherLayout } from '@/components/layout/headteacher-layout';
import { HorizontalStepper, StepItem } from '@/components/wizard/stepper';
import { ProgressRing } from '@/components/wizard/progress-ring';
import { SectionsOverview } from '@/components/wizard/sections-overview';
import { StepSchoolDetails } from '@/components/wizard/step-school-details';
import { StepCreche } from '@/components/wizard/step-creche';
import { StepKG } from '@/components/wizard/step-kg';
import { StepPrimary } from '@/components/wizard/step-primary';
import { StepJHS } from '@/components/wizard/step-jhs';
import { StepInfrastructure } from '@/components/wizard/step-infrastructure';
import { StepReview } from '@/components/wizard/step-review';
import { SubmissionReceiptModal } from '@/components/wizard/submission-receipt-modal';
import { FormWizardState, School, CollectionRound } from '@/types';
import { getInitialFormData } from '@/lib/form-default-state';
import { getLevelName } from '@/lib/levels-config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, Save, ArrowRight, ArrowLeft, BookOpen, CheckCircle, Circle } from 'lucide-react';
import { toast } from 'sonner';

export default function HeadteacherFormWizardPage() {
  const router = useRouter();

  // Loading & context
  const [isLoadingContext, setIsLoadingContext] = React.useState(true);
  const [school, setSchool] = React.useState<Partial<School>>({});
  const [round, setRound] = React.useState<Partial<CollectionRound>>({
    id: 'mock-round',
    title: '2025/2026 Academic Year',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
  const [headteacherName, setHeadteacherName] = React.useState('Headteacher');

  // Form State
  const [formData, setFormData] = React.useState<FormWizardState>(getInitialFormData());
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Receipt Modal State
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<any>(null);

  // Fetch initial context
  React.useEffect(() => {
    async function loadContext() {
      try {
        const res = await fetch('/api/headteacher/current-context');
        if (res.ok) {
          const data = await res.json();
          if (data.school) setSchool(data.school);
          if (data.round) setRound(data.round);
          if (data.headteacher_name) setHeadteacherName(data.headteacher_name);

          // Check if there is local draft or server draft
          const localDraftKey = `amdemis_draft_${data.school?.id || 'default'}_${data.round?.id || 'default'}`;
          const localSaved = localStorage.getItem(localDraftKey);

          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              setFormData(parsed);
            } catch {
              setFormData(getInitialFormData(data.school));
            }
          } else {
            setFormData(getInitialFormData(data.school));
          }
        }
      } catch {
        // Use default form data
        setFormData(getInitialFormData());
      } finally {
        setIsLoadingContext(false);
      }
    }
    loadContext();
  }, []);

  // Auto-save locally to localStorage on every change
  React.useEffect(() => {
    if (school.id && round.id) {
      const localDraftKey = `amdemis_draft_${school.id}_${round.id}`;
      localStorage.setItem(localDraftKey, JSON.stringify(formData));
    }
  }, [formData, school.id, round.id]);

  // Construct dynamic steps based on chosen levels
  const chosenLevels = formData.school_details.chosen_levels || [];

  const dynamicSteps: StepItem[] = React.useMemo(() => {
    const list: StepItem[] = [
      {
        id: 'school_details',
        title: 'School Details',
        shortTitle: 'School Details',
        isComplete: !!formData.school_details.emis_code && !!formData.school_details.headteacher_name,
      },
    ];

    if (chosenLevels.includes('creche')) {
      list.push({
        id: 'creche',
        title: 'Crèche / Nursery Section',
        shortTitle: 'Crèche',
        isComplete: !!formData.creche.boys || !!formData.creche.girls,
      });
    }

    if (chosenLevels.includes('kg')) {
      list.push({
        id: 'kg',
        title: 'KG Section',
        shortTitle: 'KG Section',
        isComplete: !!formData.kg.enrolment.kg1_boys || !!formData.kg.enrolment.kg2_boys,
      });
    }

    if (chosenLevels.includes('primary')) {
      list.push({
        id: 'primary',
        title: 'Primary Section',
        shortTitle: 'Primary Section',
        isComplete: !!formData.primary.enrolment.bs1_boys || !!formData.primary.enrolment.bs2_boys,
      });
    }

    if (chosenLevels.includes('jhs')) {
      list.push({
        id: 'jhs',
        title: 'JHS Section',
        shortTitle: 'JHS Section',
        isComplete: !!formData.jhs.enrolment.jhs1_boys || !!formData.jhs.enrolment.jhs2_boys,
      });
    }

    list.push({
      id: 'infrastructure',
      title: 'Infrastructure & Utilities',
      shortTitle: 'Infrastructure',
      isComplete: !!formData.infrastructure.ict_lab,
    });

    list.push({
      id: 'review',
      title: 'Review & Submit',
      shortTitle: 'Review & Submit',
      isComplete: formData.confirmed,
    });

    return list;
  }, [chosenLevels, formData]);

  // Ensure current step index stays in bounds
  React.useEffect(() => {
    if (currentStepIndex >= dynamicSteps.length) {
      setCurrentStepIndex(Math.max(0, dynamicSteps.length - 1));
    }
  }, [dynamicSteps.length, currentStepIndex]);

  const currentStep = dynamicSteps[currentStepIndex] || dynamicSteps[0];

  // Calculate overall form completion percentage
  const completedCount = dynamicSteps.filter((s, idx) => idx < currentStepIndex || s.isComplete).length;
  const progressPercent = Math.round((completedCount / dynamicSteps.length) * 100);

  // Updaters
  const updateSchoolDetails = (data: Partial<FormWizardState['school_details']>) => {
    setFormData((prev) => ({
      ...prev,
      school_details: { ...prev.school_details, ...data },
    }));
  };

  const updateCreche = (data: Partial<FormWizardState['creche']>) => {
    setFormData((prev) => ({
      ...prev,
      creche: { ...prev.creche, ...data },
    }));
  };

  const updateKG = (data: Partial<FormWizardState['kg']>) => {
    setFormData((prev) => ({
      ...prev,
      kg: { ...prev.kg, ...data },
    }));
  };

  const updatePrimary = (data: Partial<FormWizardState['primary']>) => {
    setFormData((prev) => ({
      ...prev,
      primary: { ...prev.primary, ...data },
    }));
  };

  const updateJHS = (data: Partial<FormWizardState['jhs']>) => {
    setFormData((prev) => ({
      ...prev,
      jhs: { ...prev.jhs, ...data },
    }));
  };

  const updateInfrastructure = (data: Partial<FormWizardState['infrastructure']>) => {
    setFormData((prev) => ({
      ...prev,
      infrastructure: { ...prev.infrastructure, ...data },
    }));
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const res = await fetch('/api/submissions/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          roundId: round.id,
        }),
      });

      if (res.ok) {
        toast.success('Draft saved securely to Directorate servers');
      } else {
        toast.info('Saved locally on device (will sync when online)');
      }
    } catch {
      toast.info('Saved locally on device (offline mode)');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < dynamicSteps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigateToStep = (stepId: string) => {
    const idx = dynamicSteps.findIndex((s) => s.id === stepId);
    if (idx !== -1) {
      setCurrentStepIndex(idx);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitFinal = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          roundId: round.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit data');
        setIsSubmitting(false);
        return;
      }

      // Clear local draft
      if (school.id && round.id) {
        localStorage.removeItem(`amdemis_draft_${school.id}_${round.id}`);
      }

      setReceiptData(data);
      setReceiptOpen(true);
      toast.success('Annual statistics submitted successfully!');
    } catch {
      toast.error('Network error during submission. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStepTitle =
    currentStepIndex < dynamicSteps.length - 1
      ? dynamicSteps[currentStepIndex + 1].shortTitle
      : null;

  return (
    <HeadteacherLayout
      schoolName={school.name || 'Atwima Mponua Basic School'}
      roundTitle={round.title || '2025/2026 Academic Year'}
      headteacherName={headteacherName}
    >
      <div className="space-y-6">
        {/* Top Horizontal Stepper */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <HorizontalStepper
            steps={dynamicSteps}
            currentStepIndex={currentStepIndex}
            onStepClick={(idx) => setCurrentStepIndex(idx)}
          />
        </div>

        {/* 3-Column Layout Matching Interface.png (Left Progress, Center Form, Right Guide) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Progress Ring & Section Checklist */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-5 space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Form Progress
                </h3>

                {/* Circular Progress Ring */}
                <div className="flex justify-center py-1">
                  <ProgressRing progress={progressPercent} size={130} strokeWidth={11} />
                </div>

                {/* Section Checklist */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {dynamicSteps.map((step, idx) => {
                    const isCurrent = idx === currentStepIndex;
                    const isCompleted = idx < currentStepIndex || step.isComplete;

                    return (
                      <button
                        key={`chk-${step.id}`}
                        type="button"
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`flex items-center gap-2.5 w-full text-left text-xs transition-colors p-1.5 rounded-lg ${
                          isCurrent
                            ? 'font-bold text-brand-midBlue dark:text-brand-gold bg-blue-50 dark:bg-slate-800'
                            : isCompleted
                            ? 'text-foreground font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : 'text-muted-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {isCompleted ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-brand-midBlue dark:bg-brand-gold text-white dark:text-brand-navy flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold">✓</span>
                          </div>
                        ) : isCurrent ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-brand-midBlue dark:border-brand-gold shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <span className="truncate">{step.title}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Need Help Card */}
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
              <CardContent className="p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-foreground">Need Help?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Check the guideline document or contact the Planning &amp; Statistics Unit.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/headteacher/guidelines')}
                  className="w-full text-xs font-bold text-brand-navy dark:text-blue-300 border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>View Guidelines</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Center Column: The Active Form Step */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              {/* Step Title Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-foreground">
                  {currentStep.title}
                </h2>

                {/* Light Blue Info Box from Interface.png */}
                <div className="mt-3 p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-brand-midBlue dark:text-blue-300 text-xs flex items-center gap-2.5">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>Please fill in all required fields. You can save and continue later.</span>
                </div>
              </div>

              <CardContent className="p-5 sm:p-6">
                {/* Step Switcher */}
                {currentStep.id === 'school_details' && (
                  <StepSchoolDetails
                    formData={formData}
                    schoolInfo={school}
                    updateSchoolDetails={updateSchoolDetails}
                    errors={errors}
                  />
                )}

                {currentStep.id === 'creche' && (
                  <StepCreche
                    formData={formData}
                    updateCreche={updateCreche}
                    errors={errors}
                  />
                )}

                {currentStep.id === 'kg' && (
                  <StepKG
                    formData={formData}
                    updateKG={updateKG}
                    errors={errors}
                  />
                )}

                {currentStep.id === 'primary' && (
                  <StepPrimary
                    formData={formData}
                    updatePrimary={updatePrimary}
                    errors={errors}
                  />
                )}

                {currentStep.id === 'jhs' && (
                  <StepJHS
                    formData={formData}
                    updateJHS={updateJHS}
                    errors={errors}
                  />
                )}

                {currentStep.id === 'infrastructure' && (
                  <StepInfrastructure
                    formData={formData}
                    updateInfrastructure={updateInfrastructure}
                    errors={errors}
                  />
                )}

                {currentStep.id === 'review' && (
                  <StepReview
                    formData={formData}
                    schoolInfo={school}
                    onConfirmChange={(confirmed) =>
                      setFormData((prev) => ({ ...prev, confirmed }))
                    }
                    onSubmit={handleSubmitFinal}
                    isSubmitting={isSubmitting}
                    onNavigateToStep={handleNavigateToStep}
                  />
                )}

                {/* Bottom Form Navigation Buttons (Save & Exit, Back, Next) */}
                {currentStep.id !== 'review' && (
                  <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft}
                      className="w-full sm:w-auto text-xs font-bold border-slate-300 dark:border-slate-700 flex items-center justify-center gap-1.5 order-2 sm:order-1"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSavingDraft ? 'Saving Draft...' : 'Save & Exit'}</span>
                    </Button>

                    <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                      {currentStepIndex > 0 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handlePreviousStep}
                          className="flex-1 sm:flex-initial text-xs font-semibold"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          <span>Back</span>
                        </Button>
                      )}

                      <Button
                        type="button"
                        onClick={handleNextStep}
                        className="flex-1 sm:flex-initial bg-brand-navy hover:bg-brand-midBlue text-white font-bold text-xs h-11 px-5 border-b-2 border-brand-gold flex items-center justify-center gap-1.5"
                      >
                        <span>Next: {nextStepTitle}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Form Guide, Sections Overview, Important Note Box */}
          <div className="lg:col-span-3 space-y-4">
            <SectionsOverview
              steps={dynamicSteps}
              deadlineDate={
                round.deadline
                  ? new Date(round.deadline).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '10th October, 2026'
              }
            />
          </div>
        </div>
      </div>

      {/* Submission Receipt Modal */}
      {receiptData && (
        <SubmissionReceiptModal
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
          submissionId={receiptData.submissionId}
          submittedAt={receiptData.submittedAt}
          schoolName={receiptData.schoolName}
          circuitName={receiptData.circuitName}
          emisCode={receiptData.emisCode}
          roundTitle={receiptData.roundTitle}
          totalPupils={receiptData.totalPupils}
          totalTeachers={receiptData.totalTeachers}
        />
      )}
    </HeadteacherLayout>
  );
}
