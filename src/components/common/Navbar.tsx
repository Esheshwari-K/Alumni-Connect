import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { RVULogo } from './RVULogo.tsx';
import { api } from '../../services/api.ts';
import {
  Bell,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Briefcase,
  Users,
  Calendar,
  MessageSquare,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { user, logout } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then((res) => setUnreadNotifs(res.unread_count || 0))
        .catch(() => {});
      
      const interval = setInterval(() => {
        api.getNotifications()
          .then((res) => setUnreadNotifs(res.unread_count || 0))
          .catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  // Nav links tailored to roles
  let navItems: { id: string; label: string }[] = [];

  if (!user) {
    navItems = [
      { id: 'home', label: 'Overview' },
      { id: 'alumni', label: 'Alumni Directory' },
      { id: 'opportunities', label: 'Opportunities' }
    ];
  } else if (user.role === 'student') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'alumni', label: 'Directory' },
      { id: 'mentorship', label: 'Mentorship' },
      { id: 'sessions', label: 'Sessions' },
      { id: 'opportunities', label: 'Opportunities' },
      { id: 'messages', label: 'Messages' }
    ];
  } else if (user.role === 'alumni') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'alumni', label: 'Directory' },
      { id: 'mentorship', label: 'Requests' },
      { id: 'sessions', label: 'Availability' },
      { id: 'opportunities', label: 'Opportunities' },
      { id: 'messages', label: 'Messages' }
    ];
  } else if (user.role === 'admin') {
    navItems = [
      { id: 'dashboard', label: 'Admin Overview' },
      { id: 'admin-verifications', label: 'Verifications' },
      { id: 'admin-users', label: 'Users' },
      { id: 'alumni', label: 'Directory' },
      { id: 'opportunities', label: 'Opportunities' }
    ];
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Zone */}
          <div className="shrink-0 flex items-center">
            <RVULogo
              variant="header"
              showWordmark={true}
              onClick={() => handleNavClick(user ? 'dashboard' : 'home')}
            />
          </div>

          {/* Zone 2: Navigation Links (single-line, clean typography) */}
          <nav className="hidden lg:flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-sm font-medium whitespace-nowrap shrink-0 transition-colors py-1 ${
                    isActive
                      ? 'text-[#172338] border-b-2 border-[#D6AA61] font-semibold'
                      : 'text-[#718096] hover:text-[#172338]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action / User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <>
                {/* Notifications button */}
                <button
                  onClick={() => handleNavClick('notifications')}
                  title="Notifications"
                  className="relative p-2 text-slate-500 hover:text-[#172338] hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D6AA61] rounded-full ring-2 ring-white" />
                  )}
                </button>

                {/* Profile menu dropdown button */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-semibold text-[#172338] truncate max-w-[120px]">
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-[#718096] capitalize font-medium">
                        {user.role}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#172338] font-bold text-xs">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-[#172338] truncate">{user.full_name}</p>
                        <p className="text-xs text-[#718096] truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[11px] font-semibold text-[#D6AA61] capitalize">
                          RV University · {user.role}
                        </span>
                      </div>

                      <button
                        onClick={() => handleNavClick('profile')}
                        className="w-full text-left px-4 py-2 text-sm text-[#172338] hover:bg-slate-50 flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile & Settings
                      </button>

                      {user.role === 'student' && (
                        <button
                          onClick={() => handleNavClick('my-applications')}
                          className="w-full text-left px-4 py-2 text-sm text-[#172338] hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          My Applications
                        </button>
                      )}

                      {user.role === 'admin' && (
                        <button
                          onClick={() => handleNavClick('admin-verifications')}
                          className="w-full text-left px-4 py-2 text-sm text-[#172338] hover:bg-slate-50 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-slate-400" />
                          Verification Queue
                        </button>
                      )}

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          logout();
                          setActiveTab('login');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('login')}
                  className="px-4 py-2 text-xs font-semibold text-[#172338] border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                >
                  Log In
                </button>
                <button
                  onClick={() => setActiveTab('register-student')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors whitespace-nowrap shadow-sm"
                >
                  Join Platform
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-[#172338]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === item.id
                  ? 'bg-slate-100 text-[#172338] font-semibold'
                  : 'text-[#718096] hover:bg-slate-50 hover:text-[#172338]'
              }`}
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button
              onClick={() => handleNavClick('profile')}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-[#718096] hover:bg-slate-50"
            >
              Profile & Settings
            </button>
          )}
        </div>
      )}
    </header>
  );
}
