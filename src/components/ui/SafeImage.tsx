'use client';

import React, { useEffect, useState } from 'react';

interface SafeImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export default function SafeImage({ src, fallbackSrc, alt, className }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setUsedFallback(false);
  }, [src]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (!usedFallback) {
          setCurrentSrc(fallbackSrc);
          setUsedFallback(true);
        }
      }}
    />
  );
}

