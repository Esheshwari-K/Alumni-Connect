import React from 'react';
import { RVULogo } from './RVULogo.tsx';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <RVULogo variant="footer" showWordmark={true} />
            <div className="hidden sm:block text-slate-300">|</div>
            <p className="text-xs text-[#718096]">
              RV Vidyaniketan, 8th Mile, Mysuru Road, Bengaluru, Karnataka 560059
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#718096]">
            <span>RV University Alumni Relations</span>
            <span>·</span>
            <span>Mentorship Platform</span>
            <span>·</span>
            <span className="tabular-nums">Academic Project FSD 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
