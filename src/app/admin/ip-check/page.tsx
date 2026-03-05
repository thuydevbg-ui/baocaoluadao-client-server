"use client";

import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, XCircle, Home, LogIn } from 'lucide-react';
import Link from 'next/link';

type IpCheckResponse = {
  ip: string | null;
  allowed: boolean;
  allowListSize: number;
  allowList: string[];
};

export default function AdminIpCheckPage() {
  const [data, setData] = useState<IpCheckResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/admin/ip-check', { cache: 'no-store' });
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError('Không thể kiểm tra IP. Vui lòng thử lại.');
      }
    };
    run();
  }, []);

  const allowed = data?.allowed;
  const ip = data?.ip || 'Không xác định';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white/95 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white p-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm opacity-90">Bảo mật truy cập Admin</p>
            <h1 className="text-xl font-semibold">Kiểm tra IP trước khi đăng nhập</h1>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : (
            <>
              <div className={`flex items-center gap-3 rounded-2xl border p-4 ${allowed ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
                {allowed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
                <div>
                  <p className="text-sm text-slate-500">Địa chỉ IP của bạn</p>
                  <p className="text-lg font-semibold text-slate-900">{ip}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {allowed
                      ? 'IP hợp lệ. Bạn có thể tiếp tục đăng nhập.'
                      : 'IP không nằm trong danh sách cho phép. Vui lòng liên hệ quản trị viên.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Danh sách IP được phép: {data?.allowListSize ?? 0}</span>
                {data?.allowListSize ? (
                  <span className="truncate max-w-[180px]" title={data.allowList.join(', ')}>
                    {data.allowList.slice(0, 3).join(', ')}{data.allowList.length > 3 ? '…' : ''}
                  </span>
                ) : (
                  <span>Không giới hạn</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Về trang chủ
                </Link>
                <Link
                  href="/admin/login"
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white transition-colors ${
                    allowed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 cursor-not-allowed'
                  }`}
                  aria-disabled={!allowed}
                  onClick={(e) => {
                    if (!allowed) e.preventDefault();
                  }}
                >
                  <LogIn className="w-4 h-4" />
                  Tiếp tục đăng nhập
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
