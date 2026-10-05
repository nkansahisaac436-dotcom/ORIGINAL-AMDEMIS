'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  MapPin,
  GraduationCap,
  FileSpreadsheet,
  Download,
  ScrollText,
  Users,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
  adminName?: string;
  adminRole?: 'super_admin' | 'district_officer';
  activeRoundTitle?: string;
}

export function AdminLayout({
  children,
  adminName = 'District Administrator',
  adminRole = 'super_admin',
  activeRoundTitle = '2025/2026 Academic Year',
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const currentYear = new Date().getFullYear();

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      toast.success('Signed out successfully');
      router.push('/');
      router.refresh();
    } catch {
      router.push('/');
    }
  };

  const navItems = [
    { section: 'MANAGEMENT' },
    {
      label: 'Admin Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Collection Rounds',
      href: '/admin/rounds',
      icon: CalendarDays,
    },
    {
      label: 'Circuits',
      href: '/admin/circuits',
      icon: MapPin,
    },
    {
      label: 'Schools & PINs',
      href: '/admin/schools',
      icon: GraduationCap,
    },
    { section: 'DATA & SUBMISSIONS' },
    {
      label: 'Submissions',
      href: '/admin/submissions',
      icon: FileSpreadsheet,
    },
    {
      label: 'Reports & Exports',
      href: '/admin/reports',
      icon: Download,
    },
    {
      label: 'Audit Log',
      href: '/admin/audit-log',
      icon: ScrollText,
    },
    ...(adminRole === 'super_admin'
      ? [
          { section: 'SYSTEM & USERS' },
          {
            label: 'Officer Accounts',
            href: '/admin/users',
            icon: Users,
          },
        ]
      : []),
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
              District Directorate
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-blue-200">Admin Portal</span>
              <Badge variant="gold" className="text-[9px] py-0 px-1.5 h-4">
                {adminRole === 'super_admin' ? 'Super Admin' : 'Officer'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div
                  key={`adm-sec-${idx}`}
                  className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-blue-300/80 uppercase"
                >
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-midBlue text-white font-semibold shadow-xs ring-1 ring-white/10'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-brand-gold" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 text-[11px] text-blue-200/70 text-center">
          © {currentYear} AMDEMIS Planning &amp; Statistics Unit
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Round:
              </span>
              <h2 className="text-base sm:text-lg font-bold text-brand-navy dark:text-white truncate">
                {activeRoundTitle}
              </h2>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />

            {/* Admin User Chip */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center ring-1 ring-brand-gold">
                  {getInitials(adminName)}
                </div>
                <div className="hidden md:block max-w-[150px] truncate">
                  <p className="text-xs font-bold text-foreground leading-tight">{adminName}</p>
                  <p className="text-[10px] text-brand-midBlue dark:text-blue-400 font-semibold uppercase">
                    {adminRole === 'super_admin' ? 'Super Admin' : 'District Officer'}
                  </p>
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
                      <p className="font-bold text-foreground truncate">{adminName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {adminRole.replace('_', ' ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-brand-error text-left font-medium"
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
                <span className="font-bold text-sm text-brand-gold">AMDEMIS Admin</span>
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
                      key={`m-adm-sec-${idx}`}
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
                      isActive
                        ? 'bg-brand-midBlue text-white font-semibold'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-brand-gold" />
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
    </div>
  );
}
