import React, { useState } from 'react';

interface ChurchLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'transparent';
}

export const ChurchLogo: React.FC<ChurchLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'transparent',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (imgError) {
    // Elegant SVG Fallback matching the official emblem
    return (
      <div
        className={`${currentSizeClass} ${className} relative rounded-full flex items-center justify-center bg-white shadow-xs overflow-hidden border border-[#C99B2E]/40`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Globe */}
          <circle cx="50" cy="55" r="35" fill="#6E1325" />
          <path
            d="M30 45 C35 38, 50 38, 55 45 C60 52, 45 65, 38 65 Z"
            fill="#8C182F"
            opacity="0.8"
          />
          {/* Dove */}
          <path
            d="M50 15 Q65 25 75 20 Q60 35 50 32 Q40 35 25 20 Q35 25 50 15 Z"
            fill="#FFFFFF"
          />
          <circle cx="50" cy="22" r="3" fill="#FFFFFF" />
          {/* Open Bible */}
          <path d="M38 70 L50 67 L62 70 L62 76 L50 73 L38 76 Z" fill="#F8FAFC" stroke="#C99B2E" strokeWidth="1" />
          {/* Border circle */}
          <circle cx="50" cy="55" r="42" fill="none" stroke="#C99B2E" strokeWidth="2.5" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${currentSizeClass} ${className} relative rounded-full flex items-center justify-center overflow-hidden bg-white/95 shadow-xs border border-[#C99B2E]/40 flex-shrink-0`}
    >
      <img
        src="/logo.png"
        alt="Logo Église Missionnaire de la Foi (E.M.F)"
        onError={() => setImgError(true)}
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
};
