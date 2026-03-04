'use client';

import React from 'react';

interface GooglePreviewProps {
  title: string;
  description: string;
  url: string;
}

export function GooglePreview({ title, description, url }: GooglePreviewProps) {
  const displayUrl = url.startsWith('http') ? url : `https://baocaoluadao.com${url}`;
  const truncatedUrl = displayUrl.replace(/^https?:\/\//, '');

  return (
    <div className="bg-white rounded-lg p-4 max-w-[600px]">
      <div className="font-arial text-sm">
        {/* URL */}
        <div className="flex items-center gap-2 text-[#202124] mb-1">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs">
            🔍
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] leading-5 truncate">
              {truncatedUrl.split('/')[0]}
            </span>
            <span className="text-[12px] text-[#5f6368] truncate">
              {'>'} {truncatedUrl}
            </span>
          </div>
          <span className="ml-auto text-[#70757a]">⋮</span>
        </div>
        
        {/* Title */}
        <h3 
          className="text-[#1a0dab] text-[20px] leading-[1.3] font-normal hover:underline cursor-pointer truncate"
          style={{ color: '#8ab4f8' }}
        >
          {title || 'Tiêu đề trang'}
        </h3>
        
        {/* Description */}
        <p className="text-[#bdc1c6] text-[14px] leading-[1.58] mt-1 line-clamp-2">
          {description || 'Mô tả trang sẽ hiển thị ở đây...'}
        </p>
      </div>
      
      {/* Character counts */}
      <div className="mt-3 pt-3 border-t border-gray-700 flex gap-4 text-xs">
        <span className={title.length > 60 ? 'text-red-400' : 'text-green-400'}>
          Tiêu đề: {title.length}/60
        </span>
        <span className={description.length > 160 ? 'text-red-400' : 'text-green-400'}>
          Mô tả: {description.length}/160
        </span>
      </div>
    </div>
  );
}

export default GooglePreview;