 'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, GripVertical, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

// Empty by default, populate from real DB/API later
const mockFAQs: FAQ[] = [];

export default function FAQPage() {
  const [faqs] = useState<FAQ[]>(mockFAQs);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQs = faqs.filter((f) => f.question.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold text-white'>Quản lý FAQ</h2>
          <p className='text-gray-400 mt-1'>Câu hỏi thường gặp</p>
        </div>
        <button className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl'>
          <Plus className='w-4 h-4' /> Thêm câu hỏi
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='bg-gray-900/50 border border-gray-800 rounded-2xl p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500' />
          <input
            type='text'
            placeholder='Tìm câu hỏi...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white'
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='bg-gray-900/50 border border-gray-800 rounded-2xl divide-y divide-gray-800'
      >
        {filteredFAQs.length === 0 && (
            <div className='p-4 text-gray-400 text-sm flex items-center gap-2'>
              <HelpCircle className='w-4 h-4' /> Chưa có dữ liệu. Thêm câu hỏi mới.
            </div>
        )}

        {filteredFAQs.map((faq) => (
          <div key={faq.id} className='p-4'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-3 flex-1'>
                <button className='p-2 text-gray-500 cursor-grab'>
                  <GripVertical className='w-4 h-4' />
                </button>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-2'>
                    <span className='text-sm text-blue-400 font-medium'>{faq.id}</span>
                    <span className='px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded'>{faq.category}</span>
                    {!faq.isActive && (
                      <span className='px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded'>áº¨n</span>
                    )}
                  </div>
                  <h3 className='text-white font-medium'>{faq.question}</h3>
                  {expandedId === faq.id && <p className='text-gray-400 mt-2 text-sm'>{faq.answer}</p>}
                </div>
              </div>
              <div className='flex items-center gap-1'>
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className='p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg'
                >
                  {expandedId === faq.id ? (
                    <ChevronUp className='w-4 h-4' />
                  ) : (
                    <ChevronDown className='w-4 h-4' />
                  )}
                </button>
                <button className='p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg'>
                  <Edit className='w-4 h-4' />
                </button>
                <button className='p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg'>
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
