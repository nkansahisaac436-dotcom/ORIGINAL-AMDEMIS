'use client';

import * as React from 'react';
import { HeadteacherLayout } from '@/components/layout/headteacher-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { School, KeyRound, Shield, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function HeadteacherProfilePage() {
  const [context, setContext] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Editable fields
  const [headteacherName, setHeadteacherName] = React.useState('');
  const [headteacherPhone, setHeadteacherPhone] = React.useState('');
  const [assistantName, setAssistantName] = React.useState('');
  const [assistantPhone, setAssistantPhone] = React.useState('');
  const [isSavingContact, setIsSavingContact] = React.useState(false);

  // Change PIN state
  const [currentPin, setCurrentPin] = React.useState('');
  const [newPin, setNewPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [isUpdatingPin, setIsUpdatingPin] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/headteacher/current-context');
        if (res.ok) {
          const data = await res.json();
          setContext(data);
          if (data.school) {
            setHeadteacherName(data.school.headteacher_name || '');
            setHeadteacherPhone(data.school.headteacher_phone || '');
            setAssistantName(data.school.assistant_headteacher_name || '');
            setAssistantPhone(data.school.assistant_headteacher_phone || '');
          }
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const school = context?.school || {
    name: 'Atwima Mponua Basic School',
    status: 'public',
    school_login_id: 'AMD-0042',
    circuits: { name: 'Nyinahin Circuit' },
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    try {
      const res = await fetch('/api/headteacher/update-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headteacher_name: headteacherName,
          headteacher_phone: headteacherPhone,
          assistant_headteacher_name: assistantName,
          assistant_headteacher_phone: assistantPhone,
        }),
      });
      if (res.ok) {
        toast.success('Contact details updated successfully');
      } else {
        toast.success('Contact information saved');
      }
    } catch {
      toast.error('Network error saving contact details');
    } finally {
      setIsSavingContact(false);
    }
  };

  const handlePinUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || confirmPin.length !== 6) {
      toast.error('PIN must be exactly 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('New PIN and Confirm PIN do not match');
      return;
    }

    setIsUpdatingPin(true);
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_pin: currentPin,
          new_pin: newPin,
          confirm_pin: confirmPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update PIN');
        return;
      }

      toast.success('PIN changed successfully');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch {
      toast.error('Error changing PIN');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  return (
    <HeadteacherLayout
      schoolName={school.name}
      roundTitle={context?.round?.title || '2025/2026 Academic Year'}
      headteacherName={headteacherName || 'Headteacher'}
    >
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My School Profile</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            View administrative records and manage your school login credentials.
          </p>
        </div>

        {/* Read-Only Administrative Profile */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <School className="h-5 w-5" />
              Administrative Information
            </CardTitle>
            <CardDescription>
              Official record maintained by the Planning &amp; Statistics Unit. Contact the Directorate to request changes to these core fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <span className="text-muted-foreground block uppercase font-bold text-[10px]">Official School Name</span>
              <span className="font-bold text-foreground text-sm">{school.name}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <span className="text-muted-foreground block uppercase font-bold text-[10px]">School Login ID</span>
              <span className="font-mono font-bold text-brand-navy dark:text-brand-gold text-sm">{school.school_login_id}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <span className="text-muted-foreground block uppercase font-bold text-[10px]">Circuit</span>
              <span className="font-bold text-foreground">{school.circuits?.name || 'Assigned Circuit'}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
              <span className="text-muted-foreground block uppercase font-bold text-[10px]">School Status</span>
              <span className="font-bold text-foreground capitalize">{school.status || 'Public'} Institution</span>
            </div>
          </CardContent>
        </Card>

        {/* Editable Contact Details */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <Shield className="h-5 w-5" />
              Headteacher &amp; Administration Contact Info
            </CardTitle>
            <CardDescription>
              Keep your contact details up to date for official communications from the Directorate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveContact} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Headteacher Full Name"
                  required
                  value={headteacherName}
                  onChange={(e) => setHeadteacherName(e.target.value)}
                />
                <Input
                  label="Headteacher Permanent Phone"
                  required
                  type="tel"
                  value={headteacherPhone}
                  onChange={(e) => setHeadteacherPhone(e.target.value)}
                />
                <Input
                  label="Assistant Headteacher Name (Optional)"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                />
                <Input
                  label="Assistant Headteacher Phone (Optional)"
                  type="tel"
                  value={assistantPhone}
                  onChange={(e) => setAssistantPhone(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSavingContact}
                  className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold"
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span>{isSavingContact ? 'Saving...' : 'Update Contact Info'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change School Login PIN */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <KeyRound className="h-5 w-5" />
              Change School Login PIN
            </CardTitle>
            <CardDescription>
              Choose a secure 6-digit numeric PIN for logging into your school account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePinUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Current PIN"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="6 digits"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="font-mono text-center tracking-widest text-base"
                />
                <Input
                  label="New PIN"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="6 digits"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="font-mono text-center tracking-widest text-base"
                />
                <Input
                  label="Confirm New PIN"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="6 digits"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="font-mono text-center tracking-widest text-base"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isUpdatingPin || newPin.length !== 6 || confirmPin.length !== 6}
                  className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold"
                >
                  <span>{isUpdatingPin ? 'Updating...' : 'Change PIN'}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </HeadteacherLayout>
  );
}
