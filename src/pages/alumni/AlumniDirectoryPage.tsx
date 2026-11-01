import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Search,
  Filter,
  ShieldCheck,
  Building2,
  GraduationCap,
  Sparkles,
  Send,
  Calendar,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface AlumniDirectoryPageProps {
  onNavigate: (tab: string) => void;
  selectedAlumniId?: string | null;
  onClearSelectedAlumni?: () => void;
  onStartMessageWith?: (userId: string) => void;
}

export function AlumniDirectoryPage({
  onNavigate,
  selectedAlumniId,
  onClearSelectedAlumni,
  onStartMessageWith
}: AlumniDirectoryPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Selected profile for modal
  const [activeProfile, setActiveProfile] = useState<any>(null);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestTopics, setRequestTopics] = useState('Career Guidance, System Design');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    fetchAlumni();
  }, [searchTerm, selectedDept, selectedCompany, selectedYear]);

  useEffect(() => {
    if (selectedAlumniId) {
      loadProfileDetails(selectedAlumniId);
    }
  }, [selectedAlumniId]);

  const fetchAlumni = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAlumniDirectory({
        search: searchTerm || undefined,
        department: selectedDept || undefined,
        company: selectedCompany || undefined,
        graduation_year: selectedYear ? parseInt(selectedYear, 10) : undefined
      });
      setAlumniList(res.alumni || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load alumni directory', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfileDetails = async (id: string) => {
    try {
      const res = await api.getAlumniDetails(id);
      setActiveProfile(res.profile);
      setAvailableSessions(res.available_sessions || []);
    } catch (err: any) {
      showToast('Could not fetch alumni details', 'error');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDept('');
    setSelectedCompany('');
    setSelectedYear('');
  };

  const handleSendMentorshipRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !requestMessage.trim()) return;

    setIsSubmittingRequest(true);
    try {
      await api.createMentorshipRequest({
        alumni_id: activeProfile.user_id,
        message: requestMessage.trim(),
        topics: requestTopics.split(',').map((t) => t.trim())
      });
      showToast(`Mentorship request sent to ${activeProfile.full_name}!`, 'success');
      setIsRequestModalOpen(false);
      setRequestMessage('');
    } catch (err: any) {
      showToast(err.message || 'Failed to send mentorship request', 'error');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
          <span>RV University Alumni Network</span>
          <span>·</span>
          <span>Directory & Mentors</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
          Alumni Directory & Discovery
        </h1>
        <p className="text-sm text-[#718096] mt-1 max-w-3xl">
          Connect with RV University graduates working at leading tech, research, finance, and product organizations.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, company, role, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/30 focus:border-[#D6AA61]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white text-[#172338]"
            >
              <option value="">All Departments</option>
              <option value="School of Computer Science & Engineering">Computer Science & Engineering</option>
              <option value="School of Business">Business & Management</option>
              <option value="School of Economics and Finance">Economics & Finance</option>
              <option value="School of Design & Innovation">Design & Innovation</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white text-[#172338]"
            >
              <option value="">Graduation Year</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
            </select>

            {(searchTerm || selectedDept || selectedCompany || selectedYear) && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-10 bg-slate-100 rounded w-full" />
            </div>
          ))}
        </div>
      ) : alumniList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {alumniList.map((alumni) => {
            const skillsList = alumni.skills
              ? (typeof alumni.skills === 'string' && alumni.skills.startsWith('[')
                  ? JSON.parse(alumni.skills)
                  : alumni.skills.split(','))
              : [];

            return (
              <div
                key={alumni.id}
                onClick={() => loadProfileDetails(alumni.user_id)}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#D6AA61] transition-all cursor-pointer shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-base text-[#172338]">
                      {alumni.full_name?.charAt(0) || 'A'}
                    </div>

                    {alumni.verification_status === 'verified' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#172338] group-hover:text-[#D6AA61] transition-colors">
                    {alumni.full_name}
                  </h3>
                  <p className="text-xs font-semibold text-[#718096] mt-0.5">
                    {alumni.job_title} at <span className="text-[#172338]">{alumni.company}</span>
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2">
                    <GraduationCap className="w-3.5 h-3.5 text-[#D6AA61]" />
                    <span>RVU Class of {alumni.graduation_year || 2021}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                    {alumni.bio || 'RV University Alumni Mentor available for career guidance and technical mentorship.'}
                  </p>

                  {/* Skills (anti-pill format) */}
                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px] text-[#718096]">
                      {skillsList.slice(0, 4).map((s: string, idx: number) => (
                        <React.Fragment key={s}>
                          {idx > 0 && <span>·</span>}
                          <span className="text-slate-700 font-medium">{s.trim()}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#D6AA61] group-hover:text-[#C19349]">
                    View Full Profile & Sessions
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-[#172338]">No alumni found</h3>
          <p className="text-xs text-[#718096] mt-1">Try adjusting your keyword search or department filter.</p>
          <button
            onClick={handleClearFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-[#D6AA61] border border-[#D6AA61]/30 rounded-lg hover:bg-amber-50/50"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Alumni Profile Detail Modal */}
      {activeProfile && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActiveProfile(null);
            if (onClearSelectedAlumni) onClearSelectedAlumni();
          }}
          title={activeProfile.full_name}
          subtitle={`${activeProfile.job_title} at ${activeProfile.company}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#718096] pb-3 border-b border-slate-100">
              <span className="font-semibold text-[#172338]">RV University Alumnus</span>
              <span>·</span>
              <span className="tabular-nums">Graduation Year {activeProfile.graduation_year}</span>
              <span>·</span>
              <span>{activeProfile.department}</span>
              {activeProfile.verification_status === 'verified' && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> University Verified
                  </span>
                </>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#172338] uppercase tracking-wider mb-1.5">
                About & Professional Bio
              </h4>
              <p className="text-xs md:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                {activeProfile.bio || 'RV University Alumni Mentor available to guide students on career paths, resume preparation, and interview readiness.'}
              </p>
            </div>

            {/* Available 1-on-1 Sessions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-[#172338] uppercase tracking-wider">
                  Available Mentoring Sessions
                </h4>
                {user?.role === 'student' && (
                  <button
                    onClick={() => {
                      setActiveProfile(null);
                      onNavigate('sessions');
                    }}
                    className="text-xs text-[#D6AA61] hover:underline font-semibold"
                  >
                    All Session Slots
                  </button>
                )}
              </div>

              {availableSessions.length > 0 ? (
                <div className="space-y-2">
                  {availableSessions.map((sess) => (
                    <div key={sess.id} className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-[#172338]">{sess.title}</p>
                        <p className="text-[#718096]">
                          {new Date(sess.scheduled_at).toLocaleDateString()} at {new Date(sess.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({sess.duration_minutes} mins)
                        </p>
                      </div>
                      {user?.role === 'student' ? (
                        <button
                          onClick={async () => {
                            try {
                              await api.bookSession(sess.id);
                              showToast('Session slot booked successfully!', 'success');
                              setActiveProfile(null);
                              onNavigate('sessions');
                            } catch (err: any) {
                              showToast(err.message || 'Booking failed', 'error');
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shrink-0 shadow-2xs"
                        >
                          Book Slot
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium">Available</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  No open calendar slots currently. You can still send a 1-on-1 mentorship request below.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {activeProfile.linkedin_url && (
                <a
                  href={activeProfile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#718096] hover:text-[#172338]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> LinkedIn Profile
                </a>
              )}

              <div className="flex items-center gap-3 ml-auto">
                {user?.role === 'student' && onStartMessageWith && (
                  <button
                    onClick={() => {
                      onStartMessageWith(activeProfile.user_id);
                      setActiveProfile(null);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-[#172338] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Send Direct Message
                  </button>
                )}

                {user?.role === 'student' && (
                  <button
                    onClick={() => setIsRequestModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Request Mentorship
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Request Mentorship Modal */}
      {isRequestModalOpen && activeProfile && (
        <Modal
          isOpen={true}
          onClose={() => setIsRequestModalOpen(false)}
          title={`Request Mentorship from ${activeProfile.full_name}`}
          subtitle={`Alumnus at ${activeProfile.company}`}
        >
          <form onSubmit={handleSendMentorshipRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Topics of Guidance (comma separated)
              </label>
              <input
                type="text"
                value={requestTopics}
                onChange={(e) => setRequestTopics(e.target.value)}
                placeholder="e.g. Cloud Architecture, Tech Interviews, Career Path"
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Personal Introduction & Mentorship Goal *
              </label>
              <textarea
                rows={4}
                required
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Explain what specific guidance you are seeking, your current year, and background..."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs disabled:opacity-60"
              >
                {isSubmittingRequest ? 'Sending...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
