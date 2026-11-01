import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import {
  Bell,
  CheckCircle2,
  Calendar,
  Briefcase,
  Users,
  MessageSquare,
  CheckCheck
} from 'lucide-react';

interface NotificationsPageProps {
  onNavigate: (tab: string) => void;
}

export function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (err: any) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mentorship_request':
      case 'mentorship_status':
        return <Users className="w-5 h-5 text-[#D6AA61]" />;
      case 'booking':
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case 'application':
      case 'application_status':
      case 'opportunity':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
            <span>In-App Activity & Alerts</span>
            <span>·</span>
            <span>RV University</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-[#718096] mt-1">
            Real-time updates regarding your mentorship inquiries, scheduled sessions, and applications.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-2 text-xs font-semibold text-[#172338] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#D6AA61]" /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer ${
                notif.is_read ? 'bg-white hover:bg-slate-50/50' : 'bg-amber-50/40 hover:bg-amber-50/70'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm tracking-tight ${notif.is_read ? 'font-semibold text-[#172338]' : 'font-bold text-[#172338]'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-[#D6AA61] shrink-0 mt-2" />
              )}
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            <Bell className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No notifications yet</p>
            <p className="mt-0.5">When mentors reply or sessions are confirmed, updates appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
