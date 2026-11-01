import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, isUsingPostgres } from '../db/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole(['admin']));

// Admin Dashboard stats
adminRouter.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const stats = await db.getAdminStats();
    res.json({
      ...stats,
      database_type: isUsingPostgres() ? 'Neon Serverless PostgreSQL' : 'Local Persistent Storage Engine'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin stats' });
  }
});

// User management
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

// Update user account status (active/suspended)
adminRouter.patch('/users/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'pending'].includes(status)) {
      res.status(400).json({ error: 'Invalid account status' });
      return;
    }

    const success = await db.updateUserStatus(req.params.id, status);
    if (!success) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: `User status changed to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user status' });
  }
});

// Alumni verification queue
adminRouter.get('/alumni-verifications', async (req: Request, res: Response) => {
  try {
    const pending = await db.getPendingAlumniVerifications();
    res.json({ pending_verifications: pending });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch verification queue' });
  }
});

// Review alumni verification (approve/reject)
adminRouter.patch('/alumni-verifications/:id', async (req: Request, res: Response) => {
  try {
    const { decision, reason } = req.body;
    if (!['verified', 'rejected'].includes(decision)) {
      res.status(400).json({ error: 'Decision must be either "verified" or "rejected"' });
      return;
    }

    const success = await db.reviewAlumniVerification(req.params.id, decision, reason);
    if (!success) {
      res.status(404).json({ error: 'Alumni record not found' });
      return;
    }

    res.json({ message: `Alumni verification status updated to ${decision}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process verification decision' });
  }
});

// Moderate opportunities
adminRouter.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const opportunities = await db.getOpportunities({ status: 'all' });
    res.json({ opportunities });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch opportunities' });
  }
});

// Admin directly creates and verifies an alumni profile
adminRouter.post('/alumni', async (req: Request, res: Response) => {
  try {
    const {
      full_name,
      email,
      password = 'Alumni@123',
      graduation_year,
      department,
      company,
      job_title,
      skills,
      bio,
      linkedin_url
    } = req.body;

    if (!full_name || !email || !company || !job_title) {
      res.status(400).json({ error: 'Full name, email, company, and job title are required.' });
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

    const now = new Date().toISOString();
    const skillsFormatted = Array.isArray(skills)
      ? JSON.stringify(skills)
      : (skills ? JSON.stringify(skills.split(',').map((s: string) => s.trim())) : null);

    const profile = await db.upsertAlumniProfile({
      user_id: userId,
      graduation_year: graduation_year ? parseInt(graduation_year, 10) : new Date().getFullYear(),
      department: department ? department.trim() : 'School of Computer Science & Engineering',
      company: company.trim(),
      job_title: job_title.trim(),
      skills: skillsFormatted,
      bio: bio ? bio.trim() : `RV University Alumnus at ${company}.`,
      linkedin_url: linkedin_url ? linkedin_url.trim() : null,
      verification_status: 'verified',
      verification_reason: 'Added and verified directly by RV University Administrator',
      verified_at: now
    });

    res.status(201).json({
      message: 'Alumni profile created and verified successfully. They can now log in immediately.',
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
    console.error('Error creating alumni by admin:', err);
    res.status(500).json({ error: err.message || 'Failed to create alumni account' });
  }
});

