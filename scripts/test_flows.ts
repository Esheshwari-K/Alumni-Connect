import { api } from '../src/services/api.ts';

const BASE_URL = 'http://localhost:3000/api/v1';

async function fetchJson(endpoint: string, options: any = {}) {
  const headers: any = { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting End-to-End Flow Verification Tests');
  console.log('====================================================\n');

  // 1. Health check
  const health = await fetchJson('/health');
  console.log('✅ Health Check Passed:', health.status, '| Database:', health.database);

  // 2. Student & Alumni Logins
  console.log('\n--- Test Phase 1: Authentication ---');
  const studentLogin = await fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@rvu.edu.in', password: 'Student@123' })
  });
  const studentToken = studentLogin.token;
  const studentId = studentLogin.user.id;
  console.log(`✅ Student Logged In: ${studentLogin.user.full_name} (${studentLogin.user.role})`);

  const alumniLogin = await fetchJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'ananya.sharma@alumni.rvu.edu.in', password: 'Alumni@123' })
  });
  const alumniToken = alumniLogin.token;
  const alumniId = alumniLogin.user.id;
  console.log(`✅ Alumni Logged In: ${alumniLogin.user.full_name} (${alumniLogin.user.role})`);

  // 3. Mentorship Flow
  console.log('\n--- Test Phase 2: Mentorship Flow ---');
  // Student sends request
  const requestRes = await fetchJson('/mentorship/requests', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      alumni_id: alumniId,
      message: 'Hello Ananya Maam! I would like guidance on system design and internship prep.',
      topics: ['System Design', 'Interview Prep']
    })
  });
  const requestId = requestRes.request.id;
  console.log(`✅ Student sent mentorship request [ID: ${requestId}]`);

  // Alumni checks requests
  const alumniRequests = await fetchJson('/mentorship/requests', {
    headers: { Authorization: `Bearer ${alumniToken}` }
  });
  const foundRequest = alumniRequests.requests.find((r: any) => r.id === requestId);
  if (!foundRequest) throw new Error('Mentorship request not found by alumni');
  console.log(`✅ Alumni received request from: ${foundRequest.student_name}`);

  // Alumni accepts request
  const acceptRes = await fetchJson(`/mentorship/requests/${requestId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({ status: 'accepted' })
  });
  console.log(`✅ Alumni accepted request: status is now "${acceptRes.request.status}"`);

  // Alumni creates a session slot
  const slotDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const sessionRes = await fetchJson('/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({
      title: 'E2E Mentorship Mock Interview',
      description: 'System design practice for distributed cache',
      scheduled_at: slotDate,
      duration_minutes: 45,
      meeting_link: 'https://meet.google.com/rvu-test-call'
    })
  });
  const sessionId = sessionRes.session.id;
  console.log(`✅ Alumni created session slot [ID: ${sessionId}]: "${sessionRes.session.title}"`);

  // Student books session
  const bookRes = await fetchJson('/sessions/book', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ session_id: sessionId })
  });
  const bookingId = bookRes.booking.id;
  console.log(`✅ Student booked session slot [Booking ID: ${bookingId}]`);

  // Verify booking visibility for both student and alumni
  const studentBookings = await fetchJson('/sessions/bookings', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const studentHasBooking = studentBookings.bookings.some((b: any) => b.id === bookingId);
  if (!studentHasBooking) throw new Error('Student cannot see their confirmed booking');
  console.log(`✅ Student can see confirmed booking in their calendar`);

  const alumniBookings = await fetchJson('/sessions/bookings', {
    headers: { Authorization: `Bearer ${alumniToken}` }
  });
  const alumniHasBooking = alumniBookings.bookings.some((b: any) => b.id === bookingId);
  if (!alumniHasBooking) throw new Error('Alumni cannot see the confirmed booking');
  console.log(`✅ Alumni can see confirmed booking in their schedule`);

  // Peer messaging
  const sendMsg = await fetchJson('/messages', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      receiver_id: alumniId,
      content: 'Thank you for accepting my request and confirming our mock interview!'
    })
  });
  console.log(`✅ Student sent message: "${sendMsg.data.content}"`);

  const msgHistory = await fetchJson(`/messages/conversations/${studentId}`, {
    headers: { Authorization: `Bearer ${alumniToken}` }
  });
  const lastMsg = msgHistory.messages[msgHistory.messages.length - 1];
  console.log(`✅ Alumni retrieved message thread successfully (total: ${msgHistory.messages.length} messages)`);

  // 4. Opportunities Flow
  console.log('\n--- Test Phase 3: Opportunities Flow ---');
  // Alumni posts opportunity
  const oppRes = await fetchJson('/opportunities', {
    method: 'POST',
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({
      title: 'Full Stack Research Engineer Intern (GenAI)',
      company: 'Google Research Bengaluru',
      location: 'Bengaluru, India (Hybrid)',
      opportunity_type: 'internship',
      description: 'Summer internship exploring LLM evaluation and multi-modal benchmarks.',
      required_skills: ['TypeScript', 'Python', 'React', 'PostgreSQL'],
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
    })
  });
  const oppId = oppRes.opportunity.id;
  console.log(`✅ Alumni posted opportunity [ID: ${oppId}]: "${oppRes.opportunity.title}"`);

  // Student applies
  const applyRes = await fetchJson(`/opportunities/${oppId}/applications`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({
      resume_url: 'https://drive.google.com/file/d/sample-student-resume',
      cover_letter: 'I have hands-on experience building full-stack web apps and studying database systems at RV University.'
    })
  });
  const appId = applyRes.application.id;
  console.log(`✅ Student applied for opportunity [Application ID: ${appId}]`);

  // Alumni reviews application
  const applicantsRes = await fetchJson(`/opportunities/${oppId}/applications`, {
    headers: { Authorization: `Bearer ${alumniToken}` }
  });
  const myApplicant = applicantsRes.applications.find((a: any) => a.id === appId);
  if (!myApplicant) throw new Error('Applicant not listed in opportunity applications');
  console.log(`✅ Alumni found applicant: ${myApplicant.student_name} (${myApplicant.student_email})`);

  // Alumni updates status to shortlisted
  await fetchJson(`/applications/${appId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${alumniToken}` },
    body: JSON.stringify({ status: 'shortlisted' })
  });
  console.log(`✅ Alumni updated application status to "shortlisted"`);

  // Student verifies updated status
  const studentApps = await fetchJson('/applications/me', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const updatedApp = studentApps.applications.find((a: any) => a.id === appId);
  if (updatedApp.status !== 'shortlisted') throw new Error('Application status mismatch');
  console.log(`✅ Student confirmed updated application status is "${updatedApp.status}"`);

  console.log('\n====================================================');
  console.log('🎉 ALL END-TO-END FLOW TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
