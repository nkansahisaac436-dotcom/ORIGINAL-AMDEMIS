'use client';

import * as React from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  School as SchoolIcon,
  Plus,
  KeyRound,
  Printer,
  Copy,
  Share2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Edit2,
  ArrowRight,
  MapPin,
  Clock,
  Phone,
  User,
  ShieldAlert,
  FileCheck2,
  FileEdit,
  ExternalLink,
  ChevronRight,
  Download,
  AlertCircle,
  X,
} from 'lucide-react';
import { EDUCATION_LEVELS, LevelId } from '@/lib/levels-config';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { handleFieldFocus } from '@/hooks/use-visual-viewport';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = React.useState<any[]>([]);
  const [circuits, setCircuits] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Search & Filters
  const [search, setSearch] = React.useState('');
  const [circuitFilter, setCircuitFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [accountStatusFilter, setAccountStatusFilter] = React.useState('all');

  // Full-Screen Add School Form
  const [addFormOpen, setAddFormOpen] = React.useState(false);
  const [schoolName, setSchoolName] = React.useState('');
  const [schoolStatus, setSchoolStatus] = React.useState<'public' | 'private'>('public');
  const [circuitId, setCircuitId] = React.useState('');
  const [circuitPickerOpen, setCircuitPickerOpen] = React.useState(false);
  const [circuitPickerSearch, setCircuitPickerSearch] = React.useState('');
  const [emisCode, setEmisCode] = React.useState('');
  const [town, setTown] = React.useState('');
  const [defaultLevels, setDefaultLevels] = React.useState<LevelId[]>(['kg', 'primary']);
  const [headteacherName, setHeadteacherName] = React.useState('');
  const [headteacherPhone, setHeadteacherPhone] = React.useState('');
  const [isSubmittingSchool, setIsSubmittingSchool] = React.useState(false);

  // Similar School Name Warning State
  const [similarWarning, setSimilarWarning] = React.useState<string | null>(null);

  // Add Circuit from Add School Form (if no circuits exist)
  const [inlineAddCircuitOpen, setInlineAddCircuitOpen] = React.useState(false);
  const [newCircuitName, setNewCircuitName] = React.useState('');
  const [isCreatingInlineCircuit, setIsCreatingInlineCircuit] = React.useState(false);

  // "School Created" / "New PIN Issued" Screen (Shown ONCE with PIN)
  const [createdCredentialModalOpen, setCreatedCredentialModalOpen] = React.useState(false);
  const [credentialData, setCredentialData] = React.useState<{
    school_name: string;
    circuit_name: string;
    school_login_id: string;
    pin: string;
    title?: string;
  } | null>(null);

  // School Detail Screen
  const [selectedSchool, setSelectedSchool] = React.useState<any>(null);
  const [schoolDetailOpen, setSchoolDetailOpen] = React.useState(false);

  // Reset PIN Confirmation Dialog
  const [resetPinConfirmOpen, setResetPinConfirmOpen] = React.useState(false);
  const [isResettingPin, setIsResettingPin] = React.useState(false);

  // Move Circuit Dialog
  const [moveCircuitOpen, setMoveCircuitOpen] = React.useState(false);
  const [targetCircuitId, setTargetCircuitId] = React.useState('');
  const [isMovingCircuit, setIsMovingCircuit] = React.useState(false);

  // Edit School Details Dialog
  const [editSchoolOpen, setEditSchoolOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editTown, setEditTown] = React.useState('');
  const [editEmis, setEditEmis] = React.useState('');
  const [editHtName, setEditHtName] = React.useState('');
  const [editHtPhone, setEditHtPhone] = React.useState('');
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);

  // Bulk Circuit PINs Dialog
  const [bulkCircuitModalOpen, setBulkCircuitModalOpen] = React.useState(false);
  const [selectedCircuitForBulk, setSelectedCircuitForBulk] = React.useState('');
  const [isGeneratingBulk, setIsGeneratingBulk] = React.useState(false);
  const [bulkResultSlips, setBulkResultSlips] = React.useState<any[] | null>(null);

  // A5 Print Slip State
  const [printSlipOpen, setPrintSlipOpen] = React.useState(false);
  const [slipToPrint, setSlipToPrint] = React.useState<any>(null);

  const fetchData = async () => {
    try {
      const [schoolsRes, circuitsRes] = await Promise.all([
        fetch('/api/admin/schools'),
        fetch('/api/admin/circuits'),
      ]);

      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (circuitsRes.ok) setCircuits(await circuitsRes.json());
    } catch {
      toast.error('Failed to load school directory data');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const handleLevelToggle = (lvl: LevelId) => {
    if (defaultLevels.includes(lvl)) {
      if (defaultLevels.length > 1) {
        setDefaultLevels(defaultLevels.filter((l) => l !== lvl));
      }
    } else {
      setDefaultLevels([...defaultLevels, lvl]);
    }
  };

  const handleOpenAddSchool = () => {
    setSimilarWarning(null);
    setSchoolName('');
    setSchoolStatus('public');
    setCircuitId(circuits.find((c) => c.is_active)?.id || '');
    setEmisCode('');
    setTown('');
    setHeadteacherName('');
    setHeadteacherPhone('');
    setDefaultLevels(['kg', 'primary']);
    setAddFormOpen(true);
  };

  const handleCreateInlineCircuit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCircuitName.trim().length < 2) return;
    setIsCreatingInlineCircuit(true);

    try {
      const res = await fetch('/api/admin/circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCircuitName.trim(), is_active: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create circuit');
        return;
      }

      toast.success(`Circuit "${data.name}" created!`);
      setInlineAddCircuitOpen(false);
      setNewCircuitName('');
      await fetchData();
      setCircuitId(data.id);
    } catch {
      toast.error('Error creating circuit');
    } finally {
      setIsCreatingInlineCircuit(false);
    }
  };

  const handleSaveSchool = async (confirmSimilar = false) => {
    if (!schoolName.trim()) {
      toast.error('School name is required.');
      return;
    }
    if (!circuitId) {
      toast.error('Please select an active circuit.');
      return;
    }

    setIsSubmittingSchool(true);

    try {
      const res = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schoolName.trim(),
          status: schoolStatus,
          circuit_id: circuitId,
          emis_code: emisCode.trim() || undefined,
          town: town.trim() || undefined,
          default_levels: defaultLevels,
          headteacher_name: headteacherName.trim() || undefined,
          headteacher_phone: headteacherPhone.trim() || undefined,
          confirm_similar: confirmSimilar,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.warning === 'similar_name') {
        setSimilarWarning(data.message);
        setIsSubmittingSchool(false);
        return;
      }

      if (!res.ok) {
        toast.error(data.error || 'Failed to create school');
        setIsSubmittingSchool(false);
        return;
      }

      toast.success('School created successfully!');
      setAddFormOpen(false);
      setSimilarWarning(null);

      // Open "School Created" screen with credentials shown ONCE
      setCredentialData({
        school_name: data.credentials.school_name,
        circuit_name: data.credentials.circuit_name,
        school_login_id: data.credentials.school_login_id,
        pin: data.credentials.pin,
        title: 'School Created Successfully',
      });
      setCreatedCredentialModalOpen(true);

      fetchData();
    } catch {
      toast.error('Network error creating school');
    } finally {
      setIsSubmittingSchool(false);
    }
  };

  const handleCopyReadyMessage = (cred: any) => {
    const webUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const message = `AMDEMIS login. School: ${cred.school_name}. Login ID: ${cred.school_login_id}. PIN: ${cred.pin}. Sign in at ${webUrl}. Please change your PIN after you sign in.`;

    navigator.clipboard.writeText(message);
    toast.success('Login message copied to clipboard!');
  };

  const handleShareMessage = async (cred: any) => {
    const webUrl =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const message = `AMDEMIS login. School: ${cred.school_name}. Login ID: ${cred.school_login_id}. PIN: ${cred.pin}. Sign in at ${webUrl}. Please change your PIN after you sign in.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `AMDEMIS Login - ${cred.school_name}`,
          text: message,
          url: webUrl,
        });
      } catch {
        handleCopyReadyMessage(cred);
      }
    } else {
      handleCopyReadyMessage(cred);
    }
  };

  const handleOpenDetail = (sch: any) => {
    setSelectedSchool(sch);
    setSchoolDetailOpen(true);
  };

  const handleExecuteResetPin = async () => {
    if (!selectedSchool) return;
    setIsResettingPin(true);

    try {
      const res = await fetch('/api/admin/schools/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: selectedSchool.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to reset PIN');
        return;
      }

      toast.success(`PIN reset for ${selectedSchool.name}`);
      setResetPinConfirmOpen(false);
      setSchoolDetailOpen(false);

      // Show new PIN once
      setCredentialData({
        school_name: data.school_name,
        circuit_name: data.circuit_name,
        school_login_id: data.school_login_id,
        pin: data.pin,
        title: 'New PIN Generated (Shown Once)',
      });
      setCreatedCredentialModalOpen(true);

      fetchData();
    } catch {
      toast.error('Network error resetting PIN');
    } finally {
      setIsResettingPin(false);
    }
  };

  const handleToggleLock = async () => {
    if (!selectedSchool) return;
    const isCurrentlyLocked = selectedSchool.account_status === 'locked';
    const action = isCurrentlyLocked ? 'unlock' : 'lock';

    try {
      const res = await fetch('/api/admin/schools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSchool.id,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update lock status');
        return;
      }

      toast.success(
        isCurrentlyLocked
          ? `Unlocked account for ${selectedSchool.name}`
          : `Locked account for ${selectedSchool.name} (15 minutes)`
      );
      setSchoolDetailOpen(false);
      fetchData();
    } catch {
      toast.error('Network error toggling lock');
    }
  };

  const handleToggleActive = async () => {
    if (!selectedSchool) return;
    const newActive = !selectedSchool.is_active;

    try {
      const res = await fetch('/api/admin/schools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSchool.id,
          is_active: newActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update school');
        return;
      }

      toast.success(
        newActive
          ? `School "${selectedSchool.name}" reactivated.`
          : `School "${selectedSchool.name}" deactivated.`
      );
      setSchoolDetailOpen(false);
      fetchData();
    } catch {
      toast.error('Error toggling school status');
    }
  };

  const handleMoveCircuit = async () => {
    if (!selectedSchool || !targetCircuitId) return;
    setIsMovingCircuit(true);

    try {
      const res = await fetch('/api/admin/schools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSchool.id,
          circuit_id: targetCircuitId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to move school');
        return;
      }

      toast.success(`Moved ${selectedSchool.name} to ${data.circuits?.name}`);
      setMoveCircuitOpen(false);
      setSchoolDetailOpen(false);
      fetchData();
    } catch {
      toast.error('Network error moving circuit');
    } finally {
      setIsMovingCircuit(false);
    }
  };

  const handleSaveEditSchool = async () => {
    if (!selectedSchool || !editName.trim()) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch('/api/admin/schools', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSchool.id,
          name: editName.trim(),
          town: editTown.trim() || null,
          emis_code: editEmis.trim() || null,
          headteacher_name: editHtName.trim() || null,
          headteacher_phone: editHtPhone.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update details');
        return;
      }

      toast.success('School details updated successfully');
      setEditSchoolOpen(false);
      setSchoolDetailOpen(false);
      fetchData();
    } catch {
      toast.error('Network error updating school');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleGenerateBulkCircuitPins = async () => {
    if (!selectedCircuitForBulk) {
      toast.error('Please pick a circuit.');
      return;
    }

    setIsGeneratingBulk(true);
    try {
      const res = await fetch('/api/admin/schools/bulk-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circuit_id: selectedCircuitForBulk }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to generate circuit PINs');
        return;
      }

      setBulkResultSlips(data.slips || []);
      toast.success(`Issued new PINs for ${data.slips?.length || 0} schools!`);
      fetchData();
    } catch {
      toast.error('Network error generating circuit PINs');
    } finally {
      setIsGeneratingBulk(false);
    }
  };

  const handleDownloadBulkCSV = () => {
    if (!bulkResultSlips || bulkResultSlips.length === 0) return;
    let csv = 'School Name,School Login ID,Circuit,New PIN\n';
    bulkResultSlips.forEach((s) => {
      csv += `"${s.school_name}","${s.school_login_id}","${s.circuit_name}","${s.pin}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `AMDEMIS_Circuit_PINs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered schools
  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.school_login_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.emis_code && s.emis_code.toLowerCase().includes(search.toLowerCase())) ||
      (s.town && s.town.toLowerCase().includes(search.toLowerCase())) ||
      (s.circuit_name && s.circuit_name.toLowerCase().includes(search.toLowerCase()));

    const matchesCircuit = circuitFilter === 'all' || s.circuit_id === circuitFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesAccountStatus =
      accountStatusFilter === 'all' || s.account_status === accountStatusFilter;

    return matchesSearch && matchesCircuit && matchesStatus && matchesAccountStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-navy dark:text-white">
              Schools &amp; PINs
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add schools, issue PINs, reset PINs &amp; monitor access
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setBulkResultSlips(null);
              setSelectedCircuitForBulk(circuits[0]?.id || '');
              setBulkCircuitModalOpen(true);
            }}
            className="text-xs font-bold border-slate-300 dark:border-slate-700 shrink-0"
          >
            <KeyRound className="h-4 w-4 mr-1 text-brand-gold" />
            <span className="hidden sm:inline">New PINs for Circuit</span>
            <span className="sm:hidden">Bulk PINs</span>
          </Button>
        </div>

        {/* Search Box & Gold Add School Button */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search school name, AMD-XXXX, EMIS code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          {/* Gold Add School Button (Right under search box) */}
          <Button
            onClick={handleOpenAddSchool}
            className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-[#0A2A66] font-black text-sm h-11 rounded-xl shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add School</span>
          </Button>
        </div>

        {/* Filters Strip */}
        <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          {/* Circuit Filter */}
          <select
            value={circuitFilter}
            onChange={(e) => setCircuitFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="all">All Circuits ({circuits.length})</option>
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Public / Private */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="all">Public &amp; Private</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          {/* Account Status */}
          <select
            value={accountStatusFilter}
            onChange={(e) => setAccountStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 text-xs font-semibold text-foreground focus:outline-none"
          >
            <option value="all">All Accounts</option>
            <option value="never_logged_in">Never logged in</option>
            <option value="active">Active</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        {/* Schools List Cards */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground font-semibold">
            Loading district schools...
          </div>
        ) : filteredSchools.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-12 px-4 rounded-2xl">
            <CardContent className="space-y-4 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-slate-800 text-brand-gold flex items-center justify-center mx-auto ring-1 ring-brand-gold/30">
                <SchoolIcon className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  No matching schools found.
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {search
                    ? 'No schools match your search query. Clear search or filters to see all schools.'
                    : 'Click "Add a school" to register your first educational institution and generate credentials.'}
                </p>
              </div>
              {!search && (
                <Button
                  onClick={handleOpenAddSchool}
                  className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-[#0A2A66] font-black text-sm h-12 rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Plus className="h-5 w-5 stroke-[3]" />
                  <span>Add a school</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredSchools.map((school) => {
              const isLocked = school.account_status === 'locked';
              const isNeverLoggedIn = school.account_status === 'never_logged_in';

              return (
                <Card
                  key={school.id}
                  onClick={() => handleOpenDetail(school)}
                  className="border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs hover:border-brand-midBlue cursor-pointer transition-all active:scale-[0.99]"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-brand-navy dark:text-brand-gold px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-800 border border-blue-200/60 dark:border-slate-700">
                            {school.school_login_id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              school.status === 'private'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {school.status}
                          </span>

                          {/* Account Status Pill */}
                          {isLocked ? (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-4">
                              <Lock className="h-3 w-3 mr-0.5" />
                              Locked
                            </Badge>
                          ) : isNeverLoggedIn ? (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                              Never logged in
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4">
                              Active
                            </Badge>
                          )}
                        </div>

                        <h2 className="text-sm font-extrabold text-foreground truncate pt-0.5">
                          {school.name}
                        </h2>

                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="font-medium text-brand-midBlue dark:text-blue-400">
                            {school.circuit_name}
                          </span>
                          {school.town && <span>&bull; {school.town}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pt-1 text-slate-400">
                        {school.submission_status === 'submitted' ? (
                          <Badge variant="success" className="text-[10px]">
                            Submitted
                          </Badge>
                        ) : school.submission_status === 'draft' ? (
                          <Badge variant="gold" className="text-[10px]">
                            Draft
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Pending
                          </Badge>
                        )}
                        <ChevronRight className="h-5 w-5 ml-1 text-slate-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-Screen Add School Modal */}
      <Dialog open={addFormOpen} onOpenChange={setAddFormOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-lg">
          {/* Header Bar at Top */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-black text-brand-navy dark:text-brand-gold flex items-center gap-2">
                <SchoolIcon className="h-5 w-5 text-brand-gold shrink-0" />
                <span>Add District School</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Generates the next School Login ID (AMD-XXXX) and a secret 6-digit PIN.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setAddFormOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSchool(false);
            }}
            onFocusCapture={handleFieldFocus}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-4">
              {/* Similar Name Warning Dialog Box */}
              {similarWarning && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <span className="font-semibold leading-relaxed">{similarWarning}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 justify-end">
                    <Button
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={() => setSimilarWarning(null)}
                      className="h-8 text-xs font-bold"
                    >
                      Edit Name
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => handleSaveSchool(true)}
                      disabled={isSubmittingSchool}
                      className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Confirm &amp; Proceed
                    </Button>
                  </div>
                </div>
              )}

              {/* 1. School Name (Top priority) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-foreground">
                  School Name <span className="text-brand-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Nyinahin D/A Basic School"
                  enterKeyHint="next"
                  value={schoolName}
                  onChange={(e) => {
                    setSchoolName(e.target.value);
                    setSimilarWarning(null);
                  }}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>

              {/* 2. Institution Status: Two Big Buttons */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-foreground">
                  Institution Status <span className="text-brand-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSchoolStatus('public')}
                    className={`h-12 rounded-xl text-xs font-extrabold flex items-center justify-center border-2 transition-all ${
                      schoolStatus === 'public'
                        ? 'border-brand-navy bg-brand-navy text-white shadow-xs dark:bg-brand-midBlue dark:border-brand-midBlue'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Public (Government)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchoolStatus('private')}
                    className={`h-12 rounded-xl text-xs font-extrabold flex items-center justify-center border-2 transition-all ${
                      schoolStatus === 'private'
                        ? 'border-purple-700 bg-purple-700 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Private Institution
                  </button>
                </div>
              </div>

              {/* 3. Circuit: Searchable Full-Screen Picker & Direct Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground">
                    Circuit Assignment <span className="text-brand-error">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setInlineAddCircuitOpen(true)}
                    className="text-[11px] font-bold text-brand-midBlue hover:underline"
                  >
                    + Add new circuit
                  </button>
                </div>

                {circuits.filter((c) => c.is_active).length === 0 ? (
                  <div className="p-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <span className="text-xs font-semibold">No active circuits exist.</span>
                    <Button
                      size="sm"
                      type="button"
                      onClick={() => setInlineAddCircuitOpen(true)}
                      className="h-8 text-xs font-bold bg-[#D4AF37] text-[#0A2A66]"
                    >
                      Add a circuit first
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCircuitPickerOpen(true)}
                    className="flex items-center justify-between h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-bold text-left focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  >
                    <span className={circuitId ? 'text-foreground' : 'text-muted-foreground font-normal'}>
                      {circuits.find((c) => c.id === circuitId)?.name || 'Tap to select circuit...'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                  </button>
                )}
              </div>

              {/* Town & EMIS Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground">
                    Town / Community <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nyinahin"
                    enterKeyHint="next"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground">
                    EMIS Code <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 1066320014"
                    enterKeyHint="next"
                    value={emisCode}
                    onChange={(e) => setEmisCode(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>

              {/* Headteacher Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground">
                    Headteacher Name <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Can be filled later"
                    enterKeyHint="next"
                    value={headteacherName}
                    onChange={(e) => setHeadteacherName(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-foreground">
                    Headteacher Phone <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="024XXXXXXX"
                    enterKeyHint="done"
                    value={headteacherPhone}
                    onChange={(e) => setHeadteacherPhone(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>

              {/* Starting Levels */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-foreground">
                  Starting Levels
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EDUCATION_LEVELS.map((lvl) => (
                    <label
                      key={lvl.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Checkbox
                        checked={defaultLevels.includes(lvl.id)}
                        onCheckedChange={() => handleLevelToggle(lvl.id)}
                      />
                      <span>{lvl.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footer Above Keyboard */}
            <div
              className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
              style={{
                bottom: 'var(--kb, 0px)',
                paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddFormOpen(false)}
                  className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingSchool || !schoolName.trim() || !circuitId}
                  className="h-11 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-midBlue text-white border-b-2 border-brand-gold w-full sm:w-auto"
                >
                  {isSubmittingSchool ? 'Creating...' : 'Save & Issue PIN'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Searchable Full-Screen Circuit Picker Modal */}
      <Dialog open={circuitPickerOpen} onOpenChange={setCircuitPickerOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-black text-brand-navy dark:text-brand-gold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-gold shrink-0" />
                <span>Select District Circuit</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pick a circuit to assign this school to.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setCircuitPickerOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-4 py-3 sm:px-0 sm:py-2 shrink-0 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search circuit by name..."
                autoFocus
                enterKeyHint="search"
                value={circuitPickerSearch}
                onChange={(e) => setCircuitPickerSearch(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3.5 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-0 sm:py-2 space-y-2 pb-[130px]">
            {circuits
              .filter(
                (c) =>
                  c.is_active &&
                  c.name.toLowerCase().includes(circuitPickerSearch.toLowerCase())
              )
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCircuitId(c.id);
                    setCircuitPickerOpen(false);
                    setCircuitPickerSearch('');
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    circuitId === c.id
                      ? 'border-brand-gold bg-amber-50/70 dark:bg-amber-950/40 font-extrabold text-brand-navy dark:text-brand-gold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-foreground font-semibold'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold">{c.name}</div>
                    {c.code && (
                      <div className="text-[11px] font-mono text-muted-foreground">
                        Code: {c.code}
                      </div>
                    )}
                  </div>
                  {circuitId === c.id && (
                    <CheckCircle2 className="h-5 w-5 text-brand-gold shrink-0" />
                  )}
                </button>
              ))}
            {circuits.filter(
              (c) =>
                c.is_active &&
                c.name.toLowerCase().includes(circuitPickerSearch.toLowerCase())
            ).length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No active circuits match &quot;{circuitPickerSearch}&quot;
              </div>
            )}
          </div>

          <div
            className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
            style={{
              bottom: 'var(--kb, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCircuitPickerOpen(false);
                setCircuitPickerSearch('');
              }}
              className="w-full h-11 rounded-xl text-xs font-bold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline Add Circuit Bottom Sheet / Modal */}
      <Dialog open={inlineAddCircuitOpen} onOpenChange={setInlineAddCircuitOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-bold text-brand-navy dark:text-brand-gold">
                Add Circuit First
              </DialogTitle>
              <DialogDescription className="text-xs">
                Every school must be attached to a circuit. Enter a circuit name to proceed.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setInlineAddCircuitOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleCreateInlineCircuit}
            onFocusCapture={handleFieldFocus}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">Circuit Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  enterKeyHint="done"
                  placeholder="e.g. Nyinahin Circuit"
                  value={newCircuitName}
                  onChange={(e) => setNewCircuitName(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>

            <div
              className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
              style={{
                bottom: 'var(--kb, 0px)',
                paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInlineAddCircuitOpen(false)}
                  className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreatingInlineCircuit || newCircuitName.trim().length < 2}
                  className="h-11 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-midBlue text-white border-b-2 border-brand-gold w-full sm:w-auto"
                >
                  {isCreatingInlineCircuit ? 'Creating...' : 'Create Circuit'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* "School Created" / "New PIN Issued" Screen (Shown ONCE with PIN) */}
      <Dialog
        open={createdCredentialModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Once Done, clear PIN from state so it can never be shown again
            setCredentialData(null);
            setCreatedCredentialModalOpen(false);
          }
        }}
      >
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-black text-brand-navy dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>{credentialData?.title || 'School Created Successfully'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {credentialData?.school_name} &bull; {credentialData?.circuit_name}
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => {
                setCredentialData(null);
                setCreatedCredentialModalOpen(false);
              }}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-4 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  School Login ID
                </span>
                <span className="text-xl font-mono font-black text-brand-navy dark:text-brand-gold">
                  {credentialData?.school_login_id}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  6-Digit Secret PIN
                </span>
                <span className="text-4xl font-mono font-black tracking-widest text-[#0A2A66] dark:text-white block mt-1">
                  {credentialData?.pin}
                </span>
              </div>

              {/* Warning: Shown only once */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>This PIN is shown only once. Please copy or share it now.</span>
              </div>
            </div>

            {/* Action Buttons: Copy, Share, Print slip */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCopyReadyMessage(credentialData)}
                  className="h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Message</span>
                </Button>

                <Button
                  type="button"
                  onClick={() => handleShareMessage(credentialData)}
                  className="h-11 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share WhatsApp</span>
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSlipToPrint(credentialData);
                  setPrintSlipOpen(true);
                }}
                className="w-full h-11 rounded-xl text-xs font-bold border-brand-navy/30 dark:border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" />
                <span>Print A5 Official Slip</span>
              </Button>
            </div>
          </div>

          <div
            className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
            style={{
              bottom: 'var(--kb, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <Button
              type="button"
              onClick={() => {
                setCredentialData(null);
                setCreatedCredentialModalOpen(false);
              }}
              className="w-full h-11 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-midBlue text-white"
            >
              Done (Finish)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* School Detail Modal / Screen */}
      <Dialog open={schoolDetailOpen} onOpenChange={setSchoolDetailOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-lg">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                <SchoolIcon className="h-5 w-5 text-brand-gold shrink-0" />
                <span className="truncate">{selectedSchool?.name || 'School Profile'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {selectedSchool?.school_login_id} &bull; {selectedSchool?.circuit_name} Circuit
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setSchoolDetailOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px]">
            {selectedSchool && (
              <div className="space-y-5">
                {/* Status Badges */}
                <div className="flex items-center gap-2 pb-1">
                  <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-blue-50 dark:bg-slate-800 border border-blue-200">
                    {selectedSchool.school_login_id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-800">
                    {selectedSchool.status}
                  </span>
                  {selectedSchool.account_status === 'locked' ? (
                    <Badge variant="destructive" className="text-[10px]">
                      Locked
                    </Badge>
                  ) : selectedSchool.account_status === 'never_logged_in' ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Never logged in
                    </Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px]">
                      Active
                    </Badge>
                  )}
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Town / Community
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedSchool.town || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      EMIS Code
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {selectedSchool.emis_code || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Headteacher
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedSchool.headteacher_name || 'Not assigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Phone Contact
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {selectedSchool.headteacher_phone || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Active Round Status
                    </span>
                    <span className="font-bold capitalize text-foreground">
                      {selectedSchool.submission_status || 'not_started'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                      Total Returns Filed
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedSchool.total_submissions_count || 0}
                    </span>
                  </div>
                </div>

                {/* Reset History */}
                {selectedSchool.last_pin_reset_at && (
                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 text-xs text-blue-900 dark:text-blue-200">
                    <span className="font-bold block">Last PIN Reset</span>
                    <span className="text-[11px]">
                      Reset on {formatDateTime(selectedSchool.last_pin_reset_at)}
                    </span>
                  </div>
                )}

                {/* Action Buttons on School Detail */}
                <div className="space-y-2 pt-2 border-t">
                  {/* Reset PIN (Primary) */}
                  <Button
                    type="button"
                    onClick={() => setResetPinConfirmOpen(true)}
                    className="w-full h-11 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-[#0A2A66] flex items-center justify-center gap-2"
                  >
                    <KeyRound className="h-4 w-4 stroke-[2.5]" />
                    <span>Reset PIN &amp; Print Slip</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Lock / Unlock */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleToggleLock}
                      className="h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      {selectedSchool.account_status === 'locked' ? (
                        <>
                          <Unlock className="h-4 w-4 text-emerald-600" />
                          <span>Unlock Account</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-amber-600" />
                          <span>Lock Account</span>
                        </>
                      )}
                    </Button>

                    {/* Move Circuit */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTargetCircuitId(selectedSchool.circuit_id);
                        setMoveCircuitOpen(true);
                      }}
                      className="h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="h-4 w-4 text-brand-midBlue" />
                      <span>Move Circuit</span>
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Edit details */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditName(selectedSchool.name);
                        setEditTown(selectedSchool.town || '');
                        setEditEmis(selectedSchool.emis_code || '');
                        setEditHtName(selectedSchool.headteacher_name || '');
                        setEditHtPhone(selectedSchool.headteacher_phone || '');
                        setEditSchoolOpen(true);
                      }}
                      className="h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit Details</span>
                    </Button>

                    {/* Copy Web Address */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const webUrl =
                          typeof window !== 'undefined'
                            ? window.location.origin
                            : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                        navigator.clipboard.writeText(webUrl);
                        toast.success('Login portal URL copied!');
                      }}
                      className="h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Copy Portal URL</span>
                    </Button>
                  </div>

                  {/* Deactivate / Reactivate */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleToggleActive}
                    className={`w-full h-9 rounded-xl text-xs font-semibold ${
                      selectedSchool.is_active ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedSchool.is_active
                      ? 'Deactivate School (Retains submissions)'
                      : 'Reactivate School'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div
            className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
            style={{
              bottom: 'var(--kb, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setSchoolDetailOpen(false)}
              className="w-full h-11 rounded-xl text-xs font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset PIN Confirmation Dialog */}
      <Dialog open={resetPinConfirmOpen} onOpenChange={setResetPinConfirmOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-black text-brand-navy dark:text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Reset PIN for {selectedSchool?.name}?</span>
              </DialogTitle>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setResetPinConfirmOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px]">
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              This will stop the old PIN working immediately. Any active session for this school will
              be signed out, and the headteacher must change their PIN upon their next sign-in.
            </DialogDescription>
          </div>

          <div
            className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
            style={{
              bottom: 'var(--kb, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPinConfirmOpen(false)}
                className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleExecuteResetPin}
                disabled={isResettingPin}
                className="h-11 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-[#0A2A66] w-full sm:w-auto"
              >
                {isResettingPin ? 'Resetting...' : 'Confirm PIN Reset'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Circuit Dialog */}
      <Dialog open={moveCircuitOpen} onOpenChange={setMoveCircuitOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-bold text-brand-navy dark:text-white">
                Move to Another Circuit
              </DialogTitle>
              <DialogDescription className="text-xs">
                Select a new circuit for {selectedSchool?.name}. The school&apos;s Login ID and PIN will
                keep working without change.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setMoveCircuitOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-3">
            <select
              value={targetCircuitId}
              onChange={(e) => setTargetCircuitId(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              {circuits
                .filter((c) => c.is_active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div
            className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
            style={{
              bottom: 'var(--kb, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMoveCircuitOpen(false)}
                className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleMoveCircuit}
                disabled={isMovingCircuit || targetCircuitId === selectedSchool?.circuit_id}
                className="h-11 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-midBlue text-white w-full sm:w-auto"
              >
                {isMovingCircuit ? 'Moving...' : 'Confirm Move'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit School Details Dialog */}
      <Dialog open={editSchoolOpen} onOpenChange={setEditSchoolOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-bold text-brand-navy dark:text-white">
                Edit School Details
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update institutional metadata for official reporting.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setEditSchoolOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEditSchool();
            }}
            onFocusCapture={handleFieldFocus}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold block text-foreground">School Name</label>
                <input
                  type="text"
                  required
                  enterKeyHint="next"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold block text-foreground">Town / Community</label>
                  <input
                    type="text"
                    enterKeyHint="next"
                    value={editTown}
                    onChange={(e) => setEditTown(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold block text-foreground">EMIS Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    enterKeyHint="next"
                    value={editEmis}
                    onChange={(e) => setEditEmis(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold block text-foreground">Headteacher Name</label>
                  <input
                    type="text"
                    enterKeyHint="next"
                    value={editHtName}
                    onChange={(e) => setEditHtName(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold block text-foreground">Phone Contact</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    enterKeyHint="done"
                    value={editHtPhone}
                    onChange={(e) => setEditHtPhone(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                </div>
              </div>
            </div>

            <div
              className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
              style={{
                bottom: 'var(--kb, 0px)',
                paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditSchoolOpen(false)}
                  className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEdit || !editName.trim()}
                  className="h-11 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-midBlue text-white border-b-2 border-brand-gold w-full sm:w-auto"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Circuit PINs Dialog */}
      <Dialog open={bulkCircuitModalOpen} onOpenChange={setBulkCircuitModalOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-lg">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-black text-brand-navy dark:text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-brand-gold shrink-0" />
                <span>New PINs for a Whole Circuit</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
                Pick a circuit to generate fresh 6-digit random PINs for all schools in that circuit.
                Old PINs will immediately stop working.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setBulkCircuitModalOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-4">
            {!bulkResultSlips ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold block text-foreground">Pick Circuit</label>
                  <select
                    value={selectedCircuitForBulk}
                    onChange={(e) => setSelectedCircuitForBulk(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  >
                    {circuits
                      .filter((c) => c.is_active)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Warning: Existing headteacher sessions for this circuit will be invalidated. PINs
                    will be shown only once on this sheet.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600">
                    Generated {bulkResultSlips.length} new PIN slips (Shown only once)
                  </span>
                  <Button
                    size="sm"
                    onClick={handleDownloadBulkCSV}
                    className="h-8 text-xs font-bold bg-brand-navy text-white flex items-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download CSV</span>
                  </Button>
                </div>

                {/* Printable Table of PINs */}
                <div className="max-h-72 overflow-y-auto border rounded-xl divide-y text-xs">
                  {bulkResultSlips.map((item) => (
                    <div
                      key={item.school_id}
                      className="p-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800"
                    >
                      <div>
                        <span className="font-bold text-foreground block">{item.school_name}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {item.school_login_id}
                        </span>
                      </div>
                      <span className="font-mono font-black text-base text-brand-navy dark:text-brand-gold">
                        {item.pin}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className="fixed sm:static left-0 right-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
            style={{
              bottom: 'var(--kb, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            {!bulkResultSlips ? (
              <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBulkCircuitModalOpen(false)}
                  className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleGenerateBulkCircuitPins}
                  disabled={isGeneratingBulk || !selectedCircuitForBulk}
                  className="h-11 rounded-xl text-xs font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-[#0A2A66] w-full sm:w-auto"
                >
                  {isGeneratingBulk ? 'Generating...' : 'Confirm & Generate'}
                </Button>
              </DialogFooter>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setBulkResultSlips(null);
                  setBulkCircuitModalOpen(false);
                }}
                className="w-full h-11 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-midBlue text-white"
              >
                Done (Close)
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* A5 Printable Slip Modal / View */}
      <Dialog open={printSlipOpen} onOpenChange={setPrintSlipOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-lg bg-white text-slate-900 border">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0 print:hidden">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-bold text-[#0A2A66]">
                Official School PIN Slip (A5)
              </DialogTitle>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setPrintSlipOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px]">
            {slipToPrint && (
              <div className="space-y-4 text-center print:p-0">
                {/* Slip Header */}
                <div className="flex flex-col items-center border-b pb-3 space-y-1">
                  <div className="relative w-14 h-14 mb-1">
                    <Image
                      src="/branding/coat_of_arms.png"
                      alt="Ghana Coat of Arms"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0A2A66]">
                    Atwima Mponua District Education Directorate
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Planning &amp; Statistics Unit &bull; AMDEMIS Portal
                  </p>
                  <span className="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] uppercase tracking-wider">
                    Official Headteacher Login Slip (A5)
                  </span>
                </div>

                {/* Slip Details Box */}
                <div className="p-4 rounded-xl border-2 border-slate-300 bg-slate-50 text-left space-y-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      School Name
                    </span>
                    <span className="text-sm font-extrabold text-[#0A2A66]">
                      {slipToPrint.school_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Circuit
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {slipToPrint.circuit_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        School Login ID
                      </span>
                      <span className="text-base font-mono font-black text-[#0A2A66]">
                        {slipToPrint.school_login_id}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-300 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      6-Digit Initial PIN
                    </span>
                    <span className="text-3xl font-mono font-black tracking-widest text-[#0A2A66] block mt-0.5">
                      {slipToPrint.pin}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Sign In Web Address
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-700">
                      {typeof window !== 'undefined'
                        ? window.location.origin
                        : 'http://localhost:3000'}
                    </span>
                  </div>
                </div>

                {/* Crucial Instructions */}
                <p className="text-[11px] font-bold text-slate-700 italic leading-relaxed">
                  &ldquo;Keep this PIN private. Change it after your first login.&rdquo;
                </p>
              </div>
            )}
          </div>

          <div
            className="fixed sm:static left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0 print:hidden"
            style={{
              bottom: 'var(--kb, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrintSlipOpen(false)}
                className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => window.print()}
                className="h-11 rounded-xl text-xs font-bold bg-[#0A2A66] text-white flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <Printer className="h-4 w-4" />
                <span>Print Slip Now</span>
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
