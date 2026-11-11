# Alumni Connect — University Alumni Mentorship & Networking Platform
**RV University, Bengaluru · Academic Full Stack Development (FSD) Project**

Alumni Connect is a full-stack web application developed by a student at **RV University, Bengaluru**. It connects current undergraduate students with university alumni for 1-on-1 mentorship, career advice, mock technical interviews, exclusive internship referrals, persistent direct messaging, and scheduling mentoring sessions.

---

## 1. Official Branding
The platform features the official **RV University crest and identity logo** across all public and authenticated pages, including:
- Top Navigation Bar (Header Brand Zone)
- Authentication screens (Login, Student Registration, Alumni Registration, Forgot Password)
- Mobile drawer navigation
- Dashboards and Footer

The visual design implements RV University's institutional palette:
- **Background**: Warm off-white (`#FAFAF9`)
- **Primary Typography**: Deep navy (`#172338`)
- **Secondary Details**: Muted slate (`#718096`)
- **Primary Brand Action**: Muted gold (`#D6AA61`), with hover (`#C19349`)
- **Cards**: Pure white (`#FFFFFF`) with subtle border lines (`#E2E8F0`)

---

## 2. Technology Stack

### Frontend:
- **React 19** + **TypeScript**
- **Vite** build system
- **Tailwind CSS v4**
- **Lucide React** icons
- **Zero-Pill Typography** & Accessible WCAG AA Contrast

### Backend:
- **Node.js** + **Express.js** + **TypeScript (`tsx`)**
- Versioned RESTful API (`/api/v1/...`)
- Server-side input validation and error handling
- Role-based authorization (`student`, `alumni`, `admin`)
- **Argon2id / Bcrypt** password hashing (10 salt rounds)
- HTTP-only cookie + Bearer token session authentication

### Database:
- **Serverless PostgreSQL** 
- Relational schema with foreign keys, unique constraints, and indexes
- Dual-mode connection capability

---

## 3. REST API Route Catalog (`/api/v1`)

### Authentication
- `POST /api/v1/auth/register/student` — Register new student with USN & department
- `POST /api/v1/auth/register/alumni` — Register new alumni (starts with `pending` verification status)
- `POST /api/v1/auth/login` — Sign in and issue HTTP-only cookie / session token
- `POST /api/v1/auth/logout` — Invalidate session and clear cookie
- `GET /api/v1/auth/me` — Retrieve active session and profile
- `POST /api/v1/auth/forgot-password` — Password assistance handler

### Student Profiles
- `GET /api/v1/students/me` — Current student profile
- `PATCH /api/v1/students/me` — Update academic details, skills, and bio

### Alumni Directory & Profiles
- `GET /api/v1/alumni` — Search alumni directory (filters: search, company, department, year, skill)
- `GET /api/v1/alumni/:id` — Detailed profile and available 1-on-1 slots
- `GET /api/v1/alumni/me` — Current alumni profile
- `PATCH /api/v1/alumni/me` — Update job title, company, bio, and LinkedIn URL

### Mentorship Workflows
- `POST /api/v1/mentorship/requests` — Submit mentorship inquiry (student only)
- `GET /api/v1/mentorship/requests` — View user's requests (student: sent; alumni: received)
- `PATCH /api/v1/mentorship/requests/:id/status` — Accept/reject (alumni) or cancel (student)

### Mentorship Sessions & Bookings
- `GET /api/v1/sessions` — List available or alumni-specific session slots
- `POST /api/v1/sessions` — Open new calendar slot with Google Meet link (alumni only)
- `POST /api/v1/sessions/book` — Book open slot with double-booking prevention (student only)
- `GET /api/v1/sessions/bookings` — View user's confirmed upcoming appointments
- `PATCH /api/v1/sessions/bookings/:id/cancel` — Cancel confirmed booking and reopen slot

### Peer Messaging
- `GET /api/v1/messages/conversations` — List active conversation threads
- `GET /api/v1/messages/conversations/:partnerId` — Message history between two users
- `POST /api/v1/messages` — Send direct message

### Opportunities & Applications
- `GET /api/v1/opportunities` — Browse verified internships, referrals, and jobs
- `GET /api/v1/opportunities/:id` — View opportunity details
- `POST /api/v1/opportunities` — Post new career opportunity (alumni/admin)
- `POST /api/v1/opportunities/:id/applications` — Submit internal application with cover note
- `GET /api/v1/opportunities/:id/applications` — Review applicants (opportunity poster)
- `GET /api/v1/applications/me` — Student application history
- `PATCH /api/v1/applications/:id/status` — Update application status (`under_review`, `shortlisted`, etc.)

### Administration & Governance
- `GET /api/v1/admin/dashboard` — Platform statistics (users, students, alumni, verifications, opportunities)
- `GET /api/v1/admin/users` — User directory with account status
- `PATCH /api/v1/admin/users/:id/status` — Suspend or activate user
- `GET /api/v1/admin/alumni-verifications` — Pending alumni verification queue
- `PATCH /api/v1/admin/alumni-verifications/:id` — Approve or reject alumni credentials with audit note

---

## 4. Project Team & Academic Credentials

- **Institution**: RV University, Bengaluru
- **School**: School of Computer Science & Engineering
- **Course**: Full Stack Development (FSD)
- **Academic Year**: 2026–2027
- **Status**: Production-Ready Full Stack Implementation
