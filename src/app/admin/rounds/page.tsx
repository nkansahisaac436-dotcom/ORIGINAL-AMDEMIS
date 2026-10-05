'use client';

import * as React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CalendarDays, Plus, Clock, Lock, Unlock, Edit2, CheckCircle2 } from 'lucide-react';
import { formatDateTime, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminRoundsPage() {
  const [rounds, setRounds] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Add/Edit Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingRound, setEditingRound] = React.useState<any>(null);
  const [title, setTitle] = React.useState('');
  const [instructions, setInstructions] = React.useState('');
  const [openingDate, setOpeningDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [deadlineDate, setDeadlineDate] = React.useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );
  const [isActive, setIsActive] = React.useState(true);
  const [isLocked, setIsLocked] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchRounds = async () => {
    try {
      const res = await fetch('/api/admin/rounds');
      if (res.ok) {
        setRounds(await res.json());
      }
    } catch {
      toast.error('Failed to load collection rounds');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRounds();
  }, []);

  const handleOpenCreate = () => {
    setEditingRound(null);
    setTitle('2025/2026 Academic Year');
    setInstructions('Please complete your annual EMIS return accurately before the deadline.');
    setOpeningDate(new Date().toISOString().split('T')[0]);
    setDeadlineDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setIsActive(true);
    setIsLocked(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (round: any) => {
    setEditingRound(round);
    setTitle(round.title);
    setInstructions(round.instructions || '');
    setOpeningDate(round.opening_date ? round.opening_date.split('T')[0] : '');
    setDeadlineDate(round.deadline ? new Date(round.deadline).toISOString().slice(0, 16) : '');
    setIsActive(round.is_active);
    setIsLocked(round.is_locked);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadlineDate) {
      toast.error('Title and deadline are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRound) {
        const res = await fetch('/api/admin/rounds', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingRound.id,
            title,
            instructions,
            opening_date: openingDate,
            deadline: new Date(deadlineDate).toISOString(),
            is_active: isActive,
            is_locked: isLocked,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success('Collection round updated successfully');
      } else {
        const res = await fetch('/api/admin/rounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            instructions,
            opening_date: openingDate,
            deadline: new Date(deadlineDate).toISOString(),
            is_active: isActive,
            is_locked: isLocked,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success('Collection round created and activated!');
      }
      setModalOpen(false);
      fetchRounds();
    } catch {
      toast.error('Error saving collection round');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLock = async (round: any) => {
    try {
      const res = await fetch('/api/admin/rounds', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: round.id,
          is_locked: !round.is_locked,
        }),
      });
      if (res.ok) {
        toast.success(`Round ${!round.is_locked ? 'locked' : 'unlocked'} successfully`);
        fetchRounds();
      }
    } catch {
      toast.error('Failed to update round lock status');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Annual Collection Rounds</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage academic year data collection windows, deadlines, and lock states.
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold text-xs h-10 flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create Collection Round</span>
          </Button>
        </div>

        {/* Rounds List */}
        <div className="grid grid-cols-1 gap-4">
          {rounds.length === 0 ? (
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-12">
              <CardContent className="space-y-3">
                <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-bold text-foreground">No Collection Rounds</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click &quot;Create Collection Round&quot; to open the first annual data collection cycle for the district.
                </p>
              </CardContent>
            </Card>
          ) : (
            rounds.map((round) => (
              <Card
                key={round.id}
                className={`border bg-white dark:bg-slate-900 shadow-xs transition-all ${
                  round.is_active
                    ? 'border-2 border-brand-midBlue/60 dark:border-brand-gold/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">
                        {round.title}
                      </CardTitle>
                      {round.is_active && (
                        <Badge variant="success" className="text-[10px]">
                          Active Collection Window
                        </Badge>
                      )}
                      {round.is_locked && (
                        <Badge variant="destructive" className="text-[10px]">
                          Locked
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {round.instructions || 'Annual data collection for district planning'}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleLock(round)}
                      className="text-xs font-semibold h-8"
                    >
                      {round.is_locked ? (
                        <>
                          <Unlock className="h-3.5 w-3.5 mr-1" />
                          <span>Unlock</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5 mr-1" />
                          <span>Lock Round</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEdit(round)}
                      className="text-xs font-semibold h-8"
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      <span>Edit &amp; Deadline</span>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Opening Date
                      </span>
                      <span className="font-semibold text-foreground">{formatDate(round.opening_date)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Deadline
                      </span>
                      <span className="font-bold text-brand-error text-xs">
                        {formatDateTime(round.deadline)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Submitted Returns
                      </span>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        {round.submitted_count || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                        Drafts In Progress
                      </span>
                      <span className="font-extrabold text-amber-600 text-sm">
                        {round.draft_count || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Round Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-brand-navy dark:text-brand-gold">
              {editingRound ? 'Edit Collection Round' : 'Create Collection Round'}
            </DialogTitle>
            <DialogDescription>
              Set round details, guidelines, opening dates, and strict submission deadlines.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <Input
              label="Academic Year Title"
              required
              placeholder="e.g. 2026/2027 Academic Year"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-foreground">
                Instructions for Headteachers
              </label>
              <textarea
                rows={2}
                placeholder="Enter instructions..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="flex w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Opening Date"
                type="date"
                required
                value={openingDate}
                onChange={(e) => setOpeningDate(e.target.value)}
              />
              <Input
                label="Deadline (Date & Time)"
                type="datetime-local"
                required
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-1 border-t">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-brand-navy focus:ring-brand-gold"
                />
                <span>Set as Active Collection Round (Headteachers will see this round)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLocked}
                  onChange={(e) => setIsLocked(e.target.checked)}
                  className="rounded border-slate-300 text-brand-navy focus:ring-brand-gold"
                />
                <span>Lock Round (Prevents new submissions or edits)</span>
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
                disabled={isSubmitting || !title.trim()}
                className="bg-brand-navy hover:bg-brand-midBlue text-white font-bold"
              >
                {isSubmitting ? 'Saving...' : editingRound ? 'Update Round' : 'Create & Open Round'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
