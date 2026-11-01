import { Router, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

export const studentsRouter = Router();

studentsRouter.use(requireAuth);

// Get current student profile
studentsRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const profile = await db.getStudentProfile(req.user!.id);
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
    res.status(500).json({ error: err.message || 'Failed to fetch student profile' });
  }
});

// Update student profile
studentsRouter.patch('/me', requireRole(['student']), async (req: Request, res: Response) => {
  try {
    const { usn, programme, department, semester_or_year, skills, interests, bio } = req.body;
    const skillsFormatted = Array.isArray(skills) ? JSON.stringify(skills) : skills;
    const interestsFormatted = Array.isArray(interests) ? JSON.stringify(interests) : interests;

    const updated = await db.upsertStudentProfile({
      user_id: req.user!.id,
      usn,
      programme,
      department,
      semester_or_year,
      skills: skillsFormatted,
      interests: interestsFormatted,
      bio
    });

    res.json({ message: 'Profile updated successfully', profile: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update student profile' });
  }
});
