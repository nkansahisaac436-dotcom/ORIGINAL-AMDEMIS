'use client';

import * as React from 'react';
import Image from 'next/image';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  School as SchoolIcon,
  Plus,
  Upload,
  KeyRound,
  Printer,
  Copy,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Edit2,
  Shield,
  Layers,
} from 'lucide-react';
import { EDUCATION_LEVELS, LevelId } from '@/lib/levels-config';
import { toast } from 'sonner';

export default function AdminSchoolsPage() {
  const [schools, setSchools] = React.useState<any[]>([]);
  const [circuits, setCircuits] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Search & Filters
  const [search, setSearch] = React.useState('');
  const [circuitFilter, setCircuitFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [levelFilter, setLevelFilter] = React.useState('all');

  // Add School Modal State
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [schoolName, setSchoolName] = React.useState('');
  const [schoolStatus, setSchoolStatus] = React.useState<'public' | 'private'>('public');
  const [circuitId, setCircuitId] = React.useState('');
  const [emisCode, setEmisCode] = React.useState('');
  const [town, setTown] = React.useState('');
  const [defaultLevels, setDefaultLevels] = React.useState<LevelId[]>(['primary']);
  const [headteacherName, setHeadteacherName] = React.useState('');
  const [headteacherPhone, setHeadteacherPhone] = React.useState('');
  const [isSubmittingSchool, setIsSubmittingSchool] = React.useState(false);

  // Edit School Modal State
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editingSchool, setEditingSchool] = React.useState<any>(null);

  // Single PIN Slip Modal State (Shown once upon creation or reset)
  const [pinSlipOpen, setPinSlipOpen] = React.useState(false);
  const [pinSlipData, setPinSlipData] = React.useState<any>(null);

  // Bulk Circuit PINs Modal State
  const [bulkPinModalOpen, setBulkPinModalOpen] = React.useState(false);
  const [selectedCircuitForPins, setSelectedCircuitForPins] = React.useState('');
  const [bulkPinSlips, setBulkPinSlips] = React.useState<any[]>([]);
  const [isGeneratingBulkPins, setIsGeneratingBulkPins] = React.useState(false);

  // Bulk Import Modal State
  const [bulkImportOpen, setBulkImportOpen] = React.useState(false);
  const [importRows, setImportRows] = React.useState<any[]>([]);
  const [autoCreateCircuits, setAutoCreateCircuits] = React.useState(true);
  const [isImporting, setIsImporting] = React.useState(false);

  const fetchData = async () => {
    try {
      const [schoolsRes, circuitsRes] = await Promise.all([
        fetch('/api/admin/schools'),
        fetch('/api/admin/circuits'),
      ]);

      if (schoolsRes.ok) setSchools(await schoolsRes.json());
      if (circuitsRes.ok) setCircuits(await circuitsRes.json());
    } catch {
      toast.error('Failed to load data');
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

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !circuitId) {
      toast.error('School name and circuit assignment are required');
      return;
    }

    setIsSubmittingSchool(true);
    try {
      const res = await fetch('/api/admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schoolName,
          status: schoolStatus,
          circuit_id: circuitId,
          emis_code: emisCode,
          town,
          default_levels: defaultLevels,
          headteacher_name: headteacherName,
          headteacher_phone: headteacherPhone,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('School created successfully!');
      setAddModalOpen(false);

      // Show PIN Slip
      setPinSlipData(data.credentials);
      setPinSlipOpen(true);

      // Reset fields
      setSchoolName('');
      setEmisCode('');
      setTown('');
      setHeadteacherName('');
      setHeadteacherPhone('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating school');
    } finally {
      setIsSubmittingSchool(false);
    }
  };

  const handleResetPin = async (schoolId: string) => {
    if (!confirm('Are you sure you want to reset the login PIN for this school? The old PIN will stop working immediately.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/schools/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: schoolId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPinSlipData({
        school_name: data.school_name,
        school_login_id: data.school_login_id,
        circuit_name: data.circuit_name,
        pin: data.pin,
      });
      setPinSlipOpen(true);
      toast.success('PIN successfully reset');
    } catch (err: any) {
      toast.error(err.message || 'Error resetting PIN');
    }
  };

  const handleGenerateCircuitPins = async () => {
    if (!selectedCircuitForPins) {
      toast.error('Please select a circuit');
      return;
    }

    setIsGeneratingBulkPins(true);
    try {
      const res = await fetch('/api/admin/schools/bulk-pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ circuit_id: selectedCircuitForPins }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBulkPinSlips(data.slips || []);
      toast.success(`Generated credentials for ${data.slips?.length || 0} schools`);
    } catch (err: any) {
      toast.error(err.message || 'Error generating circuit PINs');
    } finally {
      setIsGeneratingBulkPins(false);
    }
  };

  // CSV Template download
  const handleDownloadTemplate = () => {
    const csvContent =
      'school_name,status,circuit,levels,town,emis_code\nNyinahin D/A Basic School,public,Nyinahin Circuit,"KG, Primary, JHS",Nyinahin,1066320001\nSt. Jude Catholic School,private,Nkawie Circuit,"Crèche, KG, Primary",Nkawie,1066320002';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'amdemis_schools_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File Upload & Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error('File contains no data rows');
        return;
      }

      const rows: any[] = [];
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts[0]) {
          rows.push({
            school_name: parts[0] || '',
            status: parts[1]?.toLowerCase() === 'private' ? 'private' : 'public',
            circuit: parts[2] || '',
            levels: parts[3] || 'Primary',
            town: parts[4] || '',
            emis_code: parts[5] || '',
          });
        }
      }

      setImportRows(rows);
    };
    reader.readAsText(file);
  };

  const handleBulkImportSubmit = async () => {
    if (importRows.length === 0) {
      toast.error('No rows to import');
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch('/api/admin/schools/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: importRows,
          auto_create_circuits: autoCreateCircuits,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Successfully imported ${data.importedCount} schools!`);
      setBulkImportOpen(false);
      setImportRows([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error during import');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered schools
  const filteredSchools = schools.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.school_login_id.toLowerCase().includes(search.toLowerCase()) ||
      (s.emis_code && s.emis_code.toLowerCase().includes(search.toLowerCase())) ||
      (s.town && s.town.toLowerCase().includes(search.toLowerCase()));

    const matchesCircuit = circuitFilter === 'all' || s.circuit_id === circuitFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || s.default_levels?.includes(levelFilter);

    return matchesSearch && matchesCircuit && matchesStatus && matchesLevel;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Schools Directory &amp; PINs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage schools, assign circuits, generate single or bulk PIN slips.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkPinSlips([]);
                setBulkPinModalOpen(true);
              }}
              className="text-xs font-bold border-slate-300 dark:border-slate-700"
            >
              <KeyRound className="h-4 w-4 mr-1.5" />
              <span>Circuit PIN Slips</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setImportRows([]);
                setBulkImportOpen(true);
              }}
              className="text-xs font-bold border-slate-300 dark:border-slate-700"
            >
              <Upload className="h-4 w-4 mr-1.5" />
              <span>Bulk Import CSV</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                if (circuits.length === 0) {
                  toast.error('Please create at least one Circuit first before adding schools.');
                  return;
                }
                setCircuitId(circuits[0]?.id || '');
                setAddModalOpen(true);
              }}
              className="bg-brand-navy hover:bg-brand-midBlue text-white text-xs font-bold"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Add School</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search school name, Login ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>

          <select
            value={circuitFilter}
            onChange={(e) => setCircuitFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="all">All Circuits ({circuits.length})</option>
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="all">All Statuses (Public &amp; Private)</option>
            <option value="public">Public (Government)</option>
            <option value="private">Private</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold"
          >
            <option value="all">All Education Levels</option>
            <option value="creche">Crèche / Nursery</option>
            <option value="kg">Kindergarten (KG)</option>
            <option value="primary">Primary School</option>
            <option value="jhs">Junior High School (JHS)</option>
          </select>
        </div>

        {/* Schools Table */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">School Login ID</th>
                    <th className="p-3.5">School Name</th>
                    <th className="p-3.5">Circuit</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Active Levels</th>
                    <th className="p-3.5">Submission</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSchools.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No schools found. Add a school or use &quot;Bulk Import CSV&quot; to seed district schools.
                      </td>
                    </tr>
                  ) : (
                    filteredSchools.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono font-bold text-brand-navy dark:text-brand-gold">
                          {s.school_login_id}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-foreground block">{s.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            EMIS: {s.emis_code || '1066329999'}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{s.circuits?.name || 'Unassigned'}</td>
                        <td className="p-3.5 capitalize">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === 'private'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(s.default_levels || []).map((lvl: string) => (
                              <span
                                key={lvl}
                                className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 uppercase"
                              >
                                {lvl}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {s.submission_status === 'submitted' ? (
                            <Badge variant="success" className="text-[10px]">
                              Submitted
                            </Badge>
                          ) : s.submission_status === 'draft' ? (
                            <Badge variant="gold" className="text-[10px]">
                              Draft
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Not Started
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResetPin(s.id)}
                            className="h-8 text-[11px] font-semibold border-slate-300 dark:border-slate-700"
                            title="Generate a new PIN for this school"
                          >
                            <KeyRound className="h-3 w-3 mr-1" />
                            <span>Reset PIN</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add School Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-brand-navy dark:text-brand-gold">
              Add New School
            </DialogTitle>
            <DialogDescription>
              Creating a school automatically provisions its unique School Login ID and random 6-digit PIN.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSchool} className="space-y-4 mt-2">
            <Input
              label="Official School Name"
              required
              placeholder="e.g. Nyinahin D/A Basic School"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Circuit Assignment <span className="text-brand-error">*</span>
                </label>
                <select
                  required
                  value={circuitId}
                  onChange={(e) => setCircuitId(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  <option value="">Select Circuit</option>
                  {circuits
                    .filter((c) => c.is_active)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Institution Status <span className="text-brand-error">*</span>
                </label>
                <select
                  value={schoolStatus}
                  onChange={(e) => setSchoolStatus(e.target.value as any)}
                  className="flex h-11 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  <option value="public">Public (Government)</option>
                  <option value="private">Private Institution</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="EMIS Code (Optional)"
                placeholder="e.g. 1066320014"
                value={emisCode}
                onChange={(e) => setEmisCode(e.target.value)}
              />
              <Input
                label="Town / Location (Optional)"
                placeholder="e.g. Nyinahin"
                value={town}
                onChange={(e) => setTown(e.target.value)}
              />
            </div>

            {/* Default Starting Levels */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Starting Default Levels (Headteacher will confirm on annual form)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EDUCATION_LEVELS.map((lvl) => (
                  <label
                    key={lvl.id}
                    className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium cursor-pointer"
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

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingSchool || !schoolName.trim() || !circuitId}
                className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold"
              >
                {isSubmittingSchool ? 'Creating School...' : 'Create School & Generate PIN'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Single Printable PIN Slip Modal */}
      <Dialog open={pinSlipOpen} onOpenChange={setPinSlipOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div id="single-pin-slip" className="p-6 bg-white dark:bg-slate-900 space-y-5">
            {/* Coat of Arms Slip Header */}
            <div className="flex flex-col items-center text-center space-y-1.5 border-b-2 border-brand-gold pb-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden">
                <Image
                  src="/branding/coat_of_arms.png"
                  alt="Ghana Coat of Arms"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase text-brand-navy dark:text-brand-gold">
                  Atwima Mponua District Education Directorate
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase">
                  Planning &amp; Statistics Unit — Official Login Slip
                </p>
              </div>
            </div>

            {/* School Credentials Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 space-y-3 text-center">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">School Name</span>
                <p className="font-extrabold text-foreground text-base">{pinSlipData?.school_name}</p>
                <p className="text-xs text-muted-foreground">{pinSlipData?.circuit_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    School Login ID
                  </span>
                  <span className="font-mono font-extrabold text-brand-navy dark:text-brand-gold text-lg">
                    {pinSlipData?.school_login_id}
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Initial PIN
                  </span>
                  <span className="font-mono font-extrabold text-brand-error text-lg tracking-widest">
                    {pinSlipData?.pin}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Hand this official slip to the Headteacher. The system will prompt the headteacher to set a new PIN upon first login.
            </p>

            <div className="flex items-center gap-2 pt-1 no-print">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `School: ${pinSlipData?.school_name}\nLogin ID: ${pinSlipData?.school_login_id}\nPIN: ${pinSlipData?.pin}`
                  );
                  toast.success('Copied credentials to clipboard');
                }}
                className="flex-1 text-xs font-bold"
              >
                <Copy className="h-4 w-4 mr-1" />
                <span>Copy</span>
              </Button>
              <Button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-brand-navy hover:bg-brand-midBlue text-white text-xs font-bold"
              >
                <Printer className="h-4 w-4 mr-1" />
                <span>Print Slip</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Circuit PINs Modal */}
      <Dialog open={bulkPinModalOpen} onOpenChange={setBulkPinModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-brand-navy dark:text-brand-gold">
              Generate PIN Slips for Circuit
            </DialogTitle>
            <DialogDescription>
              Generate printable credential slips for all headteachers in an educational circuit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-3">
              <select
                value={selectedCircuitForPins}
                onChange={(e) => setSelectedCircuitForPins(e.target.value)}
                className="flex-1 h-10 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold"
              >
                <option value="">Select Circuit</option>
                {circuits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c._school_count || 0} active schools)
                  </option>
                ))}
              </select>

              <Button
                onClick={handleGenerateCircuitPins}
                disabled={isGeneratingBulkPins || !selectedCircuitForPins}
                className="bg-brand-navy hover:bg-brand-midBlue text-white text-xs font-bold"
              >
                {isGeneratingBulkPins ? 'Generating...' : 'Generate Circuit PINs'}
              </Button>
            </div>

            {bulkPinSlips.length > 0 && (
              <div className="space-y-4 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Generated Slips ({bulkPinSlips.length} Schools)
                  </span>
                  <Button
                    size="sm"
                    onClick={() => window.print()}
                    className="bg-brand-navy hover:bg-brand-midBlue text-white text-xs font-bold"
                  >
                    <Printer className="h-4 w-4 mr-1.5" />
                    <span>Print All Circuit Slips</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bulkPinSlips.map((slip) => (
                    <div
                      key={slip.school_id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2 text-xs"
                    >
                      <span className="font-bold text-foreground block">{slip.school_name}</span>
                      <div className="flex justify-between font-mono pt-1 border-t">
                        <span>ID: <strong>{slip.school_login_id}</strong></span>
                        <span>PIN: <strong className="text-brand-error tracking-wider">{slip.pin}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Schools Modal */}
      <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-brand-navy dark:text-brand-gold">
              Bulk Import Schools (CSV / Excel)
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file containing school records. Missing circuits can be automatically created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-foreground block">CSV Template</span>
                <span className="text-[11px] text-muted-foreground">
                  Columns: school_name, status, circuit, levels, town, emis_code
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-xs font-bold"
              >
                <Download className="h-4 w-4 mr-1.5" />
                <span>Download Template</span>
              </Button>
            </div>

            {/* File Upload Input */}
            <div className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
              <div>
                <label
                  htmlFor="csv-upload"
                  className="text-xs font-bold text-brand-navy dark:text-brand-gold hover:underline cursor-pointer"
                >
                  Choose CSV file
                </label>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <p className="text-[11px] text-muted-foreground mt-0.5">Upload .csv file with headers</p>
              </div>
            </div>

            {/* Auto Create Circuits Checkbox */}
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <Checkbox
                checked={autoCreateCircuits}
                onCheckedChange={(c) => setAutoCreateCircuits(!!c)}
              />
              <span>Auto-create missing circuits found in the CSV file</span>
            </label>

            {/* Import Preview Table */}
            {importRows.length > 0 && (
              <div className="space-y-2 pt-2 border-t">
                <span className="text-xs font-bold text-foreground">
                  Preview ({importRows.length} Rows Found)
                </span>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-semibold">
                      <tr>
                        <th className="p-2">School Name</th>
                        <th className="p-2">Circuit</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Levels</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importRows.map((r, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold">{r.school_name}</td>
                          <td className="p-2">{r.circuit}</td>
                          <td className="p-2 capitalize">{r.status}</td>
                          <td className="p-2">{r.levels}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkImportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleBulkImportSubmit}
                disabled={isImporting || importRows.length === 0}
                className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold text-xs"
              >
                {isImporting ? 'Importing Schools...' : `Import ${importRows.length} Schools`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
