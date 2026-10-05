'use client';

import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Save, Wifi, Lock, ShieldCheck, AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'headteacher' | 'admin'>('headteacher');

  // Headteacher form state
  const [schoolLoginId, setSchoolLoginId] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [showPin, setShowPin] = React.useState(false);

  // Admin form state
  const [adminEmail, setAdminEmail] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  // Common state
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [isSendingForgot, setIsSendingForgot] = React.useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = React.useState<string | null>(null);

  // Initial PIN change modal
  const [showInitialPinModal, setShowInitialPinModal] = React.useState(false);
  const [newPin, setNewPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [isChangingPin, setIsChangingPin] = React.useState(false);

  const handleHeadteacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const formattedId = schoolLoginId.trim().toUpperCase();
      const res = await fetch('/api/auth/headteacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_login_id: formattedId,
          pin: pin.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Wrong School Login ID or PIN. Check your slip and try again.');
        setIsLoading(false);
        return;
      }

      if (data.is_initial_pin) {
        setShowInitialPinModal(true);
        setIsLoading(false);
        return;
      }

      toast.success('Signed in successfully');
      router.push('/headteacher/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail.trim(),
          password: adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Wrong email or password.');
        setIsLoading(false);
        return;
      }

      toast.success('Signed in successfully');
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingForgot(true);
    setForgotSuccessMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotSuccessMessage(data.message || 'Password reset link sent to your email.');
    } catch {
      setForgotSuccessMessage('Unable to send reset email. Please contact the Directorate.');
    } finally {
      setIsSendingForgot(false);
    }
  };

  const handleInitialPinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || confirmPin.length !== 6) {
      toast.error('PIN must be exactly 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    if (newPin === pin) {
      toast.error('New PIN must be different from current PIN');
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_pin: pin,
          new_pin: newPin,
          confirm_pin: confirmPin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update PIN');
        return;
      }

      toast.success('PIN changed successfully. Welcome to AMDEMIS!');
      setShowInitialPinModal(false);
      router.push('/headteacher/dashboard');
      router.refresh();
    } catch {
      toast.error('Error changing PIN');
    } finally {
      setIsChangingPin(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#EEF3FB] dark:bg-[#0B132B]">
      {/* Full-width Directorate Banner with 4px Gold Bottom Border */}
      <header className="relative w-full border-b-4 border-brand-gold shadow-md bg-brand-navy overflow-hidden">
        <div className="relative w-full h-24 sm:h-32 md:h-40">
          <Image
            src="/branding/banner.jpg"
            alt="Atwima Mponua District Education Directorate - Planning & Statistics Unit Banner"
            fill
            priority
            className="object-cover object-center"
          />
        </div>
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Card Column: On mobile, displayed first */}
          <div className="order-1 lg:order-2 lg:col-span-5">
            <Card className="shadow-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
              {/* Tab Selector Toggle */}
              <div className="p-3 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <div
                  role="tablist"
                  className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-xl"
                  aria-label="User sign in role selector"
                >
                  <button
                    type="button"
                    role="tab"
                    id="tab-headteacher"
                    aria-selected={activeTab === 'headteacher'}
                    aria-controls="panel-headteacher"
                    onClick={() => {
                      setActiveTab('headteacher');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'headteacher'
                        ? 'bg-brand-navy text-white shadow-sm ring-1 ring-brand-navy dark:bg-brand-midBlue'
                        : 'text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Headteacher
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-admin"
                    aria-selected={activeTab === 'admin'}
                    aria-controls="panel-admin"
                    onClick={() => {
                      setActiveTab('admin');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      activeTab === 'admin'
                        ? 'bg-brand-navy text-white shadow-sm ring-1 ring-brand-navy dark:bg-brand-midBlue'
                        : 'text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Error Banner */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-brand-error text-sm flex items-start gap-2.5"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                )}

                {/* Headteacher Form */}
                {activeTab === 'headteacher' && (
                  <div
                    id="panel-headteacher"
                    role="tabpanel"
                    aria-labelledby="tab-headteacher"
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Headteacher sign in</h2>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        Use the School Login ID and PIN you received from the Planning & Statistics Unit.
                      </p>
                    </div>

                    <form onSubmit={handleHeadteacherSubmit} className="space-y-4">
                      <div>
                        <Input
                          label="School Login ID"
                          id="school-login-id"
                          type="text"
                          required
                          placeholder="AMD-0042"
                          value={schoolLoginId}
                          onChange={(e) => setSchoolLoginId(e.target.value.toUpperCase())}
                          autoCapitalize="characters"
                          autoComplete="username"
                          className="font-mono text-base tracking-wider uppercase"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="headteacher-pin"
                          className="block text-sm font-medium text-foreground"
                        >
                          PIN <span className="text-brand-error">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="headteacher-pin"
                            type={showPin ? 'text' : 'password'}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            required
                            placeholder="6-digit PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            autoComplete="current-password"
                            className="flex h-11 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 pr-11 text-base tracking-widest font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:border-brand-midBlue"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                          >
                            {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || !schoolLoginId || pin.length < 6}
                        className="w-full h-12 text-base font-bold bg-brand-navy hover:bg-brand-midBlue text-white border-b-4 border-brand-gold mt-2 transition-all shadow"
                      >
                        {isLoading ? 'Verifying credentials...' : 'Sign in'}
                      </Button>

                      <div className="pt-2 text-center">
                        <p className="text-xs text-muted-foreground leading-relaxed flex items-center justify-center gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5 shrink-0 text-brand-gold" />
                          <span>Lost your PIN or changed schools? Ask the Planning & Statistics Unit to reset it.</span>
                        </p>
                      </div>
                    </form>
                  </div>
                )}

                {/* Admin Form */}
                {activeTab === 'admin' && (
                  <div
                    id="panel-admin"
                    role="tabpanel"
                    aria-labelledby="tab-admin"
                    className="space-y-5"
                  >
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Admin sign in</h2>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        For Directorate administrators and district officers.
                      </p>
                    </div>

                    <form onSubmit={handleAdminSubmit} className="space-y-4">
                      <div>
                        <Input
                          label="Email"
                          id="admin-email"
                          type="email"
                          required
                          placeholder="officer@amdemis.local"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="admin-password"
                            className="block text-sm font-medium text-foreground"
                          >
                            Password <span className="text-brand-error">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotModal(true);
                              setForgotSuccessMessage(null);
                              setForgotEmail(adminEmail);
                            }}
                            className="text-xs font-semibold text-brand-midBlue hover:text-brand-navy hover:underline dark:text-blue-400"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            id="admin-password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            autoComplete="current-password"
                            className="flex h-11 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 pr-11 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:border-brand-midBlue"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isLoading || !adminEmail || !adminPassword}
                        className="w-full h-12 text-base font-bold bg-brand-navy hover:bg-brand-midBlue text-white border-b-4 border-brand-gold mt-2 transition-all shadow"
                      >
                        {isLoading ? 'Authenticating...' : 'Sign in'}
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Left Column (Desktop): Information and benefits */}
          <div className="order-2 lg:order-1 lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-navy/10 dark:bg-brand-navy/40 border border-brand-navy/20 text-brand-navy dark:text-blue-200 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4 text-brand-gold" />
              <span>Official District Education MIS Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
              Annual school data collection, <span className="text-brand-midBlue dark:text-blue-400">made simple</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
              AMDEMIS replaces the long Google Form. Fill in your school&apos;s figures step by step and the Planning &amp; Statistics Unit receives them in one place.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5 bg-white/70 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 shrink-0 mt-0.5">
                  <Save className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Save a draft and come back later</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your answers auto-save locally and sync securely whenever you connect.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white/70 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 shrink-0 mt-0.5">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Works on your phone even on a slow network</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Lightweight mobile-first interface optimized for Ghana district network conditions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 bg-white/70 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="p-2 rounded-lg bg-blue-100 text-brand-navy dark:bg-blue-900/50 dark:text-blue-300 shrink-0 mt-0.5">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Your school&apos;s data is visible only to you and the Directorate</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Protected with strict Row-Level Security. Headteachers access only their designated school.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notice */}
      <footer className="w-full mt-auto py-6 px-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-muted-foreground">
        <p className="max-w-3xl mx-auto">
          Atwima Mponua District Education Directorate, Planning &amp; Statistics Unit. We collect only the data needed for district planning.
        </p>
      </footer>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Admin Password</DialogTitle>
            <DialogDescription>
              Enter the email address registered with your district admin account.
            </DialogDescription>
          </DialogHeader>

          {forgotSuccessMessage ? (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>{forgotSuccessMessage}</span>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-2">
              <Input
                label="Registered Email"
                type="email"
                required
                placeholder="officer@amdemis.local"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSendingForgot || !forgotEmail}>
                  {isSendingForgot ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Mandatory Initial PIN Change Dialog for Headteacher */}
      <Dialog open={showInitialPinModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <Lock className="h-5 w-5" />
              First Login: Change Your Temporary PIN
            </DialogTitle>
            <DialogDescription>
              For the security of your school&apos;s data, you must choose a new 6-digit PIN before proceeding.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInitialPinChange} className="space-y-4 mt-2">
            <div>
              <Input
                label="New 6-digit PIN"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                placeholder="e.g. 849201"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono tracking-widest text-center text-lg"
              />
            </div>
            <div>
              <Input
                label="Confirm New PIN"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                placeholder="Re-enter 6-digit PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono tracking-widest text-center text-lg"
              />
            </div>

            <Button
              type="submit"
              disabled={isChangingPin || newPin.length !== 6 || confirmPin.length !== 6}
              className="w-full bg-brand-navy hover:bg-brand-midBlue text-white font-bold h-11 border-b-2 border-brand-gold"
            >
              {isChangingPin ? 'Updating PIN...' : 'Save New PIN & Continue'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
