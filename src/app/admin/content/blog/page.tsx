'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, FileText } from 'lucide-react';

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

// Empty by default; hook up to real API/DB when available
const mockPosts: BlogPost[] = [];

export default function BlogPage() {
  const [posts] = useState<BlogPost[]>(mockPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPosts = posts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-white'>Quản lý Blog</h2>
          <p className='text-gray-400 mt-1'>Danh sách bài viết</p>
        </div>
        <button className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl'>
          <Plus className='w-4 h-4' /> Viết bài mới
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='bg-gray-900/50 border border-gray-800 rounded-2xl p-4'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500' />
            <input
              type='text'
            placeholder='Tìm bài viết...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'
          >
            <option value='all'>Táº¥t cáº£</option>
            <option value='published'>Xuáº¥t báº£n</option>
            <option value='draft'>Nháp</option>
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='bg-gray-900/50 border border-gray-800 rounded-2xl divide-y divide-gray-800'
      >
        {filteredPosts.length === 0 && (
            <div className='p-4 text-gray-400 text-sm flex items-center gap-2'>
              <FileText className='w-4 h-4' /> Chưa có bài viết. Thêm bài mới để hiển thị.
            </div>
        )}

        {filteredPosts.map((post) => (
          <div key={post.id} className='p-4 flex items-start justify-between gap-4'>
            <div className='flex items-start gap-3'>
              <div className='p-2 bg-gray-800/60 rounded-xl text-blue-400'>
                <FileText className='w-4 h-4' />
              </div>
              <div>
                <div className='flex items-center gap-2 mb-1'>
                  <span className='text-sm text-blue-400 font-medium'>{post.id}</span>
                  <span className='px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded'>{post.category}</span>
                  <span
                    className={
                      'px-2 py-0.5 text-xs rounded ' +
                      (post.status === 'published' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-200')
                    }
                  >
                    {post.status === 'published' ? 'Xuất bản' : 'Nháp'}
                  </span>
                </div>
                <h3 className='text-white font-medium'>{post.title}</h3>
                <p className='text-gray-400 text-sm mt-1'>{post.excerpt}</p>
                <p className='text-gray-500 text-xs mt-1'>
                  Tác giả: {post.author} · Lượt xem: {post.views} · Cập nhật: {post.updatedAt}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <button className='p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg'>
                <Eye className='w-4 h-4' />
              </button>
              <button className='p-2 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg'>
                <Edit className='w-4 h-4' />
              </button>
              <button className='p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg'>
                <Trash2 className='w-4 h-4' />
              </button>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
