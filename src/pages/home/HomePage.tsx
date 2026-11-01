import React from 'react';
import { RVULogo } from '../../components/common/RVULogo.tsx';
import {
  Users,
  Calendar,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Sparkles,
  BookOpen,
  Award
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: string) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 lg:p-16 shadow-xs relative overflow-hidden">
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider">
              <span>RV University Bengaluru</span>
              <span>·</span>
              <span>Alumni Mentorship & Networking Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#172338] tracking-tight leading-tight">
              Connect with RV University Alumni Shaping Global Tech & Industry
            </h1>

            <p className="text-base sm:text-lg text-[#718096] leading-relaxed">
              Alumni Connect bridges current RVU students with experienced graduates for 1-on-1 career mentorship, mock technical interviews, exclusive internship referrals, and direct guidance.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('alumni')}
                className="px-6 py-3 text-sm font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                Explore Alumni Directory <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-3 text-sm font-semibold text-[#172338] bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Sign In to Platform
              </button>
            </div>

            {/* Trust markers */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-[#718096]">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> University Verified Alumni
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-[#D6AA61]" /> 1-on-1 Session Booking
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Briefcase className="w-4 h-4 text-blue-600" /> Internal Career Referrals
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-[#172338] tracking-tight">
            Designed Exclusively for the RV University Community
          </h2>
          <p className="text-xs sm:text-sm text-[#718096] mt-2">
            A purposeful ecosystem fostering meaningful guidance from graduation to leadership.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D6AA61] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172338]">1-on-1 Mentorship</h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              Request guidance across career planning, resume reviews, competitive programming, and graduate admissions from seniors who walked the same campus corridors.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172338]">Session Scheduling</h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              Book dedicated calendar slots without double-booking friction. Seamlessly access Google Meet or video conferencing links directly from your dashboard.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172338]">Opportunities & Referrals</h3>
            <p className="text-xs sm:text-sm text-[#718096] leading-relaxed">
              Discover summer internships, research openings, and direct team referrals posted by alumni at Google, Microsoft, Cisco, and innovative startups.
            </p>
          </div>
        </div>
      </section>

      {/* Academic Project Credit Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <RVULogo variant="footer" showWordmark={true} />
            <div className="text-xs text-[#718096]">
              <p className="font-bold text-[#172338]">Full Stack Development Academic Project</p>
              <p>School of Computer Science & Engineering · RV University, Bengaluru</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('register-student')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs"
            >
              Register as Student
            </button>
            <button
              onClick={() => onNavigate('register-alumni')}
              className="px-4 py-2 text-xs font-semibold text-[#172338] bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Join as Alumni Mentor
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
