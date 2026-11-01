import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { RVULogo } from '../../components/common/RVULogo.tsx';
import { api } from '../../services/api.ts';
import { ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AlumniRegisterPageProps {
  onNavigate: (route: string) => void;
  onSuccessRedirect: () => void;
}

export function AlumniRegisterPage({ onNavigate, onSuccessRedirect }: AlumniRegisterPageProps) {
  const { setUser } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    graduation_year: '2023',
    department: 'School of Computer Science & Engineering',
    company: '',
    job_title: '',
    skills: '',
    bio: '',
    linkedin_url: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password !== formData.confirm_password) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.registerAlumni(formData);
      if (res.token) {
        localStorage.setItem('alumni_connect_token', res.token);
      }
      setUser(res.user);
      showToast('Alumni account created! Submitted for university administrator verification.', 'info');
      onSuccessRedirect();
    } catch (err: any) {
      setErrorMessage(err.message || 'Alumni registration failed.');
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAFAF9]">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <button
          onClick={() => onNavigate('login')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#718096] hover:text-[#172338] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </button>

        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <RVULogo variant="auth" showWordmark={true} />
            </div>
            <h1 className="text-2xl font-bold text-[#172338] tracking-tight">
              Register as Alumni Mentor
            </h1>
            <p className="text-sm text-[#718096] mt-1.5">
              Empower RV University students through guidance, mentorship, and opportunities
            </p>
            <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-left text-xs text-amber-900 leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                To uphold trust within the RVU network, new alumni accounts enter a verification queue reviewed by the RV University Alumni Relations Office.
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                Full Name *
              </label>
              <input
                name="full_name"
                type="text"
                required
                placeholder="e.g. Varun Hegde"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="varun@alumni.rvu.edu.in"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Graduation Year *
                </label>
                <select
                  name="graduation_year"
                  value={formData.graduation_year}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
                >
                  {Array.from({ length: 15 }, (_, i) => 2026 - i).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Current Company / Org *
                </label>
                <input
                  name="company"
                  type="text"
                  required
                  placeholder="e.g. Adobe, Intel, Startup"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Current Job Title *
                </label>
                <input
                  name="job_title"
                  type="text"
                  required
                  placeholder="e.g. Product Engineer"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                School / Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
              >
                <option value="School of Computer Science & Engineering">School of Computer Science & Engineering</option>
                <option value="School of Business">School of Business</option>
                <option value="School of Economics and Finance">School of Economics and Finance</option>
                <option value="School of Liberal Arts & Sciences">School of Liberal Arts & Sciences</option>
                <option value="School of Design & Innovation">School of Design & Innovation</option>
                <option value="School of Law">School of Law</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                Professional Skills (comma separated)
              </label>
              <input
                name="skills"
                type="text"
                placeholder="e.g. System Design, Product Strategy, Kubernetes, Cloud"
                value={formData.skills}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                LinkedIn Profile URL
              </label>
              <input
                name="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedin_url}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Password *
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  Confirm Password *
                </label>
                <input
                  name="confirm_password"
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-2.5 px-4 rounded-lg bg-[#D6AA61] hover:bg-[#C19349] text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Submitting...' : 'Register as Alumni'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#718096]">
            Already registered?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-[#D6AA61] hover:text-[#C19349] font-semibold underline underline-offset-2"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
