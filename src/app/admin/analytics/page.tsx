'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, FileText, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AnalyticsPage() {
  const stats = [
    { title: 'Tổng báo cáo', value: '12,847', icon: FileText, color: 'blue' as const, trend: { value: 12.5, isPositive: true } },
    { title: 'Người dùng mới', value: '1,234', icon: Users, color: 'green' as const, trend: { value: 8.2, isPositive: true } },
    { title: 'Tỷ lệ xác minh', value: '68%', icon: TrendingUp, color: 'purple' as const, trend: { value: 3.1, isPositive: true } },
    { title: 'Thời gian xử lý', value: '2.5h', icon: Calendar, color: 'yellow' as const, trend: { value: 15, isPositive: false } },
  ];
  const monthlyData = [
    { month: 'T1', reports: 1200, users: 450 },
    { month: 'T2', reports: 1450, users: 520 },
    { month: 'T3', reports: 1680, users: 610 },
    { month: 'T4', reports: 1520, users: 580 },
    { month: 'T5', reports: 1890, users: 720 },
    { month: 'T6', reports: 2100, users: 850 },
  ];
  const topReporters = [
    { name: 'Nguyễn Văn A', reports: 156, verified: 142 },
    { name: 'Trần Thị B', reports: 89, verified: 78 },
    { name: 'Lê Văn C', reports: 67, verified: 58 },
  ];

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div><h2 className='text-2xl font-bold text-white'>Thống kê & Báo cáo</h2><p className='text-gray-400 mt-1'>Phân tích dữ liệu</p></div>
        <div className='flex gap-3'><button className='flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl'><Calendar className='w-4 h-4'/>Chọn ngày</button><button className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl'><Download className='w-4 h-4'/>Export PDF</button></div>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {stats.map((stat, i) => (<motion.div key={stat.title} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}} className='bg-gray-900/50 border border-gray-800 rounded-2xl p-6'><div className='flex items-center justify-between mb-4'><div className={'p-3 rounded-xl '+(stat.color==='blue'?'bg-blue-500/10':stat.color==='green'?'bg-green-500/10':stat.color==='purple'?'bg-purple-500/10':'bg-yellow-500/10')}><stat.icon className={'w-6 h-6 '+(stat.color==='blue'?'text-blue-400':stat.color==='green'?'text-green-400':stat.color==='purple'?'text-purple-400':'text-yellow-400')}/></div><div className={'flex items-center gap-1 text-sm '+(stat.trend.isPositive?'text-green-400':'text-red-400')}>{stat.trend.isPositive?<ArrowUpRight className='w-4 h-4'/>:<ArrowDownRight className='w-4 h-4'/>}{stat.trend.value}%</div></div><p className='text-2xl font-bold text-white'>{stat.value}</p><p className='text-sm text-gray-400'>{stat.title}</p></motion.div>))}
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}} className='bg-gray-900/50 border border-gray-800 rounded-2xl p-6'><h3 className='text-lg font-semibold text-white mb-4'>Báo cáo theo tháng</h3><div className='space-y-4'>{monthlyData.map((d,i)=>(<div key={d.month}><div className='flex items-center justify-between mb-2'><span className='text-sm text-gray-400'>{d.month}</span><span className='text-sm text-white'>{d.reports} báo cáo</span></div><div className='h-3 bg-gray-800 rounded-full overflow-hidden'><motion.div initial={{width:0}} animate={{width:(d.reports/2500*100)+'%'}} transition={{delay:0.5+i*0.1}} className='h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full'/></div></div>))}</div></motion.div>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}} className='bg-gray-900/50 border border-gray-800 rounded-2xl p-6'><h3 className='text-lg font-semibold text-white mb-4'>Top người báo cáo</h3><div className='space-y-4'>{topReporters.map((r,i)=>(<div key={r.name} className='flex items-center justify-between p-3 bg-gray-800/50 rounded-xl'><div className='flex items-center gap-3'><span className='w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white'>{i+1}</span><span className='text-white'>{r.name}</span></div><div className='text-right'><p className='text-white font-medium'>{r.reports}</p><p className='text-xs text-green-400'>{r.verified} đã xác minh</p></div></div>))}</div></motion.div>
      </div>
    </div>
  );
}
