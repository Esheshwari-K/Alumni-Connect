import { Router, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

// Student's own applications
applicationsRouter.get('/me', requireRole(['student']), async (req: Request, res: Response) => {
  try {
    const list = await db.getApplicationsForStudent(req.user!.id);
    res.json({ applications: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch your applications' });
  }
});

// Update application status (Alumni who posted opportunity or Admin)
applicationsRouter.patch('/:id/status', requireRole(['alumni', 'admin']), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['submitted', 'under_review', 'shortlisted', 'selected', 'rejected'].includes(status)) {
      res.status(400).json({ error: 'Invalid application status value' });
      return;
    }

    const success = await db.updateApplicationStatus(req.params.id, status, req.user!.id);
    if (!success) {
      res.status(403).json({ error: 'Action not authorized or application not found' });
      return;
    }

    res.json({ message: `Application status updated to ${status}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update application status' });
  }
});
