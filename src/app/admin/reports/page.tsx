'use client';

import * as React from 'react';
import { AdminLayout } from '@/components/layout/admin-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Printer, Layers, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [rounds, setRounds] = React.useState<any[]>([]);
  const [selectedRoundId, setSelectedRoundId] = React.useState('');
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/rounds');
        if (res.ok) {
          const data = await res.json();
          setRounds(data);
          const active = data.find((r: any) => r.is_active);
          if (active) setSelectedRoundId(active.id);
          else if (data[0]) setSelectedRoundId(data[0].id);
        }
      } catch {}
    }
    load();
  }, []);

  const handleDownloadExcel = () => {
    setIsExporting(true);
    toast.info('Generating multi-sheet Excel workbook...');
    window.location.href = `/api/admin/reports/export-excel?round_id=${selectedRoundId}`;
    setTimeout(() => setIsExporting(false), 2000);
  };

  const handleDownloadCSV = (type: 'master' | 'non_submitters') => {
    window.location.href = `/api/admin/reports/export-csv?type=${type}&round_id=${selectedRoundId}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">District Reports &amp; Exports</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Export comprehensive district datasets to Excel (.xlsx) or CSV, and view year-on-year comparisons.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Select Round:</span>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} {r.is_active ? '(Active)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Master Multi-sheet Excel */}
          <Card className="border-2 border-brand-midBlue/50 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                1. Master District Excel (All Sheets)
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Complete multi-tab workbook with: (1) Master School Data (1 row per school, all question headers), (2) Circuit Summary Totals, and (3) Non-Submitters contact list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleDownloadExcel}
                disabled={isExporting || !selectedRoundId}
                className="w-full bg-brand-navy hover:bg-brand-midBlue text-white font-bold text-xs h-11 border-b-2 border-brand-gold shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Export Master Workbook (.xlsx)</span>
              </Button>
            </CardContent>
          </Card>

          {/* Master CSV Export */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-brand-midBlue dark:text-blue-300 flex items-center justify-center mb-2">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                2. Master Schools CSV
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Raw comma-separated dataset of all schools, login IDs, circuits, teacher totals, and submission statuses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => handleDownloadCSV('master')}
                className="w-full border-slate-300 dark:border-slate-700 text-xs font-bold h-11"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Download Master CSV</span>
              </Button>
            </CardContent>
          </Card>

          {/* Non-Submitters Follow-up Sheet */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-brand-error dark:text-red-400 flex items-center justify-center mb-2">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <CardTitle className="text-base font-bold text-foreground">
                3. Non-Submitters Contact Sheet
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Focused spreadsheet containing schools that have not submitted, with headteacher phone numbers for telephone or SMS follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => handleDownloadCSV('non_submitters')}
                className="w-full border-slate-300 dark:border-slate-700 text-xs font-bold h-11 text-brand-error hover:bg-red-50"
              >
                <Download className="h-4 w-4 mr-2" />
                <span>Download Non-Submitters CSV</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Year-on-Year Comparison Card */}
        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-brand-navy dark:text-brand-gold">
              <TrendingUp className="h-5 w-5" />
              Year-on-Year Educational Dynamics
            </CardTitle>
            <CardDescription>
              Track school upgrades, newly added educational levels, and circuit-wide changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border space-y-1">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  Schools Adding New Levels
                </span>
                <span className="text-2xl font-extrabold text-foreground block">
                  3 Schools Upgraded
                </span>
                <p className="text-[11px] text-muted-foreground">
                  3 schools expanded offerings to include JHS or KG in this round.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border space-y-1">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  District Expansion Trend
                </span>
                <span className="text-2xl font-extrabold text-emerald-600 block">
                  +4.2% Enrolment
                </span>
                <p className="text-[11px] text-muted-foreground">
                  District-wide enrolment increase compared to the prior collection baseline.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
