import React, { useState } from 'react';
import { RVULogo } from '../../components/common/RVULogo.tsx';
import { api } from '../../services/api.ts';
import { ArrowLeft, Info, CheckCircle2 } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (route: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setSubmitted(true);
      setStatusMessage(res.message);
    } catch (err: any) {
      setStatusMessage(err.message || 'Error processing request');
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAFAF9]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
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
              Reset Your Password
            </h1>
            <p className="text-sm text-[#718096] mt-1.5">
              Enter your registered RV University email address
            </p>
          </div>

          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#D6AA61] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#172338] leading-relaxed">
                    <p className="font-semibold mb-1">Password Assistance Notice</p>
                    <p className="text-[#718096]">{statusMessage}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900">
                <strong>Development Note:</strong> For this academic project, standard credentials are pre-seeded:
                <ul className="list-disc pl-4 mt-1.5 space-y-1">
                  <li>Student: <span className="font-mono">Student@123</span></li>
                  <li>Alumni: <span className="font-mono">Alumni@123</span></li>
                  <li>Admin: <span className="font-mono">RVAdmin@2026</span></li>
                </ul>
              </div>

              <button
                onClick={() => onNavigate('login')}
                className="w-full py-2.5 px-4 rounded-lg bg-[#D6AA61] hover:bg-[#C19349] text-white font-semibold text-sm transition-all"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1.5">
                  University Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.deshmukh@rvu.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#D6AA61] hover:bg-[#C19349] text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-60"
              >
                {isLoading ? 'Requesting...' : 'Request Password Reset'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
