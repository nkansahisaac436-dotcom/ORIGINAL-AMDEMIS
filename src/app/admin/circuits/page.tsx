'use client';

import * as React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Plus, Edit2, CheckCircle2, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCircuitsPage() {
  const [circuits, setCircuits] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  // Add/Edit Modal
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingCircuit, setEditingCircuit] = React.useState<any>(null);
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchCircuits = async () => {
    try {
      const res = await fetch('/api/admin/circuits');
      if (res.ok) {
        const data = await res.json();
        setCircuits(data);
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
    setName('');
    setCode('');
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (circuit: any) => {
    setEditingCircuit(circuit);
    setName(circuit.name);
    setCode(circuit.code || '');
    setIsActive(circuit.is_active);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Circuit name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCircuit) {
        const res = await fetch('/api/admin/circuits', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCircuit.id,
            name,
            code,
            is_active: isActive,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success('Circuit updated successfully');
      } else {
        const res = await fetch('/api/admin/circuits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            code,
            is_active: isActive,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success('Circuit created successfully');
      }
      setModalOpen(false);
      fetchCircuits();
    } catch {
      toast.error('Error saving circuit. Please ensure the name is unique.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCircuits = circuits.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">District Circuits</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage educational circuits and cluster zones across Atwima Mponua District.
            </p>
          </div>

          <Button
            onClick={handleOpenAdd}
            className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold text-xs h-10 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Circuit</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search circuits..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
          </div>
        </div>

        {/* Circuits Table */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">Circuit Name</th>
                    <th className="p-3.5">Code / Identifier</th>
                    <th className="p-3.5">Assigned Schools</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCircuits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No circuits found. Click &quot;Add Circuit&quot; to create your first educational circuit.
                      </td>
                    </tr>
                  ) : (
                    filteredCircuits.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-brand-midBlue" />
                          <span>{c.name}</span>
                        </td>
                        <td className="p-3.5 font-mono text-muted-foreground">{c.code || '—'}</td>
                        <td className="p-3.5 font-semibold text-foreground">
                          {c._school_count} active schools
                        </td>
                        <td className="p-3.5">
                          {c.is_active ? (
                            <Badge variant="success" className="text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Deactivated
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEdit(c)}
                            className="h-8 text-xs font-semibold text-brand-navy dark:text-blue-300"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            <span>Edit</span>
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

      {/* Add / Edit Circuit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-brand-navy dark:text-brand-gold">
              {editingCircuit ? 'Edit Circuit' : 'Add New District Circuit'}
            </DialogTitle>
            <DialogDescription>
              Enter the official name and code for this educational zone.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <Input
              label="Circuit Name"
              required
              placeholder="e.g. Nyinahin Circuit"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Circuit Code / Abbreviation (Optional)"
              placeholder="e.g. NYN"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="circuit-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-navy focus:ring-brand-gold"
              />
              <label htmlFor="circuit-active" className="text-xs font-semibold text-foreground cursor-pointer">
                Circuit is Active (Available for school assignments)
              </label>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold"
              >
                {isSubmitting ? 'Saving...' : editingCircuit ? 'Update Circuit' : 'Create Circuit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
