import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import {
  Users,
  Calendar,
  Briefcase,
  ArrowRight,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface StudentDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenAlumniDetails: (alumniId: string) => void;
}

export function StudentDashboard({ onNavigate, onOpenAlumniDetails }: StudentDashboardProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [recommendedAlumni, setRecommendedAlumni] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [recentOpportunities, setRecentOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profRes, almRes, reqRes, bookRes, oppRes] = await Promise.all([
        api.getStudentProfile().catch(() => ({ profile: null })),
        api.getAlumniDirectory().catch(() => ({ alumni: [] })),
        api.getMentorshipRequests().catch(() => ({ requests: [] })),
        api.getBookings().catch(() => ({ bookings: [] })),
        api.getOpportunities().catch(() => ({ opportunities: [] }))
      ]);

      setProfile(profRes.profile || null);
      setRecommendedAlumni((almRes.alumni || []).slice(0, 3));
      setPendingRequests((reqRes.requests || []).filter((r: any) => r.status === 'pending'));
      setUpcomingBookings((bookRes.bookings || []).filter((b: any) => b.status === 'confirmed').slice(0, 3));
      setRecentOpportunities((oppRes.opportunities || []).slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate profile completion percentage
  const calculateCompletion = () => {
    if (!profile) return 30;
    let score = 20; // user account created
    if (profile.usn) score += 20;
    if (profile.department) score += 15;
    if (profile.programme) score += 15;
    if (profile.skills) score += 15;
    if (profile.bio) score += 15;
    return score;
  };

  const completionPercent = calculateCompletion();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Greeting */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
            <span>Student Dashboard</span>
            <span>·</span>
            <span>RV University</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            Explore industry mentors, schedule 1-on-1 guidance sessions, and apply for verified internships.
          </p>
        </div>

        {/* Profile Completion Strip */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[240px]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#172338] mb-1.5">
            <span>Profile Completion</span>
            <span className="tabular-nums text-[#D6AA61]">{completionPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#D6AA61] h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {completionPercent < 100 && (
            <button
              onClick={() => onNavigate('profile')}
              className="text-[11px] font-semibold text-[#D6AA61] hover:text-[#C19349] mt-2 inline-flex items-center gap-1"
            >
              Complete your profile <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigate('alumni')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#D6AA61]/50 cursor-pointer transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#D6AA61] flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#172338] group-hover:text-[#D6AA61] transition-colors">
            Discover Mentors
          </h3>
          <p className="text-xs text-[#718096] mt-1 leading-relaxed">
            Search verified RVU alumni across Google, Microsoft, Cisco, and high-growth startups.
          </p>
        </div>

        <div
          onClick={() => onNavigate('sessions')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#D6AA61]/50 cursor-pointer transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#172338] group-hover:text-[#D6AA61] transition-colors">
            Book 1-on-1 Session
          </h3>
          <p className="text-xs text-[#718096] mt-1 leading-relaxed">
            Choose an available time slot for resume critiques, interview prep, or tech guidance.
          </p>
        </div>

        <div
          onClick={() => onNavigate('opportunities')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-[#D6AA61]/50 cursor-pointer transition-all shadow-xs group"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#172338] group-hover:text-[#D6AA61] transition-colors">
            Browse Opportunities
          </h3>
          <p className="text-xs text-[#718096] mt-1 leading-relaxed">
            Apply internally for internships and alumni referrals posted exclusively for RVU students.
          </p>
        </div>
      </div>

      {/* Main Grid: Recommended Mentors + Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Recommended Alumni */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#172338]">Recommended Alumni Mentors</h2>
              <p className="text-xs text-[#718096]">Matched from RV University computer science & tech departments</p>
            </div>
            <button
              onClick={() => onNavigate('alumni')}
              className="text-xs font-semibold text-[#D6AA61] hover:text-[#C19349] flex items-center gap-1"
            >
              View directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recommendedAlumni.map((alumni) => {
              const skillsList = alumni.skills
                ? (typeof alumni.skills === 'string' && alumni.skills.startsWith('[')
                    ? JSON.parse(alumni.skills)
                    : alumni.skills.split(','))
                : [];

              return (
                <div
                  key={alumni.id}
                  onClick={() => onOpenAlumniDetails(alumni.user_id)}
                  className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-[#172338] shrink-0">
                        {alumni.full_name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#172338]">{alumni.full_name}</h4>
                          {alumni.verification_status === 'verified' && (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#718096] mt-0.5">
                          {alumni.job_title} at <span className="font-semibold text-[#172338]">{alumni.company}</span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {alumni.bio || 'RV University Graduate eager to support student career growth.'}
                        </p>

                        {/* Unboxed skill tags */}
                        {skillsList.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-[#718096]">
                            {skillsList.slice(0, 4).map((skill: string, idx: number) => (
                              <React.Fragment key={skill}>
                                {idx > 0 && <span>·</span>}
                                <span className="text-slate-700">{skill.trim()}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-xs font-medium text-[#D6AA61] shrink-0">
                      View Profile
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Opportunities */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#172338]">Recent Opportunities</h2>
                <p className="text-xs text-[#718096]">Internships and referrals posted by alumni</p>
              </div>
              <button
                onClick={() => onNavigate('opportunities')}
                className="text-xs font-semibold text-[#D6AA61] hover:text-[#C19349] flex items-center gap-1"
              >
                All Opportunities <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => onNavigate('opportunities')}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs text-[#718096] mb-1">
                    <span className="font-semibold text-[#172338]">{opp.company}</span>
                    <span className="capitalize text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {opp.opportunity_type}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#172338] line-clamp-1">{opp.title}</h4>
                  <p className="text-xs text-[#718096] mt-1 line-clamp-2">{opp.description}</p>
                  <p className="text-[11px] text-slate-400 mt-2">{opp.location}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Upcoming Sessions & Mentorship Status */}
        <div className="space-y-6">
          {/* Upcoming Bookings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#172338]">Upcoming Sessions</h3>
              <button
                onClick={() => onNavigate('sessions')}
                className="text-xs text-[#D6AA61] hover:text-[#C19349] font-semibold"
              >
                Schedule
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <p className="font-bold text-[#172338]">{booking.session_title || '1-on-1 Mentoring'}</p>
                    <p className="text-[#718096]">With {booking.alumni_name} ({booking.alumni_company})</p>
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(booking.scheduled_at).toLocaleDateString()} at {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {booking.meeting_link && (
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D6AA61] hover:underline mt-1"
                      >
                        Join Meeting Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No upcoming booked sessions.</p>
                  <button
                    onClick={() => onNavigate('sessions')}
                    className="mt-2 text-[#D6AA61] hover:text-[#C19349] font-semibold text-xs"
                  >
                    Browse available slots
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mentorship Requests Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#172338]">Mentorship Requests</h3>
              <button
                onClick={() => onNavigate('mentorship')}
                className="text-xs text-[#D6AA61] hover:text-[#C19349] font-semibold"
              >
                View all
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <div key={req.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs">
                    <p className="font-semibold text-amber-950">To {req.alumni_name || 'Alumni Mentor'}</p>
                    <p className="text-amber-800 line-clamp-1 mt-0.5">"{req.message}"</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase text-amber-700">
                      Pending Mentor Review
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs text-slate-400">
                  No active pending requests. Discover an alumni mentor to connect!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
