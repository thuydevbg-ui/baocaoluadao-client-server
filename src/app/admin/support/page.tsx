'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Eye, CheckCircle, Clock } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

interface Feedback {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'processing' | 'resolved';
  createdAt: string;
}

const mockFeedback: Feedback[] = [];

export default function SupportPage() {
  const { theme } = useAdminTheme();
  const [feedbacks] = useState<Feedback[]>(mockFeedback);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = feedbacks.filter(f => {
    const matchesSearch = f.subject.toLowerCase().includes(searchQuery.toLowerCase()) || f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const c: Record<string, {l: string, c: string, i: any}> = { new: {l:'Mới',c:'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',i:Clock}, processing: {l:'Đang xử lý',c:'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',i:Clock}, resolved: {l:'Đã giải quyết',c:'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',i:CheckCircle} };
    const x = c[status] || c.new;
    return <span className={'px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ' + x.c}><x.i className='w-3 h-3'/>{x.l}</span>;
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div><h2 className='text-2xl font-bold text-text-main'>Hỗ trợ người dùng</h2><p className='text-text-muted mt-1'>Quản lý phản hồi</p></div>
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className='bg-bg-card border border-bg-border rounded-2xl p-4 shadow-sm'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted'/>
            <input
              type='text'
              placeholder='Tìm kiếm...'
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none'
            />
          </div>
          <select
            value={statusFilter}
            onChange={e=>setStatusFilter(e.target.value)}
            className='px-4 py-2.5 bg-bg-card border border-bg-border rounded-xl text-text-main focus:border-primary focus:ring-1 focus:ring-primary outline-none'
          >
            <option value='all'>Tất cả</option><option value='new'>Mới</option><option value='processing'>Đang xử lý</option><option value='resolved'>Đã giải quyết</option>
          </select>
        </div>
      </motion.div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className='bg-bg-card border border-bg-border rounded-2xl divide-y divide-bg-border shadow-sm'>
        {filtered.map(f=>(
          <div key={f.id} className='p-4 hover:bg-bg-cardHover transition-colors'>
            <div className='flex items-start justify-between gap-4 mb-2'>
              <div className='flex items-center gap-3'>
                <MessageSquare className='w-5 h-5 text-text-muted'/>
                <div>
                  <h3 className='text-text-main font-medium'>{f.subject}</h3>
                  <p className='text-xs text-text-muted'>{f.name} - {f.email}</p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                {getStatusBadge(f.status)}
                <span className='text-xs text-text-muted'>{f.createdAt}</span>
              </div>
            </div>
            <p className='text-sm text-text-secondary mb-3'>{f.message}</p>
            <div className='flex gap-2'>
              <button className='flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg'><Eye className='w-4 h-4'/>Xem chi tiết</button>
              {f.status!=='resolved'&&<button className='flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg'><CheckCircle className='w-4 h-4'/>Đánh dấu đã giải quyết</button>}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
