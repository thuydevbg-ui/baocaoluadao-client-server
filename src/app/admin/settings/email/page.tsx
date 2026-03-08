'use client';

import React from 'react';
import { Mail } from 'lucide-react';
import { EmailSmtpSettingsPanel } from '@/components/admin/settings/EmailSmtpSettingsPanel';

export default function AdminEmailSettingsPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">Email / SMTP</h2>
          </div>
          <p className="text-xs text-slate-500">Cấu hình SMTP để gửi email xác minh và thông báo hệ thống.</p>
        </div>

        <div className="p-5">
          <EmailSmtpSettingsPanel />
        </div>
      </section>
    </div>
  );
}

