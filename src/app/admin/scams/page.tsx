'use client';

import React from 'react';
import { Phone, Globe, Mail, Shield, AlertTriangle, Database, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const scamCategories = [
  {
    id: 'phones',
    title: 'Số điện thoại lừa đảo',
    description: 'Quản lý cơ sở dữ liệu số điện thoại lừa đảo',
    icon: Phone,
    count: 156,
    color: 'bg-blue-500',
    href: '/admin/scams/phones'
  },
  {
    id: 'websites',
    title: 'Website lừa đảo',
    description: 'Quản lý cơ sở dữ liệu website lừa đảo',
    icon: Globe,
    count: 89,
    color: 'bg-green-500',
    href: '/admin/scams/websites'
  },
  {
    id: 'emails',
    title: 'Email lừa đảo',
    description: 'Quản lý cơ sở dữ liệu email lừa đảo',
    icon: Mail,
    count: 234,
    color: 'bg-purple-500',
    href: '/admin/scams/emails'
  }
];

const stats = [
  { label: 'Tổng số', value: 479, icon: Database, color: 'text-blue-600' },
  { label: 'Đã xác minh', value: 312, icon: Shield, color: 'text-green-600' },
  { label: 'Chờ duyệt', value: 42, icon: AlertTriangle, color: 'text-yellow-600' },
];

export default function ScamsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý lừa đảo</h1>
              <p className="text-gray-500 mt-1">Quản lý cơ sở dữ liệu các đối tượng lừa đảo</p>
            </div>
            <div className="flex items-center gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="text-center px-4 py-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                    </div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scamCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                href={category.href}
                className="group block bg-white rounded-xl shadow-sm border hover:shadow-md hover:border-blue-300 transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${category.color} bg-opacity-10`}>
                      <Icon className={`w-6 h-6 ${category.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{category.count}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{category.description}</p>
                  <div className="flex items-center text-sm text-blue-600 font-medium">
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h2>
          <div className="space-y-3">
            {[
              { action: 'Thêm mới', target: 'SĐT 0909123456', type: 'phone', time: '5 phút trước', user: 'Admin' },
              { action: 'Cập nhật', target: 'Website scam-site.com', type: 'website', time: '15 phút trước', user: 'Admin' },
              { action: 'Xác minh', target: 'Email fake@bank.com', type: 'email', time: '30 phút trước', user: 'Admin' },
              { action: 'Thêm mới', target: 'SĐT 0987654321', type: 'phone', time: '1 giờ trước', user: 'Admin' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    item.action === 'Thêm mới' ? 'bg-green-100 text-green-800' :
                    item.action === 'Cập nhật' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {item.action}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{item.target}</span>
                  <span className="text-xs text-gray-400 capitalize">({item.type})</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{item.time}</p>
                  <p className="text-xs text-gray-400">bởi {item.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
