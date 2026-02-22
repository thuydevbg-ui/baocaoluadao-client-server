'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  FolderTree,
  X,
  Check,
  AlertCircle,
  MessageSquare,
  Globe,
  Phone,
  Mail,
  Facebook,
  MessageCircle
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  reportCount: number;
  color: string;
  isActive: boolean;
}

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Website lừa đảo',
    icon: 'Globe',
    description: 'Các website giả mạo, lừa đảo mua sắm, đầu tư',
    reportCount: 3456,
    color: '#EF4444',
    isActive: true
  },
  {
    id: 'cat-2',
    name: 'SMS lừa đảo',
    icon: 'MessageSquare',
    description: 'Tin nhắn SMS lừa đảo, giả mạo bưu điện, ngân hàng',
    reportCount: 2876,
    color: '#F59E0B',
    isActive: true
  },
  {
    id: 'cat-3',
    name: 'Cuộc gọi lừa đảo',
    icon: 'Phone',
    description: 'Cuộc gọi từ số máy lạ, giả mạo công an, ngân hàng',
    reportCount: 1543,
    color: '#8B5CF6',
    isActive: true
  },
  {
    id: 'cat-4',
    name: 'Email lừa đảo',
    icon: 'Mail',
    description: 'Email giả mạo, lừa đảo tài chính, phishing',
    reportCount: 1234,
    color: '#06B6D4',
    isActive: true
  },
  {
    id: 'cat-5',
    name: 'Mạng xã hội',
    icon: 'Facebook',
    description: 'Tài khoản mạng xã hội giả mạo, lừa đảo',
    reportCount: 738,
    color: '#3B82F6',
    isActive: true
  },
  {
    id: 'cat-6',
    name: 'Ứng dụng lừa đảo',
    icon: 'MessageCircle',
    description: 'Ứng dụng di động giả mạo, chứa mã độc',
    reportCount: 412,
    color: '#10B981',
    isActive: true
  }
];

const iconMap: Record<string, React.ComponentType<any>> = {
  Globe,
  MessageSquare,
  Phone,
  Mail,
  Facebook,
  MessageCircle
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Globe',
    description: '',
    color: '#3B82F6'
  });

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        icon: category.icon,
        description: category.description,
        color: category.color
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        icon: 'Globe',
        description: '',
        color: '#3B82F6'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id
            ? { ...cat, ...formData }
            : cat
        )
      );
    } else {
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        ...formData,
        reportCount: 0,
        isActive: true
      };
      setCategories((prev) => [...prev, newCategory]);
    }
    
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    setDeleteConfirm(null);
  };

  const handleToggleActive = (id: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
      )
    );
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <FolderTree className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Quản lý danh mục</h2>
          <p className="text-gray-400 mt-1">Quản lý các loại lừa đảo</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </button>
      </div>

      {/* Categories Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-gray-900/50 border rounded-2xl p-5 transition-all hover:border-gray-700 ${
              category.isActive ? 'border-gray-800' : 'border-gray-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <div style={{ color: category.color }}>
                    {getIconComponent(category.icon)}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.reportCount.toLocaleString()} báo cáo</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteConfirm(category.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-400 mb-4">{category.description}</p>

            <div className="flex items-center justify-between">
              <button
                onClick={() => handleToggleActive(category.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  category.isActive
                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                }`}
              >
                {category.isActive ? (
                  <>
                    <Check className="w-4 h-4" />
                    Hoạt động
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Tắt
                  </>
                )}
              </button>

              <div className="flex items-center gap-1 text-gray-500 cursor-grab">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h3 className="text-xl font-semibold text-white">
                  {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tên danh mục
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên danh mục..."
                    required
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Icon
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {Object.keys(iconMap).map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                        className={`p-3 rounded-xl border transition-all ${
                          formData.icon === iconName
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-gray-400">
                          {getIconComponent(iconName)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Màu sắc
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-gray-700 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả danh mục..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
                  >
                    {editingCategory ? 'Lưu thay đổi' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Xóa danh mục</h3>
                  <p className="text-sm text-gray-400">Hành động này không thể hoàn tác</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Bạn có chắc chắn muốn xóa danh mục này không? Tất cả báo cáo thuộc danh mục này sẽ không bị xóa.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors"
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}