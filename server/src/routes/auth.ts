import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import { requireAuth } from '../middleware/auth.ts';

export const authRouter = Router();

// Set cookie helper
function setAuthCookie(res: Response, token: string) {
  res.cookie('alumni_connect_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

// Student Registration
authRouter.post('/register/student', async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, confirm_password, usn, programme, department, semester_or_year } = req.body;

    if (!full_name || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (confirm_password && password !== confirm_password) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();

    const user = await db.createUser({
      id: userId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role: 'student',
      account_status: 'active'
    });

    await db.upsertStudentProfile({
      user_id: userId,
      usn: usn ? usn.trim() : null,
      programme: programme ? programme.trim() : null,
      department: department ? department.trim() : null,
      semester_or_year: semester_or_year ? semester_or_year.trim() : null
    });

    const token = await db.createSession(userId);
    setAuthCookie(res, token);

    const profile = await db.getStudentProfile(userId);

    res.status(201).json({
      message: 'Student account created successfully',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
        profile
      }
    });
  } catch (err: any) {
    console.error('Student registration error:', err);
    res.status(500).json({ error: err.message || 'Failed to create student account.' });
  }
});

// Alumni Registration
authRouter.post('/register/alumni', async (req: Request, res: Response) => {
  try {
    const { full_name, email, password, confirm_password, graduation_year, department, company, job_title, skills, bio, linkedin_url } = req.body;

    if (!full_name || !email || !password) {
      res.status(400).json({ error: 'Full name, email, and password are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (confirm_password && password !== confirm_password) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const userId = crypto.randomUUID();

    const user = await db.createUser({
      id: userId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      password_hash,
      role: 'alumni',
      account_status: 'active'
    });

    // New alumni registration starts with 'pending' verification status
    await db.upsertAlumniProfile({
      user_id: userId,
      graduation_year: graduation_year ? parseInt(graduation_year, 10) : null,
      department: department ? department.trim() : null,
      company: company ? company.trim() : null,
      job_title: job_title ? job_title.trim() : null,
      skills: Array.isArray(skills) ? JSON.stringify(skills) : (skills ? JSON.stringify(skills.split(',').map((s: string) => s.trim())) : null),
      bio: bio ? bio.trim() : null,
      linkedin_url: linkedin_url ? linkedin_url.trim() : null,
      verification_status: 'pending'
    });

    const token = await db.createSession(userId);
    setAuthCookie(res, token);

    const profile = await db.getAlumniProfile(userId);

    res.status(201).json({
      message: 'Alumni registration submitted successfully. Your profile is pending university administrator verification.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
        profile
      }
    });
  } catch (err: any) {
    console.error('Alumni registration error:', err);
    res.status(500).json({ error: err.message || 'Failed to create alumni account.' });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please provide both email and password.' });
      return;
    }

    const user = await db.getUserByEmail(email);
    if (!user || !user.password_hash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.account_status === 'suspended') {
      res.status(403).json({ error: 'Your account has been suspended. Please contact the RV University administration.' });
      return;
    }

    const token = await db.createSession(user.id);
    setAuthCookie(res, token);

    let profile = null;
    if (user.role === 'student') {
      profile = await db.getStudentProfile(user.id);
    } else if (user.role === 'alumni') {
      profile = await db.getAlumniProfile(user.id);
    }

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        account_status: user.account_status,
        profile
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    if (req.token) {
      await db.deleteSession(req.token);
    }
    res.clearCookie('alumni_connect_token');
    res.json({ message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Logout failed' });
  }
});

// Current User Session Check
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    let profile = null;
    if (req.user.role === 'student') {
      profile = await db.getStudentProfile(req.user.id);
    } else if (req.user.role === 'alumni') {
      profile = await db.getAlumniProfile(req.user.id);
    }

    res.json({
      user: {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.role,
        account_status: req.user.account_status,
        profile
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve session' });
  }
});

// Forgot password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Please enter your registered email address.' });
    return;
  }
  const user = await db.getUserByEmail(email);
  if (!user) {
    // Return friendly generic message for security
    res.json({
      message: 'If an account exists with this email, password reset instructions have been recorded. (Note: Email delivery SMTP is unconfigured in this environment. Contact admin@rvu.edu.in for password reset).'
    });
    return;
  }

  res.json({
    message: 'Password reset request acknowledged. Since SMTP email delivery service is not configured in this environment, please contact the RV University Alumni Relations Office (admin@rvu.edu.in) or use your credentials.'
  });
});
