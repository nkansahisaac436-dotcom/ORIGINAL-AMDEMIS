'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  School,
  FileEdit,
  FileCheck2,
  History,
  BookOpen,
  HelpCircle,
  Bell,
  Menu,
  X,
  LogOut,
  KeyRound,
  ChevronDown,
  User,
  ShieldAlert,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface HeadteacherLayoutProps {
  children: React.ReactNode;
  schoolName?: string;
  roundTitle?: string;
  headteacherName?: string;
}

export function HeadteacherLayout({
  children,
  schoolName = 'Atwima Mponua Basic School',
  roundTitle = '2025/2026 Academic Year',
  headteacherName = 'Headteacher',
}: HeadteacherLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  // Change PIN modal state
  const [changePinOpen, setChangePinOpen] = React.useState(false);
  const [currentPin, setCurrentPin] = React.useState('');
  const [newPin, setNewPin] = React.useState('');
  const [confirmPin, setConfirmPin] = React.useState('');
  const [isUpdatingPin, setIsUpdatingPin] = React.useState(false);

  // Mock / dynamic notifications
  const [notifications, setNotifications] = React.useState([
    {
      id: '1',
      title: 'Submission Deadline Reminder',
      message: 'The annual data collection window closes on October 10th. Please submit your draft on time.',
      time: '2 hours ago',
      unread: true,
      type: 'deadline',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const currentYear = new Date().getFullYear();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      toast.success('Signed out');
      router.push('/');
      router.refresh();
    } catch {
      router.push('/');
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
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
      setChangePinOpen(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch {
      toast.error('Error changing PIN');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  const navItems = [
    { section: 'DASHBOARD' },
    {
      label: 'Dashboard',
      href: '/headteacher/dashboard',
      icon: LayoutDashboard,
    },
    { section: 'SCHOOL' },
    {
      label: 'My School Profile',
      href: '/headteacher/profile',
      icon: School,
    },
    { section: 'DATA COLLECTION' },
    {
      label: 'Start / Continue Form',
      href: '/headteacher/form',
      icon: FileEdit,
      isPrimaryAction: true,
    },
    {
      label: 'My Submissions',
      href: '/headteacher/submissions',
      icon: FileCheck2,
    },
    {
      label: 'Previous Years',
      href: '/headteacher/previous-years',
      icon: History,
    },
    { section: 'SUPPORT' },
    {
      label: 'Guidelines',
      href: '/headteacher/guidelines',
      icon: BookOpen,
    },
    {
      label: 'Help & Support',
      href: '/headteacher/help',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#EEF3FB] dark:bg-[#0B132B]">
      {/* Desktop Sidebar (Navy brand: #0A2A66) */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0A2A66] text-white shrink-0 border-r border-[#061A40]">
        {/* Directorate Logo & Header */}
        <div className="p-5 border-b border-white/10 flex items-center gap-3.5">
          <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-brand-gold/60 bg-white p-1">
            <Image
              src="/branding/coat_of_arms.png"
              alt="Atwima Mponua District Education Directorate"
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-xs font-bold uppercase tracking-wider text-brand-gold">
              Atwima Mponua
            </h1>
            <p className="text-[11px] font-semibold uppercase tracking-tight text-white leading-tight">
              District Education Directorate
            </p>
            <p className="text-[10px] text-blue-200 mt-0.5">
              Planning &amp; Statistics Unit
            </p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div
                  key={`sec-${idx}`}
                  className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-blue-300/80 uppercase"
                >
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href;

            if (item.isPrimaryAction) {
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-brand-gold text-brand-navy shadow-md ring-2 ring-white/20'
                      : 'bg-brand-gold/15 text-brand-gold hover:bg-brand-gold hover:text-brand-navy border border-brand-gold/40'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-midBlue text-white font-semibold'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-blue-300" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 text-[11px] text-blue-200/70 text-center">
          © {currentYear} AMDED - Planning &amp; Statistics Unit. All rights reserved.
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Active Collection Round Title */}
            <h2 className="text-base sm:text-lg font-bold text-brand-navy dark:text-white truncate">
              Data Collection – {roundTitle}
            </h2>
          </div>

          {/* Right Header Actions: Theme Toggle, Notifications, User Chip */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={`Notifications, ${unreadCount} unread`}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-error text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* User Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center ring-1 ring-brand-gold">
                  {getInitials(headteacherName)}
                </div>
                <div className="hidden md:block max-w-[150px] truncate">
                  <p className="text-xs font-bold text-foreground leading-tight">Headteacher</p>
                  <p className="text-[11px] text-muted-foreground truncate">{schoolName}</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 z-50 text-sm">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-foreground truncate">{headteacherName}</p>
                      <p className="text-xs text-muted-foreground truncate">{schoolName}</p>
                    </div>
                    <Link
                      href="/headteacher/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>My School Profile</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setChangePinOpen(true);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground text-left"
                    >
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <span>Change PIN</span>
                    </button>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-brand-error text-left font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-4/5 max-w-xs bg-brand-navy text-white h-full z-50 p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white p-0.5">
                  <Image
                    src="/branding/coat_of_arms.png"
                    alt="Coat of arms"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-bold text-sm text-brand-gold">AMDEMIS</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-white/80 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item, idx) => {
                if (item.section) {
                  return (
                    <div
                      key={`m-sec-${idx}`}
                      className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider text-blue-300 uppercase"
                    >
                      {item.section}
                    </div>
                  );
                }

                const Icon = item.icon!;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={`m-${item.href}`}
                    href={item.href!}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      item.isPrimaryAction
                        ? 'bg-brand-gold text-brand-navy font-bold'
                        : isActive
                        ? 'bg-brand-midBlue text-white font-semibold'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg bg-red-600/30 text-red-200 hover:bg-red-600/50 text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <Bell className="h-5 w-5" />
              District Notifications
            </DialogTitle>
            <DialogDescription>
              Real-time updates and notices from Planning &amp; Statistics Directorate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No new notifications.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-navy dark:text-blue-300">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change PIN Modal */}
      <Dialog open={changePinOpen} onOpenChange={setChangePinOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <KeyRound className="h-5 w-5" />
              Change School Login PIN
            </DialogTitle>
            <DialogDescription>
              Enter your current PIN and choose a new 6-digit numeric PIN.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePinChange} className="space-y-4 mt-2">
            <div>
              <Input
                label="Current PIN"
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="Current 6-digit PIN"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono text-center tracking-widest text-lg"
              />
            </div>
            <div>
              <Input
                label="New 6-digit PIN"
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="New 6-digit PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono text-center tracking-widest text-lg"
              />
            </div>
            <div>
              <Input
                label="Confirm New PIN"
                type="password"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="Re-enter New PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono text-center tracking-widest text-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChangePinOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingPin || newPin.length !== 6 || confirmPin.length !== 6}
                className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold"
              >
                {isUpdatingPin ? 'Saving...' : 'Update PIN'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
