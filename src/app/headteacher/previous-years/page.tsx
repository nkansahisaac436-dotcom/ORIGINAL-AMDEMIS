'use client';

import * as React from 'react';
import { HeadteacherLayout } from '@/components/layout/headteacher-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, FileText, Calendar } from 'lucide-react';

export default function PreviousYearsPage() {
  return (
    <HeadteacherLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Previous Years Data Archive</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Historical annual statistical returns submitted for prior academic cycles in Atwima Mponua.
          </p>
        </div>

        <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center py-12">
          <CardContent className="space-y-3">
            <History className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">No Archived Years Yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              This is the inaugural academic cycle on the new AMDEMIS digital platform. Once collection rounds conclude, past year returns will be archived here for reference.
            </p>
          </CardContent>
        </Card>
      </div>
    </HeadteacherLayout>
  );
}
