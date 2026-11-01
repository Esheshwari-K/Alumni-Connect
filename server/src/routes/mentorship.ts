import { Router, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

export const mentorshipRouter = Router();

mentorshipRouter.use(requireAuth);

// Create mentorship request (students only)
mentorshipRouter.post('/requests', requireRole(['student']), async (req: Request, res: Response) => {
  try {
    const { alumni_id, message, topics } = req.body;

    if (!alumni_id || !message) {
      res.status(400).json({ error: 'Alumni recipient and a request message are required.' });
      return;
    }

    // Check if target user is active alumni
    const alumni = await db.getUserById(alumni_id);
    if (!alumni || alumni.role !== 'alumni') {
      res.status(404).json({ error: 'Target alumni not found.' });
      return;
    }

    const topicsFormatted = Array.isArray(topics) ? JSON.stringify(topics) : topics;

    const request = await db.createMentorshipRequest({
      student_id: req.user!.id,
      alumni_id,
      message: message.trim(),
      topics: topicsFormatted
    });

    res.status(201).json({
      message: 'Mentorship request submitted successfully.',
      request
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit mentorship request.' });
  }
});

// List mentorship requests for the current user
mentorshipRouter.get('/requests', async (req: Request, res: Response) => {
  try {
    const requests = await db.getMentorshipRequestsForUser(req.user!.id, req.user!.role);
    res.json({ requests });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch mentorship requests.' });
  }
});

// Update request status (accept/reject by alumni, cancel by student)
mentorshipRouter.patch('/requests/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be accepted, rejected, or cancelled.' });
      return;
    }

    const updated = await db.updateMentorshipRequestStatus(req.params.id, status, req.user!.id);
    if (!updated) {
      res.status(403).json({ error: 'Action not authorized or request not found.' });
      return;
    }

    res.json({ message: `Mentorship request has been ${status}.`, request: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update request status.' });
  }
});
