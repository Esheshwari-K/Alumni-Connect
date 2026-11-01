import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { RVULogo } from '../../components/common/RVULogo.tsx';
import { Eye, EyeOff, ArrowLeft, Lock, Mail, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: string) => void;
  onSuccessRedirect: () => void;
}

export function LoginPage({ onNavigate, onSuccessRedirect }: LoginPageProps) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back! Signed in successfully.', 'success');
      onSuccessRedirect();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password.');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAFAF9]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Back Link */}
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#718096] hover:text-[#172338] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </button>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xs">
          {/* Top Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <RVULogo variant="auth" showWordmark={true} />
            </div>

            <h1 className="text-2xl font-bold text-[#172338] tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-[#718096] mt-1.5">
              Sign in to continue to your RV University account
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#172338] mb-1.5">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="e.g. rahul.deshmukh@rvu.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-[#172338]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs text-[#D6AA61] hover:text-[#C19349] font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#D6AA61]/40 focus:border-[#D6AA61] bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#D6AA61] hover:bg-[#C19349] text-white font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Signing In...' : 'Log In'}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-[#718096] uppercase tracking-wider mb-2.5 text-center">
              Quick Sign In (Verified Academic Accounts)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('rahul.deshmukh@rvu.edu.in', 'Student@123')}
                className="py-1.5 px-2 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-[#172338] rounded border border-slate-200 transition-colors truncate"
              >
                Student Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ananya.sharma@alumni.rvu.edu.in', 'Alumni@123')}
                className="py-1.5 px-2 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-[#172338] rounded border border-slate-200 transition-colors truncate"
              >
                Alumni Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@rvu.edu.in', 'RVAdmin@2026')}
                className="py-1.5 px-2 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-[#172338] rounded border border-slate-200 transition-colors truncate"
              >
                Admin Demo
              </button>
            </div>
          </div>

          {/* Register Links */}
          <div className="mt-6 text-center text-xs text-[#718096] space-y-1">
            <p>
              New student?{' '}
              <button
                onClick={() => onNavigate('register-student')}
                className="text-[#D6AA61] hover:text-[#C19349] font-semibold underline underline-offset-2"
              >
                Create student account
              </button>
            </p>
            <p>
              RVU graduate?{' '}
              <button
                onClick={() => onNavigate('register-alumni')}
                className="text-[#D6AA61] hover:text-[#C19349] font-semibold underline underline-offset-2"
              >
                Join as Alumni Mentor
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
