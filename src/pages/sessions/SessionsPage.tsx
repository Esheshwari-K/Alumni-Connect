import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { api } from '../../services/api.ts';
import { Modal } from '../../components/common/Modal.tsx';
import {
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Plus,
  CheckCircle2,
  XCircle,
  Video,
  AlertCircle
} from 'lucide-react';

interface SessionsPageProps {
  onNavigate: (tab: string) => void;
  isCreateOpenInitially?: boolean;
  onCloseCreateInitially?: () => void;
}

export function SessionsPage({
  onNavigate,
  isCreateOpenInitially = false,
  onCloseCreateInitially
}: SessionsPageProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(isCreateOpenInitially);
  const [isLoading, setIsLoading] = useState(true);

  // Form for new session (alumni only)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: '45',
    meeting_link: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadSessionsAndBookings();
  }, []);

  const loadSessionsAndBookings = async () => {
    setIsLoading(true);
    try {
      const [sessRes, bookRes] = await Promise.all([
        api.getSessions(),
        api.getBookings()
      ]);
      setSessions(sessRes.sessions || []);
      setBookings(bookRes.bookings || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load sessions data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSession = async (sessionId: string) => {
    try {
      await api.bookSession(sessionId);
      showToast('Mentorship session slot booked successfully! Added to your schedule.', 'success');
      loadSessionsAndBookings();
    } catch (err: any) {
      showToast(err.message || 'Booking failed', 'error');
    }
  };

  const [bookingToCancel, setBookingToCancel] = useState<any | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      await api.cancelBooking(bookingToCancel.id);
      showToast('Booking cancelled successfully. The session slot has been reopened.', 'info');
      setBookingToCancel(null);
      loadSessionsAndBookings();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduled_at) {
      showToast('Please provide a title and date/time', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createSession({
        title: formData.title,
        description: formData.description,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        duration_minutes: parseInt(formData.duration_minutes, 10),
        meeting_link: formData.meeting_link
      });
      showToast('Mentorship slot published! Students can now book this time.', 'success');
      setIsCreateModalOpen(false);
      if (onCloseCreateInitially) onCloseCreateInitially();
      setFormData({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: '45',
        meeting_link: ''
      });
      loadSessionsAndBookings();
    } catch (err: any) {
      showToast(err.message || 'Failed to create slot', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStudent = user?.role === 'student';
  const isAlumni = user?.role === 'alumni';

  const availableSlots = sessions.filter((s) => s.status === 'available');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D6AA61] uppercase tracking-wider mb-1">
            <span>1-on-1 Mentorship Sessions</span>
            <span>·</span>
            <span>RV University</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#172338] tracking-tight">
            Mentoring Sessions & Booking
          </h1>
          <p className="text-sm text-[#718096] mt-1 max-w-3xl">
            {isStudent
              ? 'Select verified RV University alumni time slots for resume critiques, career roadmapping, or technical interview practice.'
              : 'Publish available mentoring calendar slots and view your scheduled sessions with students.'}
          </p>
        </div>

        {isAlumni && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors flex items-center gap-2 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Open New Mentorship Slot
          </button>
        )}
      </div>

      {/* Confirmed Bookings Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#172338]">Your Scheduled Sessions</h2>
            <p className="text-xs text-[#718096]">Confirmed appointments with meeting details and video links</p>
          </div>
          <span className="text-xs font-semibold text-[#D6AA61] tabular-nums">
            {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
          </span>
        </div>

        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking) => {
              const otherParty = isStudent
                ? `Alumni: ${booking.alumni_name} (${booking.alumni_company})`
                : `Student: ${booking.student_name} (${booking.student_email})`;

              return (
                <div
                  key={booking.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#172338]">{booking.session_title}</h4>
                      <p className="text-xs text-[#718096] mt-0.5">{otherParty}</p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                      booking.status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 font-mono tabular-nums">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#D6AA61]" />
                      {new Date(booking.scheduled_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D6AA61]" />
                      {new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({booking.duration_minutes || 45} mins)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    {booking.meeting_link ? (
                      <a
                        href={booking.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D6AA61] hover:underline"
                      >
                        <Video className="w-3.5 h-3.5" /> Join Video Call <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Meeting link provided by host</span>
                    )}

                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => setBookingToCancel(booking)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <CalendarIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p>No confirmed mentorship appointments scheduled.</p>
          </div>
        )}
      </div>

      {/* Available Slots Directory (Student View & Overview) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#172338]">Available Mentoring Slots</h2>
          <p className="text-xs text-[#718096]">Open 1-on-1 slots ready for reservation</p>
        </div>

        {availableSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableSlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Open Slot
                    </span>
                    <span className="text-xs font-mono text-slate-500 tabular-nums">
                      {slot.duration_minutes} min session
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#172338]">{slot.title}</h3>
                  <p className="text-xs font-semibold text-[#718096] mt-0.5">
                    Mentor: {slot.alumni_name} ({slot.alumni_company})
                  </p>

                  {slot.description && (
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
                      {slot.description}
                    </p>
                  )}

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-mono text-[#172338] tabular-nums">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#D6AA61]" />
                      {new Date(slot.scheduled_at).toLocaleDateString()}
                    </span>
                    <span>
                      {new Date(slot.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  {isStudent ? (
                    <button
                      onClick={() => handleBookSession(slot.id)}
                      className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      Confirm Booking
                    </button>
                  ) : (
                    <p className="text-[11px] text-center text-slate-400">
                      Students can book this slot directly.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-xs text-slate-400 shadow-xs">
            <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600">No open slots available right now</p>
            <p className="mt-1">
              Alumni mentors regularly post new slots. Check back soon or send a direct mentorship request.
            </p>
          </div>
        )}
      </div>

      {/* Create Slot Modal (Alumni) */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsCreateModalOpen(false);
            if (onCloseCreateInitially) onCloseCreateInitially();
          }}
          title="Open Mentorship Time Slot"
          subtitle="Publish a calendar availability slot for RV University students"
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Session Topic / Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. System Design Mock Interview or Resume Deep-Dive"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Session Description & Goals
              </label>
              <textarea
                rows={3}
                placeholder="Explain what students can prepare before the meeting..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172338] mb-1">
                  Duration (Minutes)
                </label>
                <select
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#D6AA61] bg-white"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172338] mb-1">
                Meeting Link (Google Meet, Zoom, Teams)
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/abc-defg-hij"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
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
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#D6AA61] hover:bg-[#C19349] rounded-lg transition-colors shadow-2xs disabled:opacity-60"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Session Slot'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Booking Confirmation Modal */}
      {bookingToCancel && (
        <Modal
          isOpen={true}
          onClose={() => setBookingToCancel(null)}
          title="Cancel Mentorship Booking"
          subtitle={`Are you sure you want to cancel "${bookingToCancel.session_title || 'Mentoring Session'}"?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50 p-3 rounded-lg border border-rose-200 text-rose-900">
              This action will release your reservation and make the time slot available for other students to book.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookingToCancel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={confirmCancelBooking}
                disabled={isCancelling}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
