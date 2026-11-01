import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Briefcase,
  MapPin,
  Calendar,
  Building,
  Plus,
  Send,
  ExternalLink,
  Search,
  CheckCircle2,
  Users,
  FileText
} from 'lucide-react';

interface OpportunitiesPageProps {
  isCreateOpenInitially?: boolean;
  onCloseCreateInitially?: () => void;
}

export function OpportunitiesPage({
  isCreateOpenInitially = false,
  onCloseCreateInitially
}: OpportunitiesPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Apply modal
  const [selectedOppForApply, setSelectedOppForApply] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // View applicants modal (for alumni poster)
  const [selectedOppForApplicants, setSelectedOppForApplicants] = useState<any>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);

  // Create opportunity modal (Alumni)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(isCreateOpenInitially);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: 'Bengaluru, India',
    opportunity_type: 'internship',
    description: '',
    required_skills: '',
    application_url: '',
    deadline: ''
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  useEffect(() => {
    loadOpportunities();
  }, [searchTerm, typeFilter]);

  const loadOpportunities = async () => {
    setIsLoading(true);
    try {
      const res = await api.getOpportunities({
        search: searchTerm || undefined,
        type: typeFilter || undefined
      });
      setOpportunities(res.opportunities || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load opportunities', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppForApply) return;

    setIsSubmittingApp(true);
    try {
      await api.applyForOpportunity(selectedOppForApply.id, {
        cover_letter: coverLetter,
        resume_url: resumeUrl
      });
      showToast('Application submitted successfully! The alumni poster has been notified.', 'success');
      setSelectedOppForApply(null);
      setCoverLetter('');
      setResumeUrl('');
    } catch (err: any) {
      showToast(err.message || 'Application failed', 'error');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCreate(true);
    try {
      await api.createOpportunity({
        ...formData,
        required_skills: formData.required_skills.split(',').map((s) => s.trim())
      });
      showToast('Opportunity published successfully!', 'success');
      setIsCreateModalOpen(false);
      if (onCloseCreateInitially) onCloseCreateInitially();
      setFormData({
        title: '',
        company: '',
        location: 'Bengaluru, India',
        opportunity_type: 'internship',
        description: '',
        required_skills: '',
        application_url: '',
        deadline: ''
      });
      loadOpportunities();
    } catch (err: any) {
      showToast(err.message || 'Failed to create opportunity', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const openApplicantsView = async (opp: any) => {
    setSelectedOppForApplicants(opp);
    setIsLoadingApplicants(true);
    try {
      const res = await api.getOpportunityApplications(opp.id);
      setApplicants(res.applications || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch applicants', 'error');
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  const handleUpdateApplicantStatus = async (appId: string, nextStatus: string) => {
    try {
      await api.updateApplicationStatus(appId, nextStatus);
      showToast(`Applicant status marked as ${nextStatus}`, 'success');
      if (selectedOppForApplicants) {
        openApplicantsView(selectedOppForApplicants);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update applicant status', 'error');
    }
  };

  const isStudent = user?.role === 'student';
  const isAlumni = user?.role === 'alumni';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
            <span>Career Opportunities & Referrals</span>
            <span>·</span>
            <span>RV University</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
            Opportunities Directory
          </h1>
          <p className="text-sm text-[#718096] mt-1 max-w-3xl">
            Verified internships, entry-level engineering roles, and direct alumni referrals for RV University students.
          </p>
        </div>

        {isAlumni && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Post New Opportunity
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by role title, company, skills, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white text-[#172338]"
        >
          <option value="">All Types</option>
          <option value="internship">Internship</option>
          <option value="referral">Alumni Referral</option>
          <option value="full-time">Full-Time</option>
          <option value="part-time">Part-Time</option>
          <option value="event">Campus Event</option>
        </select>
      </div>

      {/* Opportunities Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-36" />
          ))}
        </div>
      ) : opportunities.length > 0 ? (
        <div className="space-y-4">
          {opportunities.map((opp) => {
            const skillsList = opp.required_skills
              ? (typeof opp.required_skills === 'string' && opp.required_skills.startsWith('[')
                  ? JSON.parse(opp.required_skills)
                  : opp.required_skills.split(','))
              : [];

            const isPoster = opp.posted_by === user?.id;

            return (
              <div
                key={opp.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded capitalize bg-slate-100 text-slate-700">
                        {opp.opportunity_type}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-semibold text-[#172338]">{opp.company}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-[#718096] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#D6AA61]" /> {opp.location}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#172338]">{opp.title}</h3>
                    <p className="text-xs text-[#718096] mt-0.5">
                      Posted by {opp.poster_name} ({opp.poster_company}) · <span className="tabular-nums">{new Date(opp.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {opp.application_url ? (
                      <a
                        href={opp.application_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 text-xs font-semibold text-[#172338] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        External Portal <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : isStudent ? (
                      <button
                        onClick={() => setSelectedOppForApply(opp)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Apply Internally
                      </button>
                    ) : null}

                    {isPoster && (
                      <button
                        onClick={() => openApplicantsView(opp)}
                        className="px-4 py-2 text-xs font-semibold text-[#172338] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" /> Review Applicants
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs md:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                  {opp.description}
                </p>

                {skillsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#718096]">
                    <span className="font-semibold text-[#172338]">Required Skills:</span>
                    {skillsList.map((skill: string, idx: number) => (
                      <React.Fragment key={skill}>
                        {idx > 0 && <span>·</span>}
                        <span className="text-slate-700 font-medium">{skill.trim()}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172338]">No opportunities found</h3>
          <p className="text-xs text-[#718096] mt-1">Try resetting your search query.</p>
        </div>
      )}

      {/* Internal Application Submission Modal */}
      {selectedOppForApply && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOppForApply(null)}
          title={`Apply: ${selectedOppForApply.title}`}
          subtitle={`${selectedOppForApply.company} · ${selectedOppForApply.location}`}
        >
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Portfolio / Resume Google Drive Link
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Cover Note / Why are you interested in this role? *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Summarize your relevant coursework, projects, and motivations for this position..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOppForApply(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingApp}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs disabled:opacity-60"
              >
                {isSubmittingApp ? 'Submitting...' : 'Confirm Application'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Review Applicants Modal (Alumni) */}
      {selectedOppForApplicants && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOppForApplicants(null)}
          title={`Applicants for ${selectedOppForApplicants.title}`}
          subtitle={`Total: ${applicants.length} student submission(s)`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {isLoadingApplicants ? (
              <p className="text-xs text-slate-400 py-6 text-center">Loading applicant records...</p>
            ) : applicants.length > 0 ? (
              applicants.map((app) => (
                <div key={app.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#172338]">{app.student_name}</h4>
                      <p className="text-xs text-[#718096]">
                        {app.student_programme} · {app.student_department} ({app.student_email})
                      </p>
                    </div>

                    <select
                      value={app.status}
                      onChange={(e) => handleUpdateApplicantStatus(app.id, e.target.value)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-300 bg-white"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="selected">Selected</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {app.cover_letter && (
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                      "{app.cover_letter}"
                    </p>
                  )}

                  {app.resume_url && (
                    <a
                      href={app.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D6AA61] hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Resume Document
                    </a>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">
                No students have applied for this opportunity yet.
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Create Opportunity Modal (Alumni) */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsCreateModalOpen(false);
            if (onCloseCreateInitially) onCloseCreateInitially();
          }}
          title="Publish Career Opportunity"
          subtitle="Share an opening or alumni referral with RV University students"
        >
          <form onSubmit={handleCreateOpportunity} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Opportunity Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Summer 2027 Software Engineering Intern"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Company / Organization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Cisco, Flipkart"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Type of Opportunity *
                </label>
                <select
                  value={formData.opportunity_type}
                  onChange={(e) => setFormData({ ...formData, opportunity_type: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white"
                >
                  <option value="internship">Internship</option>
                  <option value="referral">Direct Alumni Referral</option>
                  <option value="full-time">Full-Time Job</option>
                  <option value="part-time">Part-Time</option>
                  <option value="event">Campus Event</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Location (City, Hybrid, Remote) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru (Hybrid)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Detailed Description & Requirements *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Outline the responsibilities, eligibility requirements, and team context..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Required Technical Skills (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Go, Python, React, PostgreSQL"
                value={formData.required_skills}
                onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                External Application URL (Optional — leave blank for internal RVU applications)
              </label>
              <input
                type="url"
                placeholder="https://careers.google.com/jobs/..."
                value={formData.application_url}
                onChange={(e) => setFormData({ ...formData, application_url: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  if (onCloseCreateInitially) onCloseCreateInitially();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingCreate}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs disabled:opacity-60"
              >
                {isSubmittingCreate ? 'Publishing...' : 'Publish Opportunity'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
