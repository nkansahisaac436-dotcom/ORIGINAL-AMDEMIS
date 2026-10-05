'use client';

import * as React from 'react';
import { HeadteacherLayout } from '@/components/layout/headteacher-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, HelpCircle, Clock } from 'lucide-react';

export default function HelpPage() {
  return (
    <HeadteacherLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Help &amp; Directorate Support</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Direct assistance channels from the Planning &amp; Statistics Unit in Atwima Mponua District.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-brand-navy dark:text-brand-gold">
                <Phone className="h-5 w-5" />
                Helpline &amp; WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                For urgent login assistance, PIN resets, or EMIS inquiries:
              </p>
              <div className="space-y-1 font-semibold text-foreground">
                <p>📞 District Statistics Officer: +233 (0) 24 412 3456</p>
                <p>📞 Planning Directorate Desk: +233 (0) 32 209 8765</p>
              </div>
              <div className="pt-2 flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <Clock className="h-3.5 w-3.5" />
                <span>Available Mon–Fri: 8:00 AM – 5:00 PM</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-brand-navy dark:text-brand-gold">
                <MapPin className="h-5 w-5" />
                Office Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground">
                Visit the Directorate Planning &amp; Statistics Unit in person:
              </p>
              <p className="font-semibold text-foreground leading-relaxed">
                Atwima Mponua District Education Directorate<br />
                Near District Assembly Complex<br />
                Nyinahin, Ashanti Region, Ghana
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </HeadteacherLayout>
  );
}
