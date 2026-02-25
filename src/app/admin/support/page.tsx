'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Eye, CheckCircle, Clock, XCircle, Send } from 'lucide-react';

interface Feedback {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'processing' | 'resolved';
  createdAt: string;
}

const mockFeedback: Feedback[] = [
  { id: 'FB001', name: 'Nguyễn Văn A', email: 'nva@email.com', subject: 'Phản hồi về website', message: 'Website rất hữu ích...', status: 'new', createdAt: '2024-01-15 10:30' },
  { id: 'FB002', name: 'Trần Thị B', email: 'ttb@email.com', subject: 'Báo lỗi', message: 'Không thể tìm kiếm...', status: 'processing', createdAt: '2024-01-14 15:20' },
  { id: 'FB003', name: 'Lê Văn C', email: 'lvc@email.com', subject: 'Đề xuất tính năng', message: 'Nên thêm chức năng...', status: 'resolved', createdAt: '2024-01-13 09:10' },
];

export default function SupportPage() {
  const [feedbacks] = useState<Feedback[]>(mockFeedback);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = feedbacks.filter(f => {
    const matchesSearch = f.subject.toLowerCase().includes(searchQuery.toLowerCase()) || f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const c: Record<string, {l: string, c: string, i: any}> = { new: {l:'Mới',c:'bg-blue-500/20 text-blue-400',i:Clock}, processing: {l:'Đang xử lý',c:'bg-yellow-500/20 text-yellow-400',i:Clock}, resolved: {l:'Đã giải quyết',c:'bg-green-500/20 text-green-400',i:CheckCircle} };
    const x = c[status] || c.new;
    return <span className={'px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 ' + x.c}><x.i className='w-3 h-3'/>{x.l}</span>;
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div><h2 className='text-2xl font-bold text-white'>Hỗ trợ người dùng</h2><p className='text-gray-400 mt-1'>Quản lý phản hồi</p></div>
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className='bg-gray-900/50 border border-gray-800 rounded-2xl p-4'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='relative flex-1'><Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500'/><input type='text' placeholder='Tìm kiếm...' value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className='w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/></div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className='px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'><option value='all'>Tất cả</option><option value='new'>Mới</option><option value='processing'>Đang xử lý</option><option value='resolved'>Đã giải quyết</option></select>
        </div>
      </motion.div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className='bg-gray-900/50 border border-gray-800 rounded-2xl divide-y divide-gray-800'>
        {filtered.map(f=>(<div key={f.id} className='p-4 hover:bg-gray-800/50 transition-colors'><div className='flex items-start justify-between gap-4 mb-2'><div className='flex items-center gap-3'><MessageSquare className='w-5 h-5 text-gray-500'/><div><h3 className='text-white font-medium'>{f.subject}</h3><p className='text-xs text-gray-500'>{f.name} - {f.email}</p></div></div><div className='flex items-center gap-2'>{getStatusBadge(f.status)}<span className='text-xs text-gray-500'>{f.createdAt}</span></div></div><p className='text-sm text-gray-400 mb-3'>{f.message}</p><div className='flex gap-2'><button className='flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg'><Eye className='w-4 h-4'/>Xem chi tiết</button>{f.status!=='resolved'&&<button className='flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg'><CheckCircle className='w-4 h-4'/>Đánh dấu đã giải quyết</button>}</div></div>))}
      </motion.div>
    </div>
  );
}
