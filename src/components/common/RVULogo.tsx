import React from 'react';

interface RVULogoProps {
  variant?: 'header' | 'auth' | 'footer' | 'compact';
  showWordmark?: boolean;
  className?: string;
  onClick?: () => void;
}

export function RVULogo({
  variant = 'header',
  showWordmark = true,
  className = '',
  onClick
}: RVULogoProps) {
  // Height and layout configurations based on variant
  const imageSizes = {
    compact: 'h-8 max-w-[130px]',
    header: 'h-10 md:h-11 max-w-[170px]',
    auth: 'h-16 md:h-20 max-w-[260px]',
    footer: 'h-9 max-w-[150px]'
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src="/assets/aistudio/image_2a9aa807.png"
        alt="RV University Logo"
        referrerPolicy="no-referrer"
        className={`${imageSizes[variant]} w-auto object-contain shrink-0`}
      />

      {showWordmark && (
        <div className="flex flex-col border-l border-slate-300 pl-3 leading-tight">
          <span className="text-sm md:text-base font-bold text-[#172338] tracking-tight">
            Alumni Connect
          </span>
          <span className="text-[10px] md:text-[11px] font-medium text-[#718096] uppercase tracking-wider">
            Mentorship & Network
          </span>
        </div>
      )}
    </div>
  );
}
