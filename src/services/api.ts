const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('alumni_connect_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  registerStudent(body: any) {
    return request<any>('/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  registerAlumni(body: any) {
    return request<any>('/auth/register/alumni', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  login(body: { email: string; password: string }) {
    return request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  logout() {
    return request<any>('/auth/logout', { method: 'POST' });
  },

  getCurrentUser() {
    return request<any>('/auth/me');
  },

  forgotPassword(email: string) {
    return request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  // Student Profile
  getStudentProfile() {
    return request<any>('/students/me');
  },

  updateStudentProfile(data: any) {
    return request<any>('/students/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Alumni Directory & Profile
  getAlumniDirectory(params: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') query.append(k, String(v));
    });
    return request<{ alumni: any[]; total: number }>(`/alumni?${query.toString()}`);
  },

  getAlumniDetails(id: string) {
    return request<{ profile: any; available_sessions: any[] }>(`/alumni/${id}`);
  },

  getAlumniProfile() {
    return request<any>('/alumni/me');
  },

  updateAlumniProfile(data: any) {
    return request<any>('/alumni/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Mentorship
  createMentorshipRequest(data: { alumni_id: string; message: string; topics?: string[] }) {
    return request<any>('/mentorship/requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMentorshipRequests() {
    return request<{ requests: any[] }>('/mentorship/requests');
  },

  updateMentorshipRequestStatus(id: string, status: 'accepted' | 'rejected' | 'cancelled') {
    return request<any>(`/mentorship/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Sessions & Booking
  getSessions(alumniId?: string) {
    const query = alumniId ? `?alumni_id=${alumniId}` : '';
    return request<{ sessions: any[] }>(`/sessions${query}`);
  },

  createSession(data: { title: string; description?: string; scheduled_at: string; duration_minutes?: number; meeting_link?: string }) {
    return request<any>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  bookSession(sessionId: string) {
    return request<any>('/sessions/book', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId })
    });
  },

  getBookings() {
    return request<{ bookings: any[] }>('/sessions/bookings');
  },

  cancelBooking(bookingId: string) {
    return request<any>(`/sessions/bookings/${bookingId}/cancel`, {
      method: 'PATCH'
    });
  },

  // Messages
  getConversations() {
    return request<{ conversations: any[] }>('/messages/conversations');
  },

  getMessages(partnerId: string) {
    return request<{ partner: any; messages: any[] }>(`/messages/conversations/${partnerId}`);
  },

  sendMessage(receiver_id: string, content: string) {
    return request<any>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiver_id, content })
    });
  },

  // Opportunities
  getOpportunities(params: Record<string, string | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    return request<{ opportunities: any[]; total: number }>(`/opportunities?${query.toString()}`);
  },

  getOpportunity(id: string) {
    return request<{ opportunity: any }>(`/opportunities/${id}`);
  },

  createOpportunity(data: any) {
    return request<any>('/opportunities', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateOpportunity(id: string, data: any) {
    return request<any>(`/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  applyForOpportunity(opportunityId: string, data: { resume_url?: string; cover_letter?: string }) {
    return request<any>(`/opportunities/${opportunityId}/applications`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getOpportunityApplications(opportunityId: string) {
    return request<{ applications: any[] }>(`/opportunities/${opportunityId}/applications`);
  },

  getMyApplications() {
    return request<{ applications: any[] }>('/applications/me');
  },

  updateApplicationStatus(applicationId: string, status: string) {
    return request<any>(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Notifications
  getNotifications() {
    return request<{ notifications: any[]; unread_count: number }>('/notifications');
  },

  markNotificationRead(id: string) {
    return request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllNotificationsRead() {
    return request<any>('/notifications/mark-all-read', { method: 'POST' });
  },

  // Admin
  getAdminDashboard() {
    return request<any>('/admin/dashboard');
  },

  getAdminUsers() {
    return request<{ users: any[] }>('/admin/users');
  },

  updateUserStatus(userId: string, status: string) {
    return request<any>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  getPendingAlumniVerifications() {
    return request<{ pending_verifications: any[] }>('/admin/alumni-verifications');
  },

  reviewAlumniVerification(userId: string, decision: 'verified' | 'rejected', reason: string) {
    return request<any>(`/admin/alumni-verifications/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ decision, reason })
    });
  },

  createAlumniByAdmin(data: any) {
    return request<any>('/admin/alumni', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
