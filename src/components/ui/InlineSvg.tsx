"use client";

import React, { useEffect, useState } from 'react';

interface InlineSvgProps extends React.HTMLAttributes<HTMLSpanElement> {
  src: string;
  ariaLabel?: string;
}

export default function InlineSvg({ src, className = '', ariaLabel, ...rest }: InlineSvgProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('Failed to fetch SVG');
        let text = await res.text();

        // Remove width/height attributes so SVG scales with CSS
        text = text.replace(/\s(width|height)="[^"]*"/gi, '');

        // Normalize hard-coded fill/stroke colors to `currentColor` when they're not 'none'
        // This preserves stroke-only icons (they need a stroke value) while allowing
        // the icon to inherit the surrounding text color.
        text = text.replace(/\sfill="(?!none)[^"]*"/gi, ' fill="currentColor"');
        text = text.replace(/\sstroke="(?!none)[^"]*"/gi, ' stroke="currentColor"');

        if (!cancelled) setSvg(text);
      } catch (e) {
        if (!cancelled) setSvg(null);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!svg) {
    return (
      <span role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel} className={className} {...rest}>
        {/* empty placeholder while loading or on error */}
      </span>
    );
  }

  return (
    <span
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...rest}
    />
  );
}
