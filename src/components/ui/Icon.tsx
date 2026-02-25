"use client";

import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLElement> {
  /** Provide a font/icon CSS class when using an icon font (e.g. 'uicon uicon-search') */
  iconClass?: string;
  /** fallback: provide explicit size (px or rem) */
  size?: number | string;
  /** optional semantic name for accessibility */
  ariaLabel?: string;
}

export default function Icon({ iconClass = '', size = '1rem', ariaLabel, className = '', ...rest }: IconProps) {
  const style = { fontSize: typeof size === 'number' ? `${size}px` : size } as React.CSSProperties;

  // Renders an <i> element so icon-fonts/CSS icons can be applied via `iconClass`.
  // If you prefer inline SVGs for specific icons we can extend this component.
  return (
    <i
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      className={`${iconClass} ${className}`.trim()}
      style={style}
      {...rest}
    />
  );
}
