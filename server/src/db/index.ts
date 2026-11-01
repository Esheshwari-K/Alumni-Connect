import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  User,
  StudentProfile,
  AlumniProfile,
  MentorshipRequest,
  MentorshipSession,
  Booking,
  Message,
  Opportunity,
  Application,
  Notification,
  UserSettings
} from '../types/index.ts';

const { Pool } = pg;

export interface DBStore {
  users: User[];
  student_profiles: StudentProfile[];
  alumni_profiles: AlumniProfile[];
  admin_profiles: { id: string; user_id: string; created_at: string; updated_at: string }[];
  mentorship_requests: MentorshipRequest[];
  mentorship_sessions: MentorshipSession[];
  bookings: Booking[];
  messages: Message[];
  opportunities: Opportunity[];
  applications: Application[];
  notifications: Notification[];
  user_settings: UserSettings[];
  sessions: { id: string; user_id: string; expires_at: string; created_at: string }[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db_store.json');

let pool: pg.Pool | null = null;
let isPgConnected = false;

// In-memory store that syncs to .data/db_store.json
let memStore: DBStore = {
  users: [],
  student_profiles: [],
  alumni_profiles: [],
  admin_profiles: [],
  mentorship_requests: [],
  mentorship_sessions: [],
  bookings: [],
  messages: [],
  opportunities: [],
  applications: [],
  notifications: [],
  user_settings: [],
  sessions: []
};

function saveMemStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(memStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save persistent local store:', err);
  }
}

function loadMemStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      memStore = JSON.parse(data);
      console.log('Loaded persisted database store from .data/db_store.json');
      return true;
    }
  } catch (err) {
    console.warn('Could not read existing store file, initializing fresh store:', err);
  }
  return false;
}

export async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.trim() !== '' && !dbUrl.includes('MY_DATABASE_URL')) {
    try {
      console.log('Connecting to Neon PostgreSQL database...');
      pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
      });

      // Test connection
      const client = await pool.connect();
      console.log('Successfully connected to Neon PostgreSQL!');
      isPgConnected = true;

      // Run migrations
      const migrationPath = path.resolve(process.cwd(), 'migrations/001_initial_schema.sql');
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await client.query(sql);
        console.log('PostgreSQL schema migrations applied successfully.');
      }
      client.release();

      // Check if seeded
      const userCountRes = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCountRes.rows[0].count, 10) === 0) {
        console.log('PostgreSQL database is empty, running initial RV University seed data...');
        await seedDatabase();
      }
      return;
    } catch (err) {
      console.error('Neon PostgreSQL connection failed. Falling back to local persistent store.', err);
      pool = null;
      isPgConnected = false;
    }
  } else {
    console.log('No DATABASE_URL configured. Initializing embedded persistent SQL data store...');
  }

  const loaded = loadMemStore();
  if (!loaded || memStore.users.length === 0) {
    seedLocalStore();
  }
}

export function isUsingPostgres(): boolean {
  return isPgConnected && pool !== null;
}

export async function query(sql: string, params: any[] = []): Promise<any> {
  if (isPgConnected && pool) {
    return pool.query(sql, params);
  }
  return null;
}

export const db = {
  // User operations
  async getUserByEmail(email: string): Promise<User | null> {
    if (isPgConnected && pool) {
      const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
      return res.rows[0] || null;
    }
    const normalized = email.trim().toLowerCase();
    return memStore.users.find(u => u.email.toLowerCase() === normalized) || null;
  },

  async getUserById(id: string): Promise<User | null> {
    if (isPgConnected && pool) {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return memStore.users.find(u => u.id === id) || null;
  },

  async createUser(user: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      created_at: now,
      updated_at: now
    };

    if (isPgConnected && pool) {
      await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, account_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newUser.id, newUser.full_name, newUser.email, newUser.password_hash, newUser.role, newUser.account_status, now, now]
      );
    } else {
      memStore.users.push(newUser);
      saveMemStore();
    }
    return newUser;
  },

  async updateUserStatus(id: string, account_status: string): Promise<boolean> {
    const now = new Date().toISOString();
    if (isPgConnected && pool) {
      await pool.query('UPDATE users SET account_status = $1, updated_at = $2 WHERE id = $3', [account_status, now, id]);
      return true;
    }
    const u = memStore.users.find(user => user.id === id);
    if (u) {
      u.account_status = account_status as any;
      u.updated_at = now;
      saveMemStore();
      return true;
    }
    return false;
  },

  // Student Profile
  async getStudentProfile(userId: string): Promise<(StudentProfile & { full_name?: string; email?: string }) | null> {
    if (isPgConnected && pool) {
      const res = await pool.query(
        `SELECT sp.*, u.full_name, u.email 
         FROM student_profiles sp 
         JOIN users u ON sp.user_id = u.id 
         WHERE sp.user_id = $1`,
        [userId]
      );
      return res.rows[0] || null;
    }
    const profile = memStore.student_profiles.find(sp => sp.user_id === userId);
    if (!profile) return null;
    const user = memStore.users.find(u => u.id === userId);
    return {
      ...profile,
      full_name: user?.full_name,
      email: user?.email
    };
  },

  async upsertStudentProfile(profile: Partial<StudentProfile> & { user_id: string }): Promise<StudentProfile> {
    const now = new Date().toISOString();
    const existing = await this.getStudentProfile(profile.user_id);

    if (isPgConnected && pool) {
      if (existing) {
        await pool.query(
          `UPDATE student_profiles SET 
            usn = COALESCE($1, usn),
            programme = COALESCE($2, programme),
            department = COALESCE($3, department),
            semester_or_year = COALESCE($4, semester_or_year),
            skills = COALESCE($5, skills),
            interests = COALESCE($6, interests),
            bio = COALESCE($7, bio),
            updated_at = $8
           WHERE user_id = $9`,
          [
            profile.usn ?? null,
            profile.programme ?? null,
            profile.department ?? null,
            profile.semester_or_year ?? null,
            profile.skills ?? null,
            profile.interests ?? null,
            profile.bio ?? null,
            now,
            profile.user_id
          ]
        );
      } else {
        const id = profile.id || crypto.randomUUID();
        await pool.query(
          `INSERT INTO student_profiles (id, user_id, usn, programme, department, semester_or_year, skills, interests, bio, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id,
            profile.user_id,
            profile.usn || null,
            profile.programme || null,
            profile.department || null,
            profile.semester_or_year || null,
            profile.skills || null,
            profile.interests || null,
            profile.bio || null,
            now,
            now
          ]
        );
      }
      return (await this.getStudentProfile(profile.user_id))!;
    } else {
      let idx = memStore.student_profiles.findIndex(p => p.user_id === profile.user_id);
      if (idx >= 0) {
        memStore.student_profiles[idx] = {
          ...memStore.student_profiles[idx],
          ...profile,
          updated_at: now
        };
      } else {
        const newProf: StudentProfile = {
          id: profile.id || crypto.randomUUID(),
          user_id: profile.user_id,
          usn: profile.usn || null,
          programme: profile.programme || null,
          department: profile.department || null,
          semester_or_year: profile.semester_or_year || null,
          skills: profile.skills || null,
          interests: profile.interests || null,
          bio: profile.bio || null,
          created_at: now,
          updated_at: now
        };
        memStore.student_profiles.push(newProf);
      }
      saveMemStore();
      return (await this.getStudentProfile(profile.user_id))!;
    }
  },

  // Alumni Profile
  async getAlumniProfile(userId: string): Promise<(AlumniProfile & { full_name?: string; email?: string }) | null> {
    if (isPgConnected && pool) {
      const res = await pool.query(
        `SELECT ap.*, u.full_name, u.email 
         FROM alumni_profiles ap 
         JOIN users u ON ap.user_id = u.id 
         WHERE ap.user_id = $1`,
        [userId]
      );
      return res.rows[0] || null;
    }
    const profile = memStore.alumni_profiles.find(ap => ap.user_id === userId);
    if (!profile) return null;
    const user = memStore.users.find(u => u.id === userId);
    return {
      ...profile,
      full_name: user?.full_name,
      email: user?.email
    };
  },

  async upsertAlumniProfile(profile: Partial<AlumniProfile> & { user_id: string }): Promise<AlumniProfile> {
    const now = new Date().toISOString();
    const existing = await this.getAlumniProfile(profile.user_id);

    if (isPgConnected && pool) {
      if (existing) {
        await pool.query(
          `UPDATE alumni_profiles SET 
            headline = COALESCE($1, headline),
            company = COALESCE($2, company),
            job_title = COALESCE($3, job_title),
            graduation_year = COALESCE($4, graduation_year),
            department = COALESCE($5, department),
            skills = COALESCE($6, skills),
            bio = COALESCE($7, bio),
            linkedin_url = COALESCE($8, linkedin_url),
            verification_status = COALESCE($9, verification_status),
            verification_reason = COALESCE($10, verification_reason),
            verified_at = COALESCE($11, verified_at),
            updated_at = $12
           WHERE user_id = $13`,
          [
            profile.headline ?? null,
            profile.company ?? null,
            profile.job_title ?? null,
            profile.graduation_year ?? null,
            profile.department ?? null,
            profile.skills ?? null,
            profile.bio ?? null,
            profile.linkedin_url ?? null,
            profile.verification_status ?? null,
            profile.verification_reason ?? null,
            profile.verified_at ?? null,
            now,
            profile.user_id
          ]
        );
      } else {
        const id = profile.id || crypto.randomUUID();
        await pool.query(
          `INSERT INTO alumni_profiles (
            id, user_id, headline, company, job_title, graduation_year, department, skills, bio, linkedin_url, verification_status, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            id,
            profile.user_id,
            profile.headline || null,
            profile.company || null,
            profile.job_title || null,
            profile.graduation_year || null,
            profile.department || null,
            profile.skills || null,
            profile.bio || null,
            profile.linkedin_url || null,
            profile.verification_status || 'pending',
            now,
            now
          ]
        );
      }
      return (await this.getAlumniProfile(profile.user_id))!;
    } else {
      let idx = memStore.alumni_profiles.findIndex(p => p.user_id === profile.user_id);
      if (idx >= 0) {
        memStore.alumni_profiles[idx] = {
          ...memStore.alumni_profiles[idx],
          ...profile,
          updated_at: now
        };
      } else {
        const newProf: AlumniProfile = {
          id: profile.id || crypto.randomUUID(),
          user_id: profile.user_id,
          headline: profile.headline || null,
          company: profile.company || null,
          job_title: profile.job_title || null,
          graduation_year: profile.graduation_year || null,
          department: profile.department || null,
          skills: profile.skills || null,
          bio: profile.bio || null,
          linkedin_url: profile.linkedin_url || null,
          verification_status: profile.verification_status || 'pending',
          verification_reason: profile.verification_reason || null,
          verified_at: profile.verified_at || null,
          created_at: now,
          updated_at: now
        };
        memStore.alumni_profiles.push(newProf);
      }
      saveMemStore();
      return (await this.getAlumniProfile(profile.user_id))!;
    }
  },

  // Directory search
  async getAlumniDirectory(filter: {
    search?: string;
    company?: string;
    department?: string;
    graduation_year?: number;
    skill?: string;
  } = {}) {
    if (isPgConnected && pool) {
      let queryText = `
        SELECT ap.*, u.full_name, u.email 
        FROM alumni_profiles ap 
        JOIN users u ON ap.user_id = u.id 
        WHERE u.account_status = 'active'
      `;
      const queryParams: any[] = [];
      let pIdx = 1;

      if (filter.search) {
        queryText += ` AND (LOWER(u.full_name) LIKE $${pIdx} OR LOWER(ap.company) LIKE $${pIdx} OR LOWER(ap.job_title) LIKE $${pIdx} OR LOWER(ap.skills) LIKE $${pIdx})`;
        queryParams.push(`%${filter.search.toLowerCase()}%`);
        pIdx++;
      }
      if (filter.company) {
        queryText += ` AND LOWER(ap.company) LIKE $${pIdx}`;
        queryParams.push(`%${filter.company.toLowerCase()}%`);
        pIdx++;
      }
      if (filter.department) {
        queryText += ` AND LOWER(ap.department) = LOWER($${pIdx})`;
        queryParams.push(filter.department);
        pIdx++;
      }
      if (filter.graduation_year) {
        queryText += ` AND ap.graduation_year = $${pIdx}`;
        queryParams.push(filter.graduation_year);
        pIdx++;
      }
      if (filter.skill) {
        queryText += ` AND LOWER(ap.skills) LIKE $${pIdx}`;
        queryParams.push(`%${filter.skill.toLowerCase()}%`);
        pIdx++;
      }

      queryText += ' ORDER BY ap.verification_status = \'verified\' DESC, ap.created_at DESC';
      const res = await pool.query(queryText, queryParams);
      return res.rows;
    }

    let results = memStore.alumni_profiles.map(ap => {
      const u = memStore.users.find(user => user.id === ap.user_id);
      return {
        ...ap,
        full_name: u?.full_name || 'Alumni Member',
        email: u?.email || ''
      };
    });

    results = results.filter(r => {
      const u = memStore.users.find(user => user.id === r.user_id);
      if (u?.account_status !== 'active') return false;

      if (filter.search) {
        const s = filter.search.toLowerCase();
        const matchName = r.full_name.toLowerCase().includes(s);
        const matchComp = (r.company || '').toLowerCase().includes(s);
        const matchTitle = (r.job_title || '').toLowerCase().includes(s);
        const matchSkills = (r.skills || '').toLowerCase().includes(s);
        if (!matchName && !matchComp && !matchTitle && !matchSkills) return false;
      }
      if (filter.company && !(r.company || '').toLowerCase().includes(filter.company.toLowerCase())) {
        return false;
      }
      if (filter.department && (r.department || '').toLowerCase() !== filter.department.toLowerCase()) {
        return false;
      }
      if (filter.graduation_year && r.graduation_year !== filter.graduation_year) {
        return false;
      }
      if (filter.skill && !(r.skills || '').toLowerCase().includes(filter.skill.toLowerCase())) {
        return false;
      }
      return true;
    });

    // Sort verified first
    results.sort((a, b) => {
      if (a.verification_status === 'verified' && b.verification_status !== 'verified') return -1;
      if (a.verification_status !== 'verified' && b.verification_status === 'verified') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return results;
  },

  // Mentorship Requests
  async createMentorshipRequest(req: {
    student_id: string;
    alumni_id: string;
    message: string;
    topics?: string;
  }): Promise<MentorshipRequest> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const item: MentorshipRequest = {
      id,
      student_id: req.student_id,
      alumni_id: req.alumni_id,
      message: req.message,
      topics: req.topics || null,
      status: 'pending',
      created_at: now,
      updated_at: now
    };

    if (isPgConnected && pool) {
      await pool.query(
        `INSERT INTO mentorship_requests (id, student_id, alumni_id, message, topics, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, item.student_id, item.alumni_id, item.message, item.topics, item.status, now, now]
      );
    } else {
      memStore.mentorship_requests.push(item);
      saveMemStore();
    }

    // Create notification for alumni
    const student = await this.getUserById(req.student_id);
    await this.createNotification({
      user_id: req.alumni_id,
      title: 'New Mentorship Request',
      message: `${student?.full_name || 'A student'} has sent you a mentorship request.`,
      type: 'mentorship_request',
      related_entity_type: 'mentorship_request',
      related_entity_id: id
    });

    return item;
  },

  async getMentorshipRequestsForUser(userId: string, role: string) {
    if (isPgConnected && pool) {
      const isStudent = role === 'student';
      const col = isStudent ? 'mr.student_id' : 'mr.alumni_id';
      const res = await pool.query(
        `SELECT mr.*, 
                su.full_name as student_name, su.email as student_email,
                sp.department as student_department, sp.programme as student_programme,
                au.full_name as alumni_name,
                ap.company as alumni_company, ap.job_title as alumni_job_title
         FROM mentorship_requests mr
         JOIN users su ON mr.student_id = su.id
         LEFT JOIN student_profiles sp ON sp.user_id = su.id
         JOIN users au ON mr.alumni_id = au.id
         LEFT JOIN alumni_profiles ap ON ap.user_id = au.id
         WHERE ${col} = $1
         ORDER BY mr.created_at DESC`,
        [userId]
      );
      return res.rows;
    }

    const list = memStore.mentorship_requests.filter(r =>
      role === 'student' ? r.student_id === userId : r.alumni_id === userId
    );

    return list.map(mr => {
      const stuUser = memStore.users.find(u => u.id === mr.student_id);
      const stuProf = memStore.student_profiles.find(sp => sp.user_id === mr.student_id);
      const almUser = memStore.users.find(u => u.id === mr.alumni_id);
      const almProf = memStore.alumni_profiles.find(ap => ap.user_id === mr.alumni_id);

      return {
        ...mr,
        student_name: stuUser?.full_name,
        student_email: stuUser?.email,
        student_department: stuProf?.department,
        student_programme: stuProf?.programme,
        alumni_name: almUser?.full_name,
        alumni_company: almProf?.company,
        alumni_job_title: almProf?.job_title
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async updateMentorshipRequestStatus(id: string, status: 'accepted' | 'rejected' | 'cancelled', actorId: string): Promise<MentorshipRequest | null> {
    const now = new Date().toISOString();

    if (isPgConnected && pool) {
      const getRes = await pool.query('SELECT * FROM mentorship_requests WHERE id = $1', [id]);
      const current = getRes.rows[0];
      if (!current) return null;

      // Validate actor
      if (status === 'cancelled' && current.student_id !== actorId) return null;
      if ((status === 'accepted' || status === 'rejected') && current.alumni_id !== actorId) return null;

      await pool.query('UPDATE mentorship_requests SET status = $1, updated_at = $2 WHERE id = $3', [status, now, id]);

      // Notify student
      const alm = await this.getUserById(current.alumni_id);
      await this.createNotification({
        user_id: current.student_id,
        title: `Mentorship Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `${alm?.full_name || 'The mentor'} has ${status} your mentorship request.`,
        type: 'mentorship_status',
        related_entity_type: 'mentorship_request',
        related_entity_id: id
      });

      const updated = await pool.query('SELECT * FROM mentorship_requests WHERE id = $1', [id]);
      return updated.rows[0];
    }

    const mr = memStore.mentorship_requests.find(r => r.id === id);
    if (!mr) return null;

    if (status === 'cancelled' && mr.student_id !== actorId) return null;
    if ((status === 'accepted' || status === 'rejected') && mr.alumni_id !== actorId) return null;

    mr.status = status;
    mr.updated_at = now;
    saveMemStore();

    // Notify student
    const alm = memStore.users.find(u => u.id === mr.alumni_id);
    await this.createNotification({
      user_id: mr.student_id,
      title: `Mentorship Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `${alm?.full_name || 'The mentor'} has ${status} your mentorship request.`,
      type: 'mentorship_status',
      related_entity_type: 'mentorship_request',
      related_entity_id: id
    });

    return mr;
  },

  // Sessions and Bookings
  async createMentorshipSession(session: {
    alumni_id: string;
    title: string;
    description?: string;
    scheduled_at: string;
    duration_minutes?: number;
    meeting_link?: string;
  }): Promise<MentorshipSession> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const item: MentorshipSession = {
      id,
      alumni_id: session.alumni_id,
      title: session.title,
      description: session.description || null,
      scheduled_at: session.scheduled_at,
      duration_minutes: session.duration_minutes || 45,
      meeting_link: session.meeting_link || null,
      status: 'available',
      created_at: now,
      updated_at: now
    };

    if (isPgConnected && pool) {
      await pool.query(
        `INSERT INTO mentorship_sessions (id, alumni_id, title, description, scheduled_at, duration_minutes, meeting_link, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, item.alumni_id, item.title, item.description, item.scheduled_at, item.duration_minutes, item.meeting_link, item.status, now, now]
      );
    } else {
      memStore.mentorship_sessions.push(item);
      saveMemStore();
    }
    return item;
  },

  async getSessions(alumniId?: string) {
    if (isPgConnected && pool) {
      let q = `
        SELECT ms.*, u.full_name as alumni_name, ap.company as alumni_company, ap.job_title as alumni_job_title
        FROM mentorship_sessions ms
        JOIN users u ON ms.alumni_id = u.id
        LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
      `;
      const params: any[] = [];
      if (alumniId) {
        q += ' WHERE ms.alumni_id = $1';
        params.push(alumniId);
      }
      q += ' ORDER BY ms.scheduled_at ASC';
      const res = await pool.query(q, params);
      return res.rows;
    }

    let list = memStore.mentorship_sessions;
    if (alumniId) {
      list = list.filter(s => s.alumni_id === alumniId);
    }
    return list.map(ms => {
      const u = memStore.users.find(user => user.id === ms.alumni_id);
      const ap = memStore.alumni_profiles.find(p => p.user_id === ms.alumni_id);
      return {
        ...ms,
        alumni_name: u?.full_name,
        alumni_company: ap?.company,
        alumni_job_title: ap?.job_title
      };
    }).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  },

  async bookSession(sessionId: string, studentId: string): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const now = new Date().toISOString();

    if (isPgConnected && pool) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const sessionRes = await client.query('SELECT * FROM mentorship_sessions WHERE id = $1 FOR UPDATE', [sessionId]);
        const session = sessionRes.rows[0];

        if (!session) {
          await client.query('ROLLBACK');
          return { success: false, error: 'Session not found' };
        }
        if (session.status !== 'available') {
          await client.query('ROLLBACK');
          return { success: false, error: 'Session is no longer available' };
        }

        // Check if student already booked this session
        const existingBooking = await client.query(
          'SELECT * FROM bookings WHERE session_id = $1 AND student_id = $2 AND status = \'confirmed\'',
          [sessionId, studentId]
        );
        if (existingBooking.rows.length > 0) {
          await client.query('ROLLBACK');
          return { success: false, error: 'You have already booked this session' };
        }

        const bookingId = crypto.randomUUID();
        await client.query(
          `INSERT INTO bookings (id, session_id, student_id, alumni_id, scheduled_at, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [bookingId, sessionId, studentId, session.alumni_id, session.scheduled_at, 'confirmed', now, now]
        );

        await client.query('UPDATE mentorship_sessions SET status = \'booked\', updated_at = $1 WHERE id = $2', [now, sessionId]);
        await client.query('COMMIT');

        const student = await this.getUserById(studentId);
        await this.createNotification({
          user_id: session.alumni_id,
          title: 'Session Booked',
          message: `${student?.full_name || 'A student'} booked your session "${session.title}".`,
          type: 'booking',
          related_entity_type: 'booking',
          related_entity_id: bookingId
        });

        const bRes = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
        return { success: true, booking: bRes.rows[0] };
      } catch (err: any) {
        await client.query('ROLLBACK');
        return { success: false, error: err.message || 'Booking failed' };
      } finally {
        client.release();
      }
    }

    const session = memStore.mentorship_sessions.find(s => s.id === sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    if (session.status !== 'available') {
      return { success: false, error: 'Session is no longer available' };
    }

    const existing = memStore.bookings.find(
      b => b.session_id === sessionId && b.student_id === studentId && b.status === 'confirmed'
    );
    if (existing) {
      return { success: false, error: 'You have already booked this session' };
    }

    session.status = 'booked';
    session.updated_at = now;

    const bookingId = crypto.randomUUID();
    const newBooking: Booking = {
      id: bookingId,
      session_id: sessionId,
      student_id: studentId,
      alumni_id: session.alumni_id,
      scheduled_at: session.scheduled_at,
      status: 'confirmed',
      created_at: now,
      updated_at: now
    };
    memStore.bookings.push(newBooking);
    saveMemStore();

    const student = memStore.users.find(u => u.id === studentId);
    await this.createNotification({
      user_id: session.alumni_id,
      title: 'Session Booked',
      message: `${student?.full_name || 'A student'} booked your session "${session.title}".`,
      type: 'booking',
      related_entity_type: 'booking',
      related_entity_id: bookingId
    });

    return { success: true, booking: newBooking };
  },

  async getBookingsForUser(userId: string, role: string) {
    if (isPgConnected && pool) {
      const col = role === 'student' ? 'b.student_id' : 'b.alumni_id';
      const res = await pool.query(
        `SELECT b.*, 
                ms.title as session_title, ms.meeting_link, ms.duration_minutes,
                su.full_name as student_name, su.email as student_email,
                au.full_name as alumni_name,
                ap.company as alumni_company, ap.job_title as alumni_job_title
         FROM bookings b
         JOIN mentorship_sessions ms ON b.session_id = ms.id
         JOIN users su ON b.student_id = su.id
         JOIN users au ON b.alumni_id = au.id
         LEFT JOIN alumni_profiles ap ON ap.user_id = au.id
         WHERE ${col} = $1
         ORDER BY b.scheduled_at DESC`,
        [userId]
      );
      return res.rows;
    }

    const list = memStore.bookings.filter(b => (role === 'student' ? b.student_id === userId : b.alumni_id === userId));

    return list.map(b => {
      const ms = memStore.mentorship_sessions.find(s => s.id === b.session_id);
      const stu = memStore.users.find(u => u.id === b.student_id);
      const alm = memStore.users.find(u => u.id === b.alumni_id);
      const ap = memStore.alumni_profiles.find(p => p.user_id === b.alumni_id);

      return {
        ...b,
        session_title: ms?.title,
        meeting_link: ms?.meeting_link || undefined,
        duration_minutes: ms?.duration_minutes,
        student_name: stu?.full_name,
        student_email: stu?.email,
        alumni_name: alm?.full_name,
        alumni_company: ap?.company,
        alumni_job_title: ap?.job_title
      };
    }).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
  },

  async cancelBooking(bookingId: string, actorId: string): Promise<boolean> {
    const now = new Date().toISOString();

    if (isPgConnected && pool) {
      const bRes = await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
      const b = bRes.rows[0];
      if (!b) return false;
      if (b.student_id !== actorId && b.alumni_id !== actorId) return false;

      await pool.query('UPDATE bookings SET status = \'cancelled\', updated_at = $1 WHERE id = $2', [now, bookingId]);
      await pool.query('UPDATE mentorship_sessions SET status = \'available\', updated_at = $1 WHERE id = $2', [now, b.session_id]);
      return true;
    }

    const b = memStore.bookings.find(bk => bk.id === bookingId);
    if (!b) return false;
    if (b.student_id !== actorId && b.alumni_id !== actorId) return false;

    b.status = 'cancelled';
    b.updated_at = now;

    const ms = memStore.mentorship_sessions.find(s => s.id === b.session_id);
    if (ms) {
      ms.status = 'available';
      ms.updated_at = now;
    }
    saveMemStore();
    return true;
  },

  // Messaging
  async getConversations(userId: string) {
    if (isPgConnected && pool) {
      const res = await pool.query(
        `SELECT DISTINCT ON (partner_id)
                partner_id,
                partner_name,
                partner_role,
                content as last_message,
                created_at as last_message_time,
                is_read
         FROM (
           SELECT 
             CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as partner_id,
             u.full_name as partner_name,
             u.role as partner_role,
             m.content,
             m.created_at,
             m.is_read
           FROM messages m
           JOIN users u ON (CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END) = u.id
           WHERE m.sender_id = $1 OR m.receiver_id = $1
           ORDER BY m.created_at DESC
         ) sub
         ORDER BY partner_id, last_message_time DESC`,
        [userId]
      );
      return res.rows;
    }

    const partnerMap = new Map<string, any>();
    const userMsgs = memStore.messages.filter(m => m.sender_id === userId || m.receiver_id === userId);
    userMsgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    for (const msg of userMsgs) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      if (!partnerMap.has(partnerId)) {
        const pUser = memStore.users.find(u => u.id === partnerId);
        partnerMap.set(partnerId, {
          partner_id: partnerId,
          partner_name: pUser?.full_name || 'Member',
          partner_role: pUser?.role || 'user',
          last_message: msg.content,
          last_message_time: msg.created_at,
          is_read: msg.is_read
        });
      }
    }
    return Array.from(partnerMap.values());
  },

  async getMessagesBetween(userId1: string, userId2: string) {
    if (isPgConnected && pool) {
      // Mark as read
      await pool.query(
        'UPDATE messages SET is_read = TRUE WHERE receiver_id = $1 AND sender_id = $2',
        [userId1, userId2]
      );

      const res = await pool.query(
        `SELECT m.*, su.full_name as sender_name, ru.full_name as receiver_name
         FROM messages m
         JOIN users su ON m.sender_id = su.id
         JOIN users ru ON m.receiver_id = ru.id
         WHERE (m.sender_id = $1 AND m.receiver_id = $2)
            OR (m.sender_id = $2 AND m.receiver_id = $1)
         ORDER BY m.created_at ASC`,
        [userId1, userId2]
      );
      return res.rows;
    }

    // Mark as read
    memStore.messages.forEach(m => {
      if (m.receiver_id === userId1 && m.sender_id === userId2) {
        m.is_read = true;
      }
    });
    saveMemStore();

    const pair = memStore.messages.filter(
      m =>
        (m.sender_id === userId1 && m.receiver_id === userId2) ||
        (m.sender_id === userId2 && m.receiver_id === userId1)
    );

    return pair.map(m => {
      const su = memStore.users.find(u => u.id === m.sender_id);
      const ru = memStore.users.find(u => u.id === m.receiver_id);
      return {
        ...m,
        sender_name: su?.full_name,
        receiver_name: ru?.full_name
      };
    }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const msg: Message = {
      id,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      is_read: false,
      created_at: now
    };

    if (isPgConnected && pool) {
      await pool.query(
        `INSERT INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, senderId, receiverId, content, false, now]
      );
    } else {
      memStore.messages.push(msg);
      saveMemStore();
    }

    const sender = await this.getUserById(senderId);
    await this.createNotification({
      user_id: receiverId,
      title: 'New Message',
      message: `${sender?.full_name || 'A user'} sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
      type: 'message',
      related_entity_type: 'user',
      related_entity_id: senderId
    });

    return msg;
  },

  // Opportunities
  async getOpportunities(filter: { search?: string; type?: string; status?: string } = {}) {
    if (isPgConnected && pool) {
      let q = `
        SELECT o.*, u.full_name as poster_name, ap.company as poster_company
        FROM opportunities o
        JOIN users u ON o.posted_by = u.id
        LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;

      if (filter.status) {
        q += ` AND o.status = $${idx}`;
        params.push(filter.status);
        idx++;
      } else {
        q += ' AND o.status = \'active\'';
      }

      if (filter.type) {
        q += ` AND o.opportunity_type = $${idx}`;
        params.push(filter.type);
        idx++;
      }

      if (filter.search) {
        q += ` AND (LOWER(o.title) LIKE $${idx} OR LOWER(o.company) LIKE $${idx} OR LOWER(o.description) LIKE $${idx} OR LOWER(o.required_skills) LIKE $${idx})`;
        params.push(`%${filter.search.toLowerCase()}%`);
        idx++;
      }

      q += ' ORDER BY o.created_at DESC';
      const res = await pool.query(q, params);
      return res.rows;
    }

    let list = memStore.opportunities;
    if (filter.status) {
      list = list.filter(o => o.status === filter.status);
    } else {
      list = list.filter(o => o.status === 'active');
    }

    if (filter.type) {
      list = list.filter(o => o.opportunity_type === filter.type);
    }

    if (filter.search) {
      const s = filter.search.toLowerCase();
      list = list.filter(
        o =>
          o.title.toLowerCase().includes(s) ||
          o.company.toLowerCase().includes(s) ||
          o.description.toLowerCase().includes(s) ||
          (o.required_skills || '').toLowerCase().includes(s)
      );
    }

    return list.map(o => {
      const u = memStore.users.find(user => user.id === o.posted_by);
      const ap = memStore.alumni_profiles.find(p => p.user_id === o.posted_by);
      return {
        ...o,
        poster_name: u?.full_name,
        poster_company: ap?.company
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getOpportunityById(id: string) {
    if (isPgConnected && pool) {
      const res = await pool.query(
        `SELECT o.*, u.full_name as poster_name, ap.company as poster_company
         FROM opportunities o
         JOIN users u ON o.posted_by = u.id
         LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
         WHERE o.id = $1`,
        [id]
      );
      return res.rows[0] || null;
    }

    const o = memStore.opportunities.find(item => item.id === id);
    if (!o) return null;
    const u = memStore.users.find(user => user.id === o.posted_by);
    const ap = memStore.alumni_profiles.find(p => p.user_id === o.posted_by);
    return {
      ...o,
      poster_name: u?.full_name,
      poster_company: ap?.company
    };
  },

  async createOpportunity(data: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const opp: Opportunity = {
      ...data,
      id,
      created_at: now,
      updated_at: now
    };

    if (isPgConnected && pool) {
      await pool.query(
        `INSERT INTO opportunities (id, posted_by, title, description, opportunity_type, company, location, required_skills, application_url, deadline, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          opp.posted_by,
          opp.title,
          opp.description,
          opp.opportunity_type,
          opp.company,
          opp.location,
          opp.required_skills,
          opp.application_url,
          opp.deadline,
          opp.status,
          now,
          now
        ]
      );
    } else {
      memStore.opportunities.push(opp);
      saveMemStore();
    }
    return opp;
  },

  async updateOpportunity(id: string, data: Partial<Opportunity>, actorId: string, isAdmin = false): Promise<Opportunity | null> {
    const now = new Date().toISOString();

    if (isPgConnected && pool) {
      const curRes = await pool.query('SELECT * FROM opportunities WHERE id = $1', [id]);
      const cur = curRes.rows[0];
      if (!cur) return null;
      if (!isAdmin && cur.posted_by !== actorId) return null;

      await pool.query(
        `UPDATE opportunities SET 
          title = COALESCE($1, title),
          description = COALESCE($2, description),
          opportunity_type = COALESCE($3, opportunity_type),
          company = COALESCE($4, company),
          location = COALESCE($5, location),
          required_skills = COALESCE($6, required_skills),
          application_url = COALESCE($7, application_url),
          deadline = COALESCE($8, deadline),
          status = COALESCE($9, status),
          updated_at = $10
         WHERE id = $11`,
        [
          data.title ?? null,
          data.description ?? null,
          data.opportunity_type ?? null,
          data.company ?? null,
          data.location ?? null,
          data.required_skills ?? null,
          data.application_url ?? null,
          data.deadline ?? null,
          data.status ?? null,
          now,
          id
        ]
      );
      const res = await pool.query('SELECT * FROM opportunities WHERE id = $1', [id]);
      return res.rows[0];
    }

    const cur = memStore.opportunities.find(o => o.id === id);
    if (!cur) return null;
    if (!isAdmin && cur.posted_by !== actorId) return null;

    Object.assign(cur, data, { updated_at: now });
    saveMemStore();
    return cur;
  },

  // Applications
  async createApplication(data: {
    opportunity_id: string;
    student_id: string;
    resume_url?: string;
    cover_letter?: string;
  }): Promise<{ success: boolean; application?: Application; error?: string }> {
    const now = new Date().toISOString();

    if (isPgConnected && pool) {
      // Check existing application
      const exist = await pool.query(
        'SELECT * FROM applications WHERE opportunity_id = $1 AND student_id = $2',
        [data.opportunity_id, data.student_id]
      );
      if (exist.rows.length > 0) {
        return { success: false, error: 'You have already applied for this opportunity' };
      }

      const id = crypto.randomUUID();
      await pool.query(
        `INSERT INTO applications (id, opportunity_id, student_id, resume_url, cover_letter, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, data.opportunity_id, data.student_id, data.resume_url || null, data.cover_letter || null, 'submitted', now, now]
      );

      // Notify poster
      const opp = await this.getOpportunityById(data.opportunity_id);
      const stu = await this.getUserById(data.student_id);
      if (opp) {
        await this.createNotification({
          user_id: opp.posted_by,
          title: 'New Application Received',
          message: `${stu?.full_name || 'A student'} applied for your opportunity "${opp.title}".`,
          type: 'application',
          related_entity_type: 'application',
          related_entity_id: id
        });
      }

      const res = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
      return { success: true, application: res.rows[0] };
    }

    const exist = memStore.applications.find(
      a => a.opportunity_id === data.opportunity_id && a.student_id === data.student_id
    );
    if (exist) {
      return { success: false, error: 'You have already applied for this opportunity' };
    }

    const id = crypto.randomUUID();
    const app: Application = {
      id,
      opportunity_id: data.opportunity_id,
      student_id: data.student_id,
      resume_url: data.resume_url || null,
      cover_letter: data.cover_letter || null,
      status: 'submitted',
      created_at: now,
      updated_at: now
    };
    memStore.applications.push(app);
    saveMemStore();

    const opp = memStore.opportunities.find(o => o.id === data.opportunity_id);
    const stu = memStore.users.find(u => u.id === data.student_id);
    if (opp) {
      await this.createNotification({
        user_id: opp.posted_by,
        title: 'New Application Received',
        message: `${stu?.full_name || 'A student'} applied for your opportunity "${opp.title}".`,
        type: 'application',
        related_entity_type: 'application',
        related_entity_id: id
      });
    }

    return { success: true, application: app };
  },

  async getApplicationsForStudent(studentId: string) {
    if (isPgConnected && pool) {
      const res = await pool.query(
        `SELECT a.*, o.title as opportunity_title, o.company as opportunity_company, o.location as opportunity_location
         FROM applications a
         JOIN opportunities o ON a.opportunity_id = o.id
         WHERE a.student_id = $1
         ORDER BY a.created_at DESC`,
        [studentId]
      );
      return res.rows;
    }

    return memStore.applications
      .filter(a => a.student_id === studentId)
      .map(a => {
        const opp = memStore.opportunities.find(o => o.id === a.opportunity_id);
        return {
          ...a,
          opportunity_title: opp?.title,
          opportunity_company: opp?.company,
          opportunity_location: opp?.location
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getApplicationsForOpportunity(opportunityId: string, alumniId: string) {
    if (isPgConnected && pool) {
      const oppRes = await pool.query('SELECT * FROM opportunities WHERE id = $1', [opportunityId]);
      const opp = oppRes.rows[0];
      if (!opp || opp.posted_by !== alumniId) return [];

      const res = await pool.query(
        `SELECT a.*, u.full_name as student_name, u.email as student_email,
                sp.programme as student_programme, sp.department as student_department
         FROM applications a
         JOIN users u ON a.student_id = u.id
         LEFT JOIN student_profiles sp ON sp.user_id = u.id
         WHERE a.opportunity_id = $1
         ORDER BY a.created_at DESC`,
        [opportunityId]
      );
      return res.rows;
    }

    const opp = memStore.opportunities.find(o => o.id === opportunityId);
    if (!opp || opp.posted_by !== alumniId) return [];

    return memStore.applications
      .filter(a => a.opportunity_id === opportunityId)
      .map(a => {
        const u = memStore.users.find(user => user.id === a.student_id);
        const sp = memStore.student_profiles.find(p => p.user_id === a.student_id);
        return {
          ...a,
          student_name: u?.full_name,
          student_email: u?.email,
          student_programme: sp?.programme,
          student_department: sp?.department
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async updateApplicationStatus(applicationId: string, status: string, alumniId: string): Promise<boolean> {
    const now = new Date().toISOString();

    if (isPgConnected && pool) {
      const aRes = await pool.query(
        `SELECT a.*, o.posted_by, o.title as opp_title
         FROM applications a
         JOIN opportunities o ON a.opportunity_id = o.id
         WHERE a.id = $1`,
        [applicationId]
      );
      const app = aRes.rows[0];
      if (!app || app.posted_by !== alumniId) return false;

      await pool.query('UPDATE applications SET status = $1, updated_at = $2 WHERE id = $3', [status, now, applicationId]);

      await this.createNotification({
        user_id: app.student_id,
        title: 'Application Status Updated',
        message: `Your application status for "${app.opp_title}" is now "${status.replace('_', ' ')}".`,
        type: 'application_status',
        related_entity_type: 'application',
        related_entity_id: applicationId
      });
      return true;
    }

    const app = memStore.applications.find(a => a.id === applicationId);
    if (!app) return false;
    const opp = memStore.opportunities.find(o => o.id === app.opportunity_id);
    if (!opp || opp.posted_by !== alumniId) return false;

    app.status = status as any;
    app.updated_at = now;
    saveMemStore();

    await this.createNotification({
      user_id: app.student_id,
      title: 'Application Status Updated',
      message: `Your application status for "${opp.title}" is now "${status.replace('_', ' ')}".`,
      type: 'application_status',
      related_entity_type: 'application',
      related_entity_id: applicationId
    });
    return true;
  },

  // Notifications
  async createNotification(data: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const notif: Notification = {
      ...data,
      id,
      is_read: false,
      created_at: now
    };

    if (isPgConnected && pool) {
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [id, notif.user_id, notif.title, notif.message, notif.type, notif.related_entity_type, notif.related_entity_id, false, now]
      );
    } else {
      memStore.notifications.push(notif);
      saveMemStore();
    }
    return notif;
  },

  async getNotifications(userId: string) {
    if (isPgConnected && pool) {
      const res = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]);
      return res.rows;
    }
    return memStore.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
  },

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    if (isPgConnected && pool) {
      await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [id, userId]);
      return true;
    }
    const n = memStore.notifications.find(item => item.id === id && item.user_id === userId);
    if (n) {
      n.is_read = true;
      saveMemStore();
      return true;
    }
    return false;
  },

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    if (isPgConnected && pool) {
      await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
      return true;
    }
    memStore.notifications.forEach(n => {
      if (n.user_id === userId) n.is_read = true;
    });
    saveMemStore();
    return true;
  },

  // Sessions table for Auth tokens
  async createSession(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    if (isPgConnected && pool) {
      await pool.query(
        'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)',
        [token, userId, expiresAt, new Date().toISOString()]
      );
    } else {
      memStore.sessions.push({
        id: token,
        user_id: userId,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      });
      saveMemStore();
    }
    return token;
  },

  async getSession(token: string): Promise<{ user_id: string; expires_at: string } | null> {
    if (isPgConnected && pool) {
      const res = await pool.query('SELECT * FROM sessions WHERE id = $1', [token]);
      const session = res.rows[0];
      if (!session) return null;
      if (new Date(session.expires_at) < new Date()) {
        await pool.query('DELETE FROM sessions WHERE id = $1', [token]);
        return null;
      }
      return session;
    }

    const s = memStore.sessions.find(item => item.id === token);
    if (!s) return null;
    if (new Date(s.expires_at) < new Date()) {
      memStore.sessions = memStore.sessions.filter(item => item.id !== token);
      saveMemStore();
      return null;
    }
    return s;
  },

  async deleteSession(token: string): Promise<void> {
    if (isPgConnected && pool) {
      await pool.query('DELETE FROM sessions WHERE id = $1', [token]);
    } else {
      memStore.sessions = memStore.sessions.filter(item => item.id !== token);
      saveMemStore();
    }
  },

  // Admin Dashboard stats & user management
  async getAdminStats() {
    if (isPgConnected && pool) {
      const [uRes, stuRes, almRes, verAlmRes, pendAlmRes, oppRes, reqRes] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM users'),
        pool.query('SELECT COUNT(*) FROM users WHERE role = \'student\''),
        pool.query('SELECT COUNT(*) FROM users WHERE role = \'alumni\''),
        pool.query('SELECT COUNT(*) FROM alumni_profiles WHERE verification_status = \'verified\''),
        pool.query('SELECT COUNT(*) FROM alumni_profiles WHERE verification_status = \'pending\''),
        pool.query('SELECT COUNT(*) FROM opportunities WHERE status = \'active\''),
        pool.query('SELECT COUNT(*) FROM mentorship_requests')
      ]);

      const recentActivity = await pool.query(
        `SELECT 'user' as type, full_name as title, role as description, created_at FROM users 
         ORDER BY created_at DESC LIMIT 5`
      );

      return {
        total_users: parseInt(uRes.rows[0].count, 10),
        students: parseInt(stuRes.rows[0].count, 10),
        alumni: parseInt(almRes.rows[0].count, 10),
        verified_alumni: parseInt(verAlmRes.rows[0].count, 10),
        pending_verifications: parseInt(pendAlmRes.rows[0].count, 10),
        active_opportunities: parseInt(oppRes.rows[0].count, 10),
        total_mentorship_requests: parseInt(reqRes.rows[0].count, 10),
        recent_activity: recentActivity.rows
      };
    }

    return {
      total_users: memStore.users.length,
      students: memStore.users.filter(u => u.role === 'student').length,
      alumni: memStore.users.filter(u => u.role === 'alumni').length,
      verified_alumni: memStore.alumni_profiles.filter(p => p.verification_status === 'verified').length,
      pending_verifications: memStore.alumni_profiles.filter(p => p.verification_status === 'pending').length,
      active_opportunities: memStore.opportunities.filter(o => o.status === 'active').length,
      total_mentorship_requests: memStore.mentorship_requests.length,
      recent_activity: memStore.users.slice(-5).reverse().map(u => ({
        type: 'user',
        title: u.full_name,
        description: `${u.role.toUpperCase()} account created`,
        created_at: u.created_at
      }))
    };
  },

  async getAllUsers() {
    if (isPgConnected && pool) {
      const res = await pool.query(`
        SELECT u.id, u.full_name, u.email, u.role, u.account_status, u.created_at,
               ap.verification_status, ap.company, ap.job_title,
               sp.programme, sp.department, sp.usn
        FROM users u
        LEFT JOIN alumni_profiles ap ON ap.user_id = u.id
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        ORDER BY u.created_at DESC
      `);
      return res.rows;
    }

    return memStore.users.map(u => {
      const ap = memStore.alumni_profiles.find(p => p.user_id === u.id);
      const sp = memStore.student_profiles.find(p => p.user_id === u.id);
      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        account_status: u.account_status,
        created_at: u.created_at,
        verification_status: ap?.verification_status,
        company: ap?.company,
        job_title: ap?.job_title,
        programme: sp?.programme,
        department: sp?.department,
        usn: sp?.usn
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getPendingAlumniVerifications() {
    if (isPgConnected && pool) {
      const res = await pool.query(`
        SELECT ap.*, u.full_name, u.email, u.created_at as user_created_at
        FROM alumni_profiles ap
        JOIN users u ON ap.user_id = u.id
        WHERE ap.verification_status = 'pending'
        ORDER BY ap.created_at ASC
      `);
      return res.rows;
    }

    return memStore.alumni_profiles
      .filter(p => p.verification_status === 'pending')
      .map(ap => {
        const u = memStore.users.find(user => user.id === ap.user_id);
        return {
          ...ap,
          full_name: u?.full_name,
          email: u?.email,
          user_created_at: u?.created_at
        };
      });
  },

  async reviewAlumniVerification(userId: string, decision: 'verified' | 'rejected', reason: string) {
    const now = new Date().toISOString();

    if (isPgConnected && pool) {
      await pool.query(
        `UPDATE alumni_profiles SET 
          verification_status = $1,
          verification_reason = $2,
          verified_at = $3,
          updated_at = $4
         WHERE user_id = $5`,
        [decision, reason || null, decision === 'verified' ? now : null, now, userId]
      );

      await this.createNotification({
        user_id: userId,
        title: `Alumni Verification ${decision === 'verified' ? 'Approved' : 'Declined'}`,
        message: decision === 'verified' 
          ? 'Your RV University Alumni profile has been verified by the administrator.' 
          : `Your verification request was declined: ${reason}`,
        type: 'verification',
        related_entity_type: 'user',
        related_entity_id: userId
      });
      return true;
    }

    const ap = memStore.alumni_profiles.find(p => p.user_id === userId);
    if (!ap) return false;

    ap.verification_status = decision;
    ap.verification_reason = reason;
    ap.verified_at = decision === 'verified' ? now : null;
    ap.updated_at = now;
    saveMemStore();

    await this.createNotification({
      user_id: userId,
      title: `Alumni Verification ${decision === 'verified' ? 'Approved' : 'Declined'}`,
      message: decision === 'verified' 
        ? 'Your RV University Alumni profile has been verified by the administrator.' 
        : `Your verification request was declined: ${reason}`,
      type: 'verification',
      related_entity_type: 'user',
      related_entity_id: userId
    });
    return true;
  }
};

// Seed initial RV University users, alumni, and opportunities
function seedLocalStore() {
  console.log('Seeding initial RV University platform data in memory/local store...');
  const salt = bcrypt.genSaltSync(10);
  const now = new Date().toISOString();

  // 1. Admin
  const adminId = 'admin-user-001';
  const adminUser: User = {
    id: adminId,
    full_name: 'RVU Alumni Relations Office',
    email: 'admin@rvu.edu.in',
    password_hash: bcrypt.hashSync('RVAdmin@2026', salt),
    role: 'admin',
    account_status: 'active',
    created_at: now,
    updated_at: now
  };

  // 2. Verified Alumni 1 - Ananya Sharma
  const alumni1Id = 'alumni-user-001';
  const alumni1User: User = {
    id: alumni1Id,
    full_name: 'Ananya Sharma',
    email: 'ananya.sharma@alumni.rvu.edu.in',
    password_hash: bcrypt.hashSync('Alumni@123', salt),
    role: 'alumni',
    account_status: 'active',
    created_at: now,
    updated_at: now
  };
  const alumni1Prof: AlumniProfile = {
    id: 'alumni-prof-001',
    user_id: alumni1Id,
    headline: 'Senior Software Engineer at Google India | Distributed Systems & Cloud',
    company: 'Google',
    job_title: 'Senior Software Engineer',
    graduation_year: 2021,
    department: 'School of Computer Science & Engineering',
    skills: JSON.stringify(['Distributed Systems', 'Go', 'Kubernetes', 'System Design', 'GCP', 'Career Strategy']),
    bio: 'Proud RV University graduate (Batch of 2021). Passionate about cloud infrastructure, backend microservices, and guiding current students through tech interview prep, system design, and competitive coding.',
    linkedin_url: 'https://linkedin.com/in/ananya-sharma-google',
    verification_status: 'verified',
    verification_reason: 'Alumni record verified via RVU Academic Registry.',
    verified_at: now,
    created_at: now,
    updated_at: now
  };

  // 3. Verified Alumni 2 - Rohit Menon
  const alumni2Id = 'alumni-user-002';
  const alumni2User: User = {
    id: alumni2Id,
    full_name: 'Rohit Menon',
    email: 'rohit.menon@alumni.rvu.edu.in',
    password_hash: bcrypt.hashSync('Alumni@123', salt),
    role: 'alumni',
    account_status: 'active',
    created_at: now,
    updated_at: now
  };
  const alumni2Prof: AlumniProfile = {
    id: 'alumni-prof-002',
    user_id: alumni2Id,
    headline: 'Product Manager at Microsoft | Cloud Security & Enterprise AI',
    company: 'Microsoft',
    job_title: 'Product Manager',
    graduation_year: 2020,
    department: 'School of Computer Science & Engineering',
    skills: JSON.stringify(['Product Strategy', 'Enterprise AI', 'User Research', 'Agile Roadmapping', 'Tech Consulting']),
    bio: 'Product leader focused on customer empathy, enterprise product-market fit, and generative AI features. Happy to mentor RVU students breaking into APM roles or transitioning from engineering to product.',
    linkedin_url: 'https://linkedin.com/in/rohit-menon-pm',
    verification_status: 'verified',
    verification_reason: 'Verified through Alumni Association registry.',
    verified_at: now,
    created_at: now,
    updated_at: now
  };

  // 4. Verified Alumni 3 - Dr. Priya Kulkarni
  const alumni3Id = 'alumni-user-003';
  const alumni3User: User = {
    id: alumni3Id,
    full_name: 'Dr. Priya Kulkarni',
    email: 'priya.kulkarni@alumni.rvu.edu.in',
    password_hash: bcrypt.hashSync('Alumni@123', salt),
    role: 'alumni',
    account_status: 'active',
    created_at: now,
    updated_at: now
  };
  const alumni3Prof: AlumniProfile = {
    id: 'alumni-prof-003',
    user_id: alumni3Id,
    headline: 'Lead AI & Data Scientist at Cisco Systems | NLP & GenAI',
    company: 'Cisco Systems',
    job_title: 'Lead AI Scientist',
    graduation_year: 2019,
    department: 'School of Computer Science & Engineering',
    skills: JSON.stringify(['Natural Language Processing', 'Machine Learning', 'PyTorch', 'Research Papers', 'LLM Fine-tuning']),
    bio: 'Research scientist with 10+ publications and patents in AI. Guiding students interested in machine learning research, graduate school admissions, and AI industry engineering roles.',
    linkedin_url: 'https://linkedin.com/in/priya-kulkarni-ai',
    verification_status: 'verified',
    verification_reason: 'Verified with official university degree archives.',
    verified_at: now,
    created_at: now,
    updated_at: now
  };

  // 5. Pending Alumni - Divya Nair
  const alumni4Id = 'alumni-user-004';
  const alumni4User: User = {
    id: alumni4Id,
    full_name: 'Divya Nair',
    email: 'divya.nair@alumni.rvu.edu.in',
    password_hash: bcrypt.hashSync('Alumni@123', salt),
    role: 'alumni',
    account_status: 'active',
    created_at: now,
    updated_at: now
  };
  const alumni4Prof: AlumniProfile = {
    id: 'alumni-prof-004',
    user_id: alumni4Id,
    headline: 'Embedded Firmware Engineer at Bosch Global Software',
    company: 'Bosch Global Software',
    job_title: 'Firmware Engineer',
    graduation_year: 2023,
    department: 'School of Computer Science & Engineering',
    skills: JSON.stringify(['Embedded C++', 'RTOS', 'CAN Protocol', 'IoT Architecture']),
    bio: 'Recent 2023 graduate working on next-gen automotive mobility sensors. Excited to share tips on core electronics and embedded systems interviews.',
    linkedin_url: 'https://linkedin.com/in/divya-nair-bosch',
    verification_status: 'pending',
    verification_reason: null,
    verified_at: null,
    created_at: now,
    updated_at: now
  };

  // 6. Student - Rahul Deshmukh
  const studentId = 'student-user-001';
  const studentUser: User = {
    id: studentId,
    full_name: 'Rahul Deshmukh',
    email: 'rahul.deshmukh@rvu.edu.in',
    password_hash: bcrypt.hashSync('Student@123', salt),
    role: 'student',
    account_status: 'active',
    created_at: now,
    updated_at: now
  };
  const studentProf: StudentProfile = {
    id: 'student-prof-001',
    user_id: studentId,
    usn: '1RV22CS089',
    programme: 'B.Tech in Computer Science and Engineering',
    department: 'School of Computer Science & Engineering',
    semester_or_year: '6th Semester (3rd Year)',
    skills: JSON.stringify(['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Data Structures', 'Docker']),
    interests: JSON.stringify(['Cloud Architecture', 'Full Stack Development', 'Open Source', 'Internships']),
    bio: 'Passionate 3rd-year CS student eager to gain practical industry insights, prepare for summer 2027 internships, and build scalable web applications.',
    created_at: now,
    updated_at: now
  };

  // 7. General Student Account (student@rvu.edu.in)
  const student2Id = 'student-user-002';
  const student2User: User = {
    id: student2Id,
    full_name: 'Sumanth Rao',
    email: 'student@rvu.edu.in',
    password_hash: bcrypt.hashSync('Student@123', salt),
    role: 'student',
    account_status: 'active',
    created_at: now,
    updated_at: now
  };
  const student2Prof: StudentProfile = {
    id: 'student-prof-002',
    user_id: student2Id,
    usn: '1RV23CS142',
    programme: 'B.Tech in Computer Science and Engineering',
    department: 'School of Computer Science & Engineering',
    semester_or_year: '4th Semester (2nd Year)',
    skills: JSON.stringify(['Python', 'Java', 'Full Stack', 'Web Development']),
    interests: JSON.stringify(['Internships', 'Competitive Coding', 'Mentorship']),
    bio: '2nd-year CS student at RVU preparing for summer 2027 internships.',
    created_at: now,
    updated_at: now
  };

  memStore.users = [adminUser, alumni1User, alumni2User, alumni3User, alumni4User, studentUser, student2User];
  memStore.student_profiles = [studentProf, student2Prof];
  memStore.alumni_profiles = [alumni1Prof, alumni2Prof, alumni3Prof, alumni4Prof];

  // Mentorship Sessions
  const tomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const nextWeek = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

  memStore.mentorship_sessions = [
    {
      id: 'session-001',
      alumni_id: alumni1Id,
      title: 'Cloud Architecture & Google Tech Interview Prep',
      description: '1-on-1 session covering distributed system fundamentals, resume review, and coding interview walkthrough.',
      scheduled_at: tomorrow,
      duration_minutes: 45,
      meeting_link: 'https://meet.google.com/rvu-ment-001',
      status: 'available',
      created_at: now,
      updated_at: now
    },
    {
      id: 'session-002',
      alumni_id: alumni2Id,
      title: 'Breaking into Product Management: Strategy & Cases',
      description: 'Discussing APM applications, product case frameworks, and translating engineering projects into product value.',
      scheduled_at: nextWeek,
      duration_minutes: 45,
      meeting_link: 'https://teams.microsoft.com/rvu-pm-session',
      status: 'available',
      created_at: now,
      updated_at: now
    }
  ];

  // Opportunities
  memStore.opportunities = [
    {
      id: 'opp-001',
      posted_by: alumni1Id,
      title: 'Summer 2027 Software Engineering Intern (Cloud)',
      description: 'Google India is hiring software engineering interns for the Bengaluru cloud infrastructure team. Work on distributed storage, high-throughput RPCs, and developer tooling.',
      opportunity_type: 'internship',
      company: 'Google',
      location: 'Bengaluru, India (Hybrid)',
      required_skills: JSON.stringify(['Go', 'C++', 'Java', 'Data Structures & Algorithms', 'Operating Systems']),
      application_url: null,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: 'opp-002',
      posted_by: alumni2Id,
      title: 'Associate Product Manager Intern (Enterprise Cloud)',
      description: 'Opportunity to shadow PMs, analyze customer metrics, run qualitative customer interviews, and write PRDs for Microsoft security features.',
      opportunity_type: 'internship',
      company: 'Microsoft',
      location: 'Bengaluru, India (On-site)',
      required_skills: JSON.stringify(['Product Thinking', 'Analytical Skills', 'UI/UX Familiarity', 'Communication']),
      application_url: null,
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      created_at: now,
      updated_at: now
    },
    {
      id: 'opp-003',
      posted_by: alumni3Id,
      title: 'Graduate Data Science & Machine Learning Referral',
      description: 'Direct team referral for final year students and 2026 graduates interested in enterprise networking telemetry and transformer-based anomaly detection.',
      opportunity_type: 'referral',
      company: 'Cisco Systems',
      location: 'Bengaluru, India',
      required_skills: JSON.stringify(['Python', 'PyTorch', 'Statistics', 'SQL', 'FastAPI']),
      application_url: null,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      created_at: now,
      updated_at: now
    }
  ];

  // Sample Mentorship Request
  memStore.mentorship_requests = [
    {
      id: 'req-001',
      student_id: studentId,
      alumni_id: alumni1Id,
      message: 'Hello Ananya Ma\'am! I am a 3rd-year CS student at RV University aiming for cloud engineering roles. Would love your guidance on distributed systems projects and preparation tips for Google interviews.',
      topics: JSON.stringify(['Cloud Systems', 'Interview Preparation', 'Resume Review']),
      status: 'accepted',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now
    }
  ];

  // Sample Messages
  memStore.messages = [
    {
      id: 'msg-001',
      sender_id: studentId,
      receiver_id: alumni1Id,
      content: 'Hi Ananya Ma\'am, thank you so much for accepting my mentorship request!',
      is_read: true,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'msg-002',
      sender_id: alumni1Id,
      receiver_id: studentId,
      content: 'Hi Rahul, great to connect with an RVU junior! Feel free to book one of my available mentorship slots or share your current resume draft here.',
      is_read: false,
      created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Notifications
  memStore.notifications = [
    {
      id: 'notif-001',
      user_id: studentId,
      title: 'Mentorship Request Accepted',
      message: 'Ananya Sharma has accepted your mentorship request.',
      type: 'mentorship_status',
      related_entity_type: 'mentorship_request',
      related_entity_id: 'req-001',
      is_read: false,
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'notif-002',
      user_id: studentId,
      title: 'New Opportunity Posted',
      message: 'Ananya Sharma posted: "Summer 2027 Software Engineering Intern (Cloud)" at Google.',
      type: 'opportunity',
      related_entity_type: 'opportunity',
      related_entity_id: 'opp-001',
      is_read: true,
      created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
    }
  ];

  saveMemStore();
}

async function seedDatabase() {
  if (!pool) return;
  // If pool is connected, run seed SQL
  seedLocalStore();
  // Insert initial data to PG
  try {
    for (const u of memStore.users) {
      await pool.query(
        `INSERT INTO users (id, full_name, email, password_hash, role, account_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.full_name, u.email, u.password_hash, u.role, u.account_status, u.created_at, u.updated_at]
      );
    }
    for (const sp of memStore.student_profiles) {
      await pool.query(
        `INSERT INTO student_profiles (id, user_id, usn, programme, department, semester_or_year, skills, interests, bio, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
        [sp.id, sp.user_id, sp.usn, sp.programme, sp.department, sp.semester_or_year, sp.skills, sp.interests, sp.bio, sp.created_at, sp.updated_at]
      );
    }
    for (const ap of memStore.alumni_profiles) {
      await pool.query(
        `INSERT INTO alumni_profiles (id, user_id, headline, company, job_title, graduation_year, department, skills, bio, linkedin_url, verification_status, verification_reason, verified_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT (id) DO NOTHING`,
        [ap.id, ap.user_id, ap.headline, ap.company, ap.job_title, ap.graduation_year, ap.department, ap.skills, ap.bio, ap.linkedin_url, ap.verification_status, ap.verification_reason, ap.verified_at, ap.created_at, ap.updated_at]
      );
    }
    for (const s of memStore.mentorship_sessions) {
      await pool.query(
        `INSERT INTO mentorship_sessions (id, alumni_id, title, description, scheduled_at, duration_minutes, meeting_link, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.alumni_id, s.title, s.description, s.scheduled_at, s.duration_minutes, s.meeting_link, s.status, s.created_at, s.updated_at]
      );
    }
    for (const opp of memStore.opportunities) {
      await pool.query(
        `INSERT INTO opportunities (id, posted_by, title, description, opportunity_type, company, location, required_skills, application_url, deadline, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT (id) DO NOTHING`,
        [opp.id, opp.posted_by, opp.title, opp.description, opp.opportunity_type, opp.company, opp.location, opp.required_skills, opp.application_url, opp.deadline, opp.status, opp.created_at, opp.updated_at]
      );
    }
    console.log('PostgreSQL seeded with RV University initial records.');
  } catch (err) {
    console.error('Error seeding PostgreSQL tables:', err);
  }
}
