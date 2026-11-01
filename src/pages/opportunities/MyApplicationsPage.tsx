import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { Briefcase, Building, MapPin, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface MyApplicationsPageProps {
  onNavigate: (tab: string) => void;
}

export function MyApplicationsPage({ onNavigate }: MyApplicationsPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMyApplications();
  }, []);

  const loadMyApplications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyApplications();
      setApplications(res.applications || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load applications', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'under_review':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'shortlisted':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'selected':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
            <span>Student Career Tracking</span>
            <span>·</span>
            <span>RV University</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
            My Submitted Applications
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            Track real-time progress on internship and career applications reviewed by RVU alumni.
          </p>
        </div>

        <button
          onClick={() => onNavigate('opportunities')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          Browse More Opportunities
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-28" />
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#172338]">{app.opportunity_title}</h3>
                  <p className="text-xs text-[#718096] mt-0.5">
                    {app.opportunity_company} · {app.opportunity_location}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    Submitted {new Date(app.created_at).toLocaleDateString()}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border capitalize ${getStatusBadge(app.status)}`}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {app.cover_letter && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  <strong>Your Cover Note:</strong> "{app.cover_letter}"
                </p>
              )}

              {app.resume_url && (
                <div className="text-xs">
                  <a
                    href={app.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#D6AA61] font-semibold hover:underline"
                  >
                    <FileText className="w-3.5 h-3.5" /> Attached Resume
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172338]">No applications submitted</h3>
          <p className="text-xs text-[#718096] mt-1">
            Browse through the opportunities board to apply for summer internships and referrals.
          </p>
        </div>
      )}
    </div>
  );
}
