import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Calendar,
  Send,
  X,
  Check
} from 'lucide-react';

interface MentorshipPageProps {
  onNavigate: (tab: string) => void;
  onStartMessageWith?: (userId: string) => void;
}

export function MentorshipPage({ onNavigate, onStartMessageWith }: MentorshipPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMentorshipRequests();
      setRequests(res.requests || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load requests', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    try {
      await api.updateMentorshipRequestStatus(id, status);
      showToast(`Mentorship request marked as ${status}`, 'success');
      loadRequests();
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const isStudent = user?.role === 'student';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
            <span>RV University Mentorship</span>
            <span>·</span>
            <span>{isStudent ? 'Your Mentorship Connections' : 'Student Guidance Requests'}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
            {isStudent ? 'My Mentorship Requests' : 'Mentorship Request Queue'}
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            {isStudent
              ? 'Track applications for alumni mentorship and access confirmed mentors.'
              : 'Review and manage 1-on-1 guidance inquiries from RV University students.'}
          </p>
        </div>

        {isStudent && (
          <button
            onClick={() => onNavigate('alumni')}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto"
          >
            <Send className="w-4 h-4" /> Discover New Mentors
          </button>
        )}
      </div>

      {/* Segmented Filter */}
      <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl w-fit text-xs font-semibold">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'all' ? 'bg-slate-100 text-[#172338]' : 'text-[#718096] hover:text-[#172338]'
          }`}
        >
          All Requests ({requests.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'pending' ? 'bg-slate-100 text-[#172338]' : 'text-[#718096] hover:text-[#172338]'
          }`}
        >
          Pending ({requests.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('accepted')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'accepted' ? 'bg-slate-100 text-[#172338]' : 'text-[#718096] hover:text-[#172338]'
          }`}
        >
          Accepted & Active ({requests.filter((r) => r.status === 'accepted').length})
        </button>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32" />
          ))}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const partnerName = isStudent ? req.alumni_name : req.student_name;
            const partnerSub = isStudent
              ? `${req.alumni_job_title || 'Alumni'} at ${req.alumni_company || 'RVU'}`
              : `${req.student_programme || 'Student'} · ${req.student_department || 'RV University'}`;

            const topicsList = req.topics
              ? (typeof req.topics === 'string' && req.topics.startsWith('[')
                  ? JSON.parse(req.topics)
                  : req.topics.split(','))
              : [];

            return (
              <div
                key={req.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-[#172338]">
                      {partnerName?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#172338]">{partnerName}</h3>
                      <p className="text-xs text-[#718096]">{partnerSub}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md capitalize ${
                      req.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : req.status === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : req.status === 'cancelled'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    "{req.message}"
                  </p>

                  {topicsList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#718096]">
                      <span className="font-semibold text-[#172338]">Focus Topics:</span>
                      {topicsList.map((topic: string, idx: number) => (
                        <React.Fragment key={topic}>
                          {idx > 0 && <span>·</span>}
                          <span>{topic.trim()}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    ID: <span className="font-mono text-[10px]">{req.id.substring(0, 8)}...</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Alumni actions */}
                    {!isStudent && req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(req.id, 'rejected')}
                          className="px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(req.id, 'accepted')}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Request
                        </button>
                      </>
                    )}

                    {/* Student cancel pending */}
                    {isStudent && req.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'cancelled')}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                      >
                        Cancel Request
                      </button>
                    )}

                    {/* Connected actions */}
                    {req.status === 'accepted' && (
                      <>
                        {onStartMessageWith && (
                          <button
                            onClick={() => onStartMessageWith(isStudent ? req.alumni_id : req.student_id)}
                            className="px-3.5 py-1.5 text-xs font-semibold text-[#172338] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#D6AA61]" /> Open Conversation
                          </button>
                        )}
                        {isStudent && (
                          <button
                            onClick={() => onNavigate('sessions')}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <Calendar className="w-3.5 h-3.5" /> Book Session Slot
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172338]">No requests found</h3>
          <p className="text-xs text-[#718096] mt-1">
            {isStudent
              ? 'You have not submitted any mentorship requests yet.'
              : 'You have no student mentorship requests in this view.'}
          </p>
          {isStudent && (
            <button
              onClick={() => onNavigate('alumni')}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg shadow-2xs"
            >
              Explore Alumni Directory
            </button>
          )}
        </div>
      )}
    </div>
  );
}
