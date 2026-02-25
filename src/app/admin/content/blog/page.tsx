'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, FileText, EyeOff as Hidden } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  status: 'published' | 'draft';
  author: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

const mockPosts: BlogPost[] = [
  { id: 'B001', title: 'Cách nhận biết email lừa đảo', excerpt: 'Hướng dẫn nhận biết email giả mạo...', category: 'Hướng dẫn', status: 'published', author: 'Admin', views: 1250, createdAt: '2024-01-10', updatedAt: '2024-01-10' },
  { id: 'B002', title: 'Cảnh báo: Chiêu lừa đảo mới 2024', excerpt: 'Các chiêu lừa đảo mới nhất...', category: 'Tin tức', status: 'published', author: 'Admin', views: 2340, createdAt: '2024-01-08', updatedAt: '2024-01-09' },
  { id: 'B003', title: 'Bảo vệ tài khoản ngân hàng', excerpt: 'Cách bảo vệ tài khoản...', category: 'Hướng dẫn', status: 'draft', author: 'Admin', views: 0, createdAt: '2024-01-05', updatedAt: '2024-01-12' },
];

export default function BlogPage() {
  const [posts] = useState<BlogPost[]>(mockPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPosts = posts.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div><h2 className='text-2xl font-bold text-white'>Quản lý Blog</h2><p className='text-gray-400 mt-1'>Danh sách bài viết</p></div>
        <button className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl'><Plus className='w-4 h-4'/>Viết bài mới</button>
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className='bg-gray-900/50 border border-gray-800 rounded-2xl p-4'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='relative flex-1'><Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500'/><input type='text' placeholder='Tìm bài viết...' value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className='w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/></div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className='px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'><option value='all'>Tất cả</option><option value='published'>Đã xuất bản</option><option value='draft'>Bản nháp</option></select>
        </div>
      </motion.div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className='bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden'>
        <div className='overflow-x-auto'><table className='w-full'><thead><tr className='border-b border-gray-800'><th className='text-left p-4 text-sm font-medium text-gray-400'>ID</th><th className='text-left p-4 text-sm font-medium text-gray-400'>Tiêu đề</th><th className='text-left p-4 text-sm font-medium text-gray-400'>Danh mục</th><th className='text-left p-4 text-sm font-medium text-gray-400'>Trạng thái</th><th className='text-left p-4 text-sm font-medium text-gray-400'>Lượt xem</th><th className='text-left p-4 text-sm font-medium text-gray-400'>Ngày tạo</th><th className='text-right p-4 text-sm font-medium text-gray-400'>Thao tác</th></tr></thead><tbody>{filteredPosts.map(p=>(<tr key={p.id} className='border-b border-gray-800 hover:bg-gray-800/50'><td className='p-4'><span className='text-sm font-medium text-blue-400'>{p.id}</span></td><td className='p-4'><div><span className='text-sm font-medium text-white'>{p.title}</span><p className='text-xs text-gray-500 mt-0.5'>{p.excerpt}</p></div></td><td className='p-4'><span className='text-sm text-gray-400'>{p.category}</span></td><td className='p-4'><span className={'px-2.5 py-1 text-xs font-medium rounded-full '+(p.status==='published'?'bg-green-500/20 text-green-400':'bg-yellow-500/20 text-yellow-400')}>{p.status==='published'?'Đã xuất bản':'Bản nháp'}</span></td><td className='p-4'><span className='text-sm text-white'>{p.views.toLocaleString()}</span></td><td className='p-4 text-sm text-gray-500'>{p.createdAt}</td><td className='p-4'><div className='flex items-center justify-end gap-1'><button className='p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg'><Eye className='w-4 h-4'/></button><button className='p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg'><Edit className='w-4 h-4'/></button><button className='p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg'><Trash2 className='w-4 h-4'/></button></div></td></tr>))}</tbody></table></div>
      </motion.div>
    </div>
  );
}
