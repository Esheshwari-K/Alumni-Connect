import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import {
  User as UserIcon,
  Save,
  Building,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Linkedin
} from 'lucide-react';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Student fields
  const [studentData, setStudentData] = useState({
    usn: '',
    programme: '',
    department: '',
    semester_or_year: '',
    skills: '',
    interests: '',
    bio: ''
  });

  // Alumni fields
  const [alumniData, setAlumniData] = useState({
    headline: '',
    company: '',
    job_title: '',
    graduation_year: '2022',
    department: '',
    skills: '',
    bio: '',
    linkedin_url: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (user.role === 'student') {
        const res = await api.getStudentProfile();
        if (res.profile) {
          const rawSkills = res.profile.skills;
          const skillsStr = rawSkills && rawSkills.startsWith('[') ? JSON.parse(rawSkills).join(', ') : (rawSkills || '');
          const rawInterests = res.profile.interests;
          const interestsStr = rawInterests && rawInterests.startsWith('[') ? JSON.parse(rawInterests).join(', ') : (rawInterests || '');

          setStudentData({
            usn: res.profile.usn || '',
            programme: res.profile.programme || '',
            department: res.profile.department || 'School of Computer Science & Engineering',
            semester_or_year: res.profile.semester_or_year || '',
            skills: skillsStr,
            interests: interestsStr,
            bio: res.profile.bio || ''
          });
        }
      } else if (user.role === 'alumni') {
        const res = await api.getAlumniProfile();
        if (res.profile) {
          const rawSkills = res.profile.skills;
          const skillsStr = rawSkills && rawSkills.startsWith('[') ? JSON.parse(rawSkills).join(', ') : (rawSkills || '');

          setAlumniData({
            headline: res.profile.headline || '',
            company: res.profile.company || '',
            job_title: res.profile.job_title || '',
            graduation_year: String(res.profile.graduation_year || 2022),
            department: res.profile.department || 'School of Computer Science & Engineering',
            skills: skillsStr,
            bio: res.profile.bio || '',
            linkedin_url: res.profile.linkedin_url || ''
          });
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateStudentProfile({
        ...studentData,
        skills: studentData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        interests: studentData.interests.split(',').map((s) => s.trim()).filter(Boolean)
      });
      showToast('Student profile updated successfully', 'success');
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateAlumniProfile({
        ...alumniData,
        graduation_year: parseInt(alumniData.graduation_year, 10),
        skills: alumniData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      });
      showToast('Alumni profile updated successfully', 'success');
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
          <span>Account & Profile Settings</span>
          <span>·</span>
          <span>RV University</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
          My Profile & Information
        </h1>
        <p className="text-sm text-[#718096] mt-1">
          Maintain your academic details and professional background visible to the RV University community.
        </p>
      </div>

      {/* Account Overview Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xl text-[#172338]">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#172338]">{user?.full_name}</h2>
            <p className="text-xs text-[#718096]">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-semibold text-[#D6AA61] uppercase">
                {user?.role} Account
              </span>
              <span>·</span>
              <span className="text-[11px] text-emerald-700 font-medium">Status: Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        {user?.role === 'student' ? (
          <form onSubmit={handleSaveStudent} className="space-y-5">
            <h3 className="text-base font-bold text-[#172338] pb-3 border-b border-slate-100">
              Student Academic Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  University Identifier / USN
                </label>
                <input
                  type="text"
                  value={studentData.usn}
                  onChange={(e) => setStudentData({ ...studentData, usn: e.target.value })}
                  placeholder="e.g. 1RV22CS089"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Current Year or Semester
                </label>
                <input
                  type="text"
                  value={studentData.semester_or_year}
                  onChange={(e) => setStudentData({ ...studentData, semester_or_year: e.target.value })}
                  placeholder="e.g. 6th Semester (3rd Year)"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Academic Programme
                </label>
                <input
                  type="text"
                  value={studentData.programme}
                  onChange={(e) => setStudentData({ ...studentData, programme: e.target.value })}
                  placeholder="e.g. B.Tech Computer Science and Engineering"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  School / Department
                </label>
                <select
                  value={studentData.department}
                  onChange={(e) => setStudentData({ ...studentData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white"
                >
                  <option value="School of Computer Science & Engineering">School of Computer Science & Engineering</option>
                  <option value="School of Business">School of Business</option>
                  <option value="School of Economics and Finance">School of Economics and Finance</option>
                  <option value="School of Liberal Arts & Sciences">School of Liberal Arts & Sciences</option>
                  <option value="School of Design & Innovation">School of Design & Innovation</option>
                  <option value="School of Law">School of Law</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                Technical Skills (comma separated)
              </label>
              <input
                type="text"
                value={studentData.skills}
                onChange={(e) => setStudentData({ ...studentData, skills: e.target.value })}
                placeholder="e.g. TypeScript, React, Python, PostgreSQL, Data Structures"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                Career Interests & Goals (comma separated)
              </label>
              <input
                type="text"
                value={studentData.interests}
                onChange={(e) => setStudentData({ ...studentData, interests: e.target.value })}
                placeholder="e.g. Cloud Architecture, AI Research, Product Management, Open Source"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                Personal Bio / Career Objectives
              </label>
              <textarea
                rows={3}
                value={studentData.bio}
                onChange={(e) => setStudentData({ ...studentData, bio: e.target.value })}
                placeholder="Tell mentors about yourself, projects you're working on, and what you aim to achieve..."
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        ) : user?.role === 'alumni' ? (
          <form onSubmit={handleSaveAlumni} className="space-y-5">
            <h3 className="text-base font-bold text-[#172338] pb-3 border-b border-slate-100">
              Alumni Mentor Professional Profile
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                Professional Headline
              </label>
              <input
                type="text"
                value={alumniData.headline}
                onChange={(e) => setAlumniData({ ...alumniData, headline: e.target.value })}
                placeholder="e.g. Senior Software Engineer at Google | Cloud Infrastructure"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Current Company / Organization
                </label>
                <input
                  type="text"
                  value={alumniData.company}
                  onChange={(e) => setAlumniData({ ...alumniData, company: e.target.value })}
                  placeholder="e.g. Google, Microsoft, Startup"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Current Job Title
                </label>
                <input
                  type="text"
                  value={alumniData.job_title}
                  onChange={(e) => setAlumniData({ ...alumniData, job_title: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Graduation Year
                </label>
                <select
                  value={alumniData.graduation_year}
                  onChange={(e) => setAlumniData({ ...alumniData, graduation_year: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white"
                >
                  {Array.from({ length: 15 }, (_, i) => 2026 - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  School / Department
                </label>
                <select
                  value={alumniData.department}
                  onChange={(e) => setAlumniData({ ...alumniData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white"
                >
                  <option value="School of Computer Science & Engineering">School of Computer Science & Engineering</option>
                  <option value="School of Business">School of Business</option>
                  <option value="School of Economics and Finance">School of Economics and Finance</option>
                  <option value="School of Liberal Arts & Sciences">School of Liberal Arts & Sciences</option>
                  <option value="School of Design & Innovation">School of Design & Innovation</option>
                  <option value="School of Law">School of Law</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                Professional Skills (comma separated)
              </label>
              <input
                type="text"
                value={alumniData.skills}
                onChange={(e) => setAlumniData({ ...alumniData, skills: e.target.value })}
                placeholder="e.g. Distributed Systems, Product Strategy, Go, Kubernetes, System Design"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={alumniData.linkedin_url}
                onChange={(e) => setAlumniData({ ...alumniData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                Mentorship Biography
              </label>
              <textarea
                rows={3}
                value={alumniData.bio}
                onChange={(e) => setAlumniData({ ...alumniData, bio: e.target.value })}
                placeholder="Share your current focus, career journey since graduating from RV University, and how you can guide students..."
                className="w-full px-3.5 py-2.5 text-xs md:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-60"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-xs text-[#718096]">
            Administrator profiles are managed through server-side configurations.
          </div>
        )}
      </div>
    </div>
  );
}
