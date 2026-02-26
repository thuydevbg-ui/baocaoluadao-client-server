"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  count: number;
  status: 'active' | 'hidden';
}

const mockCategories: Category[] = [];

export default function CategoriesPage() {
  const [categories] = useState<Category[]>(mockCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div><h2 className='text-2xl font-bold text-white'>Danh mục</h2><p className='text-gray-400 mt-1'>Quản lý danh mục lừa đảo</p></div>
        <button className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl'><Plus className='w-4 h-4'/>Thêm danh mục</button>
      </div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className='bg-gray-900/50 border border-gray-800 rounded-2xl p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500'/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder='Tìm danh mục...' className='w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'/>
        </div>
      </motion.div>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {filtered.length === 0 && (
          <div className='col-span-full text-gray-400 text-sm bg-gray-900/50 border border-gray-800 rounded-2xl p-4'>Chưa có dữ liệu. Thêm danh mục mới.</div>
        )}
        {filtered.map((cat) => (
          <div key={cat.id} className={`bg-gray-900/50 border rounded-2xl p-5 transition-all hover:border-gray-700 ${cat.status==='hidden'?'opacity-60':''}`}>
            <div className='flex items-center justify-between mb-3'>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center text-white font-semibold`}>{cat.name.slice(0,2).toUpperCase()}</div>
              <div className='flex items-center gap-2'>
                <button className='p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg'><Edit className='w-4 h-4'/></button>
                <button className='p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg'><Trash2 className='w-4 h-4'/></button>
              </div>
            </div>
            <h3 className='text-white font-semibold text-lg'>{cat.name}</h3>
            <p className='text-gray-400 text-sm mt-1'>{cat.description}</p>
            <div className='mt-3 text-sm text-gray-500'>Số báo cáo: {cat.count}</div>
            <div className={'mt-2 inline-flex items-center px-2.5 py-1 text-xs rounded-full ' + (cat.status==='active'?'bg-green-500/20 text-green-300':'bg-gray-700 text-gray-300')}>
              {cat.status==='active'?'Hoạt động':'Ẩn'}
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
