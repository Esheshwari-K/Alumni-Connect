import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import {
  Users,
  Calendar,
  Briefcase,
  Plus,
  Clock,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  MessageSquare
} from 'lucide-react';

interface AlumniDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenCreateSession: () => void;
  onOpenCreateOpportunity: () => void;
}

export function AlumniDashboard({
  onNavigate,
  onOpenCreateSession,
  onOpenCreateOpportunity
}: AlumniDashboardProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [myOpportunities, setMyOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlumniData();
  }, []);

  const loadAlumniData = async () => {
    setIsLoading(true);
    try {
      const [profRes, reqRes, sessRes, bookRes, oppRes] = await Promise.all([
        api.getAlumniProfile().catch(() => ({ profile: null })),
        api.getMentorshipRequests().catch(() => ({ requests: [] })),
        api.getSessions(user?.id).catch(() => ({ sessions: [] })),
        api.getBookings().catch(() => ({ bookings: [] })),
        api.getOpportunities().catch(() => ({ opportunities: [] }))
      ]);

      setProfile(profRes.profile || null);
      setRequests(reqRes.requests || []);
      setSessions(sessRes.sessions || []);
      setBookings((bookRes.bookings || []).filter((b: any) => b.status === 'confirmed'));
      setMyOpportunities((oppRes.opportunities || []).filter((o: any) => o.posted_by === user?.id));
    } catch (err) {
      console.error('Failed to load alumni dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await api.updateMentorshipRequestStatus(requestId, status);
      showToast(`Mentorship request ${status}`, 'success');
      loadAlumniData();
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Verification status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
            <span>Alumni Mentor Dashboard</span>
            <span>·</span>
            <span>RV University</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
            Welcome, {user?.full_name?.split(' ')[0] || 'Mentor'}
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            {profile?.headline || 'RV University Alumni Mentor'}
          </p>

          <div className="flex items-center gap-2 mt-3">
            {profile?.verification_status === 'verified' ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verified RVU Alumni
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                Pending University Verification
              </span>
            )}
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Batch of {profile?.graduation_year || 2022}</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
          <button
            onClick={onOpenCreateSession}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Mentorship Slot
          </button>
          <button
            onClick={onOpenCreateOpportunity}
            className="px-4 py-2 text-xs font-semibold text-[#172338] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Post Opportunity
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-[#718096]">Pending Requests</p>
          <p className="text-2xl font-bold text-[#172338] mt-1 tabular-nums">{pendingRequests.length}</p>
          <span className="text-[11px] text-[#D6AA61] font-medium mt-1 block">Students awaiting guidance</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-[#718096]">Scheduled Bookings</p>
          <p className="text-2xl font-bold text-[#172338] mt-1 tabular-nums">{bookings.length}</p>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Confirmed sessions</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-[#718096]">Active Slots</p>
          <p className="text-2xl font-bold text-[#172338] mt-1 tabular-nums">
            {sessions.filter((s) => s.status === 'available').length}
          </p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Open for booking</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-medium text-[#718096]">Published Opportunities</p>
          <p className="text-2xl font-bold text-[#172338] mt-1 tabular-nums">{myOpportunities.length}</p>
          <span className="text-[11px] text-blue-600 font-medium mt-1 block">Internships & referrals</span>
        </div>
      </div>

      {/* Grid: Pending Mentorship Requests & Confirmed Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Pending Requests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-[#172338]">Mentorship Requests</h2>
                <p className="text-xs text-[#718096]">Review requests submitted by RV University students</p>
              </div>
              <button
                onClick={() => onNavigate('mentorship')}
                className="text-xs font-semibold text-[#D6AA61] hover:text-[#C19349]"
              >
                View History
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {pendingRequests.length > 0 ? (
                pendingRequests.map((req) => (
                  <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#172338]">{req.student_name}</h4>
                        <p className="text-xs text-[#718096]">
                          {req.student_programme || 'Student'} · {req.student_department || 'RV University'}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                      "{req.message}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleRequestAction(req.id, 'rejected')}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, 'accepted')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept & Connect
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  <p>You have no pending mentorship requests at the moment.</p>
                </div>
              )}
            </div>
          </div>

          {/* Published Opportunities */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-[#172338]">Your Posted Opportunities</h2>
                <p className="text-xs text-[#718096]">Internships, jobs, and referrals you published</p>
              </div>
              <button
                onClick={onOpenCreateOpportunity}
                className="text-xs font-semibold text-[#D6AA61] hover:text-[#C19349] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Post New
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {myOpportunities.length > 0 ? (
                myOpportunities.map((opp) => (
                  <div key={opp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#172338]">{opp.title}</h4>
                      <p className="text-xs text-[#718096] capitalize">{opp.opportunity_type} · {opp.company} · {opp.location}</p>
                    </div>
                    <button
                      onClick={() => onNavigate('opportunities')}
                      className="text-xs text-[#D6AA61] hover:underline font-semibold shrink-0"
                    >
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-slate-400">
                  No opportunities posted yet. Share an internship opening or referral to help juniors!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Confirmed Bookings */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-[#172338]">Upcoming Mentoring Sessions</h3>
              <button
                onClick={onOpenCreateSession}
                className="text-xs text-[#D6AA61] hover:text-[#C19349] font-semibold"
              >
                + New Slot
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <div key={booking.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <p className="font-bold text-[#172338]">{booking.session_title || 'Mentoring Session'}</p>
                    <p className="text-[#718096]">Student: <span className="font-semibold text-slate-800">{booking.student_name}</span></p>
                    <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(booking.scheduled_at).toLocaleDateString()} at {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {booking.meeting_link && (
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D6AA61] hover:underline"
                      >
                        Join Meeting Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>No confirmed bookings yet.</p>
                  <p className="text-[11px] mt-1">Make sure you have available slots published.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
