'use client';

import * as React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MapPin,
  Plus,
  Edit2,
  Power,
  ChevronDown,
  ChevronUp,
  Search,
  School,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { handleFieldFocus } from '@/hooks/use-visual-viewport';

export default function AdminCircuitsPage() {
  const [circuits, setCircuits] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Add/Rename Bottom Sheet / Modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingCircuit, setEditingCircuit] = React.useState<any>(null);
  const [circuitName, setCircuitName] = React.useState('');
  const [circuitCode, setCircuitCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // Deactivate / Reactivate Confirmation Dialog
  const [statusConfirmOpen, setStatusConfirmOpen] = React.useState(false);
  const [circuitToToggle, setCircuitToToggle] = React.useState<any>(null);
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);

  // Expanded card for showing schools
  const [expandedCircuitId, setExpandedCircuitId] = React.useState<string | null>(null);

  const fetchCircuits = async () => {
    try {
      const res = await fetch('/api/admin/circuits');
      if (res.ok) {
        const data = await res.json();
        setCircuits(data);
      } else {
        toast.error('Failed to load circuits');
      }
    } catch {
      toast.error('Failed to load circuits');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCircuits();
  }, []);

  const handleOpenAdd = () => {
    setEditingCircuit(null);
    setCircuitName('');
    setCircuitCode('');
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenRename = (c: any) => {
    setEditingCircuit(c);
    setCircuitName(c.name);
    setCircuitCode(c.code || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = circuitName.replace(/\s+/g, ' ').trim();

    if (clean.length < 2 || clean.length > 60) {
      setFormError('Circuit name must be between 2 and 60 characters.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingCircuit) {
        const res = await fetch('/api/admin/circuits', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCircuit.id,
            name: clean,
            code: circuitCode.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || 'Failed to update circuit');
          return;
        }

        toast.success(`Circuit renamed to "${clean}"`);
      } else {
        const res = await fetch('/api/admin/circuits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: clean,
            code: circuitCode.trim() || null,
            is_active: true,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setFormError(data.error || 'Failed to create circuit');
          return;
        }

        toast.success(`Circuit "${clean}" created successfully!`);
      }

      setModalOpen(false);
      fetchCircuits();
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!circuitToToggle) return;
    setIsTogglingStatus(true);
    const newStatus = !circuitToToggle.is_active;

    try {
      const res = await fetch('/api/admin/circuits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: circuitToToggle.id,
          is_active: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update status');
        return;
      }

      toast.success(
        newStatus
          ? `Circuit "${circuitToToggle.name}" reactivated.`
          : `Circuit "${circuitToToggle.name}" deactivated.`
      );
      setStatusConfirmOpen(false);
      setCircuitToToggle(null);
      fetchCircuits();
    } catch {
      toast.error('Network error updating circuit status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const filteredCircuits = circuits.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Top Header with Gold Add Button */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-navy dark:text-white">
              District Circuits
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Atwima Mponua educational clusters &amp; zones
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0A2A66] font-extrabold text-xs h-10 px-4 rounded-xl shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add Circuit</span>
          </Button>
        </div>

        {/* Search Input */}
        {circuits.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search circuits by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
        )}

        {/* Circuit Cards List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground font-semibold">
            Loading district circuits...
          </div>
        ) : filteredCircuits.length === 0 ? (
          <Card className="border-2 border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-12 px-4 rounded-2xl">
            <CardContent className="space-y-4 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-slate-800 text-brand-gold flex items-center justify-center mx-auto ring-1 ring-brand-gold/30">
                <MapPin className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  No circuits registered yet.
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Circuits group schools geographically and allow automated headteacher management.
                </p>
              </div>
              <Button
                onClick={handleOpenAdd}
                className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-[#0A2A66] font-black text-sm h-12 rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5 stroke-[3]" />
                <span>Add your first circuit</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCircuits.map((circuit) => {
              const isExpanded = expandedCircuitId === circuit.id;
              const schools = circuit.schools_list || [];

              return (
                <Card
                  key={circuit.id}
                  className={`border bg-white dark:bg-slate-900 rounded-2xl shadow-xs transition-all overflow-hidden ${
                    !circuit.is_active
                      ? 'border-slate-200 dark:border-slate-800 opacity-75'
                      : 'border-slate-200/90 dark:border-slate-800'
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    {/* Top Row: Name, Status & Action Menu */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            circuit.is_active
                              ? 'bg-brand-navy/10 dark:bg-brand-navy/40 text-brand-navy dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-extrabold text-foreground truncate">
                              {circuit.name}
                            </h2>
                            {!circuit.is_active && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5">
                                Deactivated
                              </Badge>
                            )}
                          </div>
                          {circuit.code && (
                            <span className="text-[11px] font-mono text-muted-foreground block mt-0.5">
                              Code: {circuit.code}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Menu Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenRename(circuit)}
                          className="h-8 px-2.5 text-xs font-bold text-brand-navy dark:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          <span>Rename</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCircuitToToggle(circuit);
                            setStatusConfirmOpen(true);
                          }}
                          className={`h-8 px-2.5 text-xs font-bold ${
                            circuit.is_active
                              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          <span>{circuit.is_active ? 'Deactivate' : 'Reactivate'}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Stats Strip */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Registered Schools
                        </span>
                        <span className="text-base font-extrabold text-foreground">
                          {circuit._school_count} schools
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                          Submitted (Active Round)
                        </span>
                        <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                          {circuit._submitted_schools_count} submitted
                        </span>
                      </div>
                    </div>

                    {/* Tap to View Schools */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedCircuitId(isExpanded ? null : circuit.id)
                      }
                      className="w-full mt-3 pt-2 text-xs font-bold text-brand-midBlue dark:text-blue-400 flex items-center justify-between hover:underline"
                    >
                      <span className="flex items-center gap-1.5">
                        <School className="h-3.5 w-3.5" />
                        <span>{isExpanded ? 'Hide schools' : `View schools (${schools.length})`}</span>
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {/* Expanded School List */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        {schools.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic py-2 text-center">
                            No schools assigned to this circuit yet.
                          </p>
                        ) : (
                          schools.map((sch: any) => (
                            <div
                              key={sch.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-foreground block">
                                  {sch.name}
                                </span>
                                <span className="text-[11px] font-mono text-muted-foreground">
                                  {sch.school_login_id} &bull; {sch.status.toUpperCase()}
                                </span>
                              </div>
                              <div>
                                {sch.has_submitted ? (
                                  <Badge variant="success" className="text-[10px] py-0 px-2 h-5">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Submitted
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-2 h-5">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Rename Circuit Bottom Sheet (Mobile Dialog) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
          {/* Header Bar at Top */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-black text-brand-navy dark:text-brand-gold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-gold shrink-0" />
                <span>{editingCircuit ? 'Rename Circuit' : 'Add New Circuit'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {editingCircuit
                  ? 'Enter the updated official name for this educational zone.'
                  : 'Educational cluster zone within Atwima Mponua District Directorate.'}
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            onFocusCapture={handleFieldFocus}
            className="flex-1 flex flex-col min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px] space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-brand-error text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="circuit-name-input"
                  className="block text-xs font-bold text-foreground"
                >
                  Circuit Name <span className="text-brand-error">*</span>
                </label>
                <input
                  id="circuit-name-input"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Nyinahin Circuit"
                  enterKeyHint="next"
                  value={circuitName}
                  onChange={(e) => {
                    setCircuitName(e.target.value);
                    setFormError(null);
                  }}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Must be between 2 and 60 characters and unique across the district.
                </span>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="circuit-code-input"
                  className="block text-xs font-bold text-foreground"
                >
                  Circuit Abbreviation / Code (Optional)
                </label>
                <input
                  id="circuit-code-input"
                  type="text"
                  placeholder="e.g. NYN"
                  enterKeyHint="done"
                  value={circuitCode}
                  onChange={(e) => setCircuitCode(e.target.value.toUpperCase())}
                  className="flex h-11 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-base sm:text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
              </div>
            </div>

            {/* Fixed Footer Above Keyboard on Mobile, Static on Desktop */}
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
                  onClick={() => setModalOpen(false)}
                  className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || circuitName.trim().length < 2}
                  className="h-11 rounded-xl text-xs font-bold bg-brand-navy hover:bg-brand-midBlue text-white border-b-2 border-brand-gold w-full sm:w-auto"
                >
                  {isSubmitting ? 'Saving...' : editingCircuit ? 'Save Changes' : 'Save Circuit'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate / Reactivate Confirmation Dialog */}
      <Dialog open={statusConfirmOpen} onOpenChange={setStatusConfirmOpen}>
        <DialogContent fullScreenOnMobile hideDefaultClose className="sm:max-w-md">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sm:px-0 sm:py-0 sm:pb-3 sm:border-b-0 shrink-0">
            <DialogHeader className="text-left">
              <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <span>
                  {circuitToToggle?.is_active
                    ? `Deactivate ${circuitToToggle?.name}?`
                    : `Reactivate ${circuitToToggle?.name}?`}
                </span>
              </DialogTitle>
            </DialogHeader>
            <button
              type="button"
              onClick={() => setStatusConfirmOpen(false)}
              className="p-2 -mr-1 rounded-full text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 sm:hidden shrink-0"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0 sm:py-2 pb-[130px]">
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              {circuitToToggle?.is_active ? (
                <>
                  Circuits with schools can never be permanently deleted to protect historic records.
                  Deactivating this circuit will prevent officers from assigning new schools to it,
                  while existing schools retain their full access and history.
                </>
              ) : (
                <>Reactivating this circuit will make it available for new school assignments.</>
              )}
            </DialogDescription>
          </div>

          <div
            className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-0 sm:py-3 sm:border-t-0 shrink-0"
            style={{
              bottom: 'var(--kb, 0px)',
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatusConfirmOpen(false)}
                className="h-11 rounded-xl text-xs font-bold w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmToggleStatus}
                disabled={isTogglingStatus}
                className={`h-11 rounded-xl text-xs font-bold text-white w-full sm:w-auto ${
                  circuitToToggle?.is_active
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isTogglingStatus
                  ? 'Updating...'
                  : circuitToToggle?.is_active
                  ? 'Confirm Deactivation'
                  : 'Confirm Reactivation'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
