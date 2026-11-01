import { Router, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

export const alumniRouter = Router();

// Public / Authenticated directory access
alumniRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { search, company, department, graduation_year, skill } = req.query;

    const list = await db.getAlumniDirectory({
      search: search as string,
      company: company as string,
      department: department as string,
      graduation_year: graduation_year ? parseInt(graduation_year as string, 10) : undefined,
      skill: skill as string
    });

    res.json({ alumni: list, total: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch alumni directory' });
  }
});

// Current alumni profile
alumniRouter.get('/me', requireAuth, requireRole(['alumni']), async (req: Request, res: Response) => {
  try {
    const profile = await db.getAlumniProfile(req.user!.id);
    res.json({
      profile,
      user: {
        id: req.user!.id,
        full_name: req.user!.full_name,
        email: req.user!.email,
        role: req.user!.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch alumni profile' });
  }
});

// Update alumni profile
alumniRouter.patch('/me', requireAuth, requireRole(['alumni']), async (req: Request, res: Response) => {
  try {
    const { headline, company, job_title, graduation_year, department, skills, bio, linkedin_url } = req.body;
    const skillsFormatted = Array.isArray(skills) ? JSON.stringify(skills) : skills;

    const updated = await db.upsertAlumniProfile({
      user_id: req.user!.id,
      headline,
      company,
      job_title,
      graduation_year: graduation_year ? parseInt(graduation_year, 10) : undefined,
      department,
      skills: skillsFormatted,
      bio,
      linkedin_url
    });

    res.json({ message: 'Profile updated successfully', profile: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update alumni profile' });
  }
});

// Single alumni profile by user_id
alumniRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const profile = await db.getAlumniProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ error: 'Alumni profile not found' });
      return;
    }

    // Also get their available mentorship sessions
    const sessions = await db.getSessions(req.params.id);
    const availableSessions = sessions.filter((s: any) => s.status === 'available');

    res.json({ profile, available_sessions: availableSessions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch alumni details' });
  }
});
