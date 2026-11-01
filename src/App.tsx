import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Navbar } from './components/common/Navbar.tsx';
import { Footer } from './components/common/Footer.tsx';

// Pages
import { HomePage } from './pages/home/HomePage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { StudentRegisterPage } from './pages/auth/StudentRegisterPage.tsx';
import { AlumniRegisterPage } from './pages/auth/AlumniRegisterPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { StudentDashboard } from './pages/dashboard/StudentDashboard.tsx';
import { AlumniDashboard } from './pages/dashboard/AlumniDashboard.tsx';
import { AdminDashboard } from './pages/dashboard/AdminDashboard.tsx';
import { AlumniDirectoryPage } from './pages/alumni/AlumniDirectoryPage.tsx';
import { MentorshipPage } from './pages/mentorship/MentorshipPage.tsx';
import { SessionsPage } from './pages/sessions/SessionsPage.tsx';
import { MessagesPage } from './pages/messages/MessagesPage.tsx';
import { OpportunitiesPage } from './pages/opportunities/OpportunitiesPage.tsx';
import { MyApplicationsPage } from './pages/opportunities/MyApplicationsPage.tsx';
import { NotificationsPage } from './pages/notifications/NotificationsPage.tsx';
import { ProfilePage } from './pages/profile/ProfilePage.tsx';

function MainLayout() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedAlumniId, setSelectedAlumniId] = useState<string | null>(null);
  const [messagingPartnerId, setMessagingPartnerId] = useState<string | null>(null);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [isCreateOpportunityOpen, setIsCreateOpportunityOpen] = useState(false);

  // If user signs in and is on guest page, redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (activeTab === 'home' || activeTab === 'login' || activeTab === 'register-student' || activeTab === 'register-alumni') {
        setActiveTab('dashboard');
      }
    }
  }, [user, isLoading]);

  const handleOpenAlumniDetails = (alumniId: string) => {
    setSelectedAlumniId(alumniId);
    setActiveTab('alumni');
  };

  const handleStartMessageWith = (userId: string) => {
    setMessagingPartnerId(userId);
    setActiveTab('messages');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center space-y-3">
          <img
            src="/assets/aistudio/image_2a9aa807.png"
            alt="RV University"
            referrerPolicy="no-referrer"
            className="h-12 mx-auto object-contain animate-pulse"
          />
          <p className="text-xs font-semibold text-[#718096]">Loading Alumni Connect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#172338]">
      {/* Top Navbar with RV University Logo */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && <HomePage onNavigate={setActiveTab} />}

        {activeTab === 'login' && (
          <LoginPage
            onNavigate={setActiveTab}
            onSuccessRedirect={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'register-student' && (
          <StudentRegisterPage
            onNavigate={setActiveTab}
            onSuccessRedirect={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'register-alumni' && (
          <AlumniRegisterPage
            onNavigate={setActiveTab}
            onSuccessRedirect={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'forgot-password' && (
          <ForgotPasswordPage onNavigate={setActiveTab} />
        )}

        {/* Dashboards */}
        {activeTab === 'dashboard' && (
          <>
            {user?.role === 'student' && (
              <StudentDashboard
                onNavigate={setActiveTab}
                onOpenAlumniDetails={handleOpenAlumniDetails}
              />
            )}
            {user?.role === 'alumni' && (
              <AlumniDashboard
                onNavigate={setActiveTab}
                onOpenCreateSession={() => {
                  setIsCreateSessionOpen(true);
                  setActiveTab('sessions');
                }}
                onOpenCreateOpportunity={() => {
                  setIsCreateOpportunityOpen(true);
                  setActiveTab('opportunities');
                }}
              />
            )}
            {user?.role === 'admin' && <AdminDashboard />}
            {!user && <HomePage onNavigate={setActiveTab} />}
          </>
        )}

        {/* Directory */}
        {activeTab === 'alumni' && (
          <AlumniDirectoryPage
            onNavigate={setActiveTab}
            selectedAlumniId={selectedAlumniId}
            onClearSelectedAlumni={() => setSelectedAlumniId(null)}
            onStartMessageWith={handleStartMessageWith}
          />
        )}

        {/* Mentorship Requests */}
        {activeTab === 'mentorship' && (
          <MentorshipPage
            onNavigate={setActiveTab}
            onStartMessageWith={handleStartMessageWith}
          />
        )}

        {/* Sessions & Booking */}
        {activeTab === 'sessions' && (
          <SessionsPage
            onNavigate={setActiveTab}
            isCreateOpenInitially={isCreateSessionOpen}
            onCloseCreateInitially={() => setIsCreateSessionOpen(false)}
          />
        )}

        {/* Messages */}
        {activeTab === 'messages' && (
          <MessagesPage
            initialPartnerId={messagingPartnerId}
            onClearInitialPartner={() => setMessagingPartnerId(null)}
          />
        )}

        {/* Opportunities */}
        {activeTab === 'opportunities' && (
          <OpportunitiesPage
            isCreateOpenInitially={isCreateOpportunityOpen}
            onCloseCreateInitially={() => setIsCreateOpportunityOpen(false)}
          />
        )}

        {/* Student's Applications */}
        {activeTab === 'my-applications' && (
          <MyApplicationsPage onNavigate={setActiveTab} />
        )}

        {/* Admin views */}
        {activeTab === 'admin-verifications' && <AdminDashboard />}
        {activeTab === 'admin-users' && <AdminDashboard />}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <NotificationsPage onNavigate={setActiveTab} />
        )}

        {/* Profile & Settings */}
        {activeTab === 'profile' && <ProfilePage />}
      </main>

      {/* Footer with RV University Logo */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ToastProvider>
  );
}
