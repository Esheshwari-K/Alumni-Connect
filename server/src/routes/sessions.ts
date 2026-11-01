import { Router, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

// Get available mentorship sessions (or filter by alumni)
sessionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { alumni_id } = req.query;
    const sessions = await db.getSessions(alumni_id as string);
    res.json({ sessions });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch sessions.' });
  }
});

// Create session (alumni only)
sessionsRouter.post('/', requireRole(['alumni']), async (req: Request, res: Response) => {
  try {
    const { title, description, scheduled_at, duration_minutes, meeting_link } = req.body;

    if (!title || !scheduled_at) {
      res.status(400).json({ error: 'Session title and scheduled date/time are required.' });
      return;
    }

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      res.status(400).json({ error: 'Invalid scheduled date/time.' });
      return;
    }

    const session = await db.createMentorshipSession({
      alumni_id: req.user!.id,
      title: title.trim(),
      description: description ? description.trim() : undefined,
      scheduled_at: scheduledDate.toISOString(),
      duration_minutes: duration_minutes ? parseInt(duration_minutes, 10) : 45,
      meeting_link: meeting_link ? meeting_link.trim() : undefined
    });

    res.status(201).json({ message: 'Mentorship session slot created successfully.', session });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create session.' });
  }
});

// Book a session (students only)
sessionsRouter.post('/book', requireRole(['student']), async (req: Request, res: Response) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      res.status(400).json({ error: 'Session ID is required.' });
      return;
    }

    const result = await db.bookSession(session_id, req.user!.id);
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Failed to book session.' });
      return;
    }

    res.status(201).json({ message: 'Session booked successfully!', booking: result.booking });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing session booking.' });
  }
});

// Get user bookings
sessionsRouter.get('/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await db.getBookingsForUser(req.user!.id, req.user!.role);
    res.json({ bookings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch bookings.' });
  }
});

// Cancel booking
sessionsRouter.patch('/bookings/:id/cancel', async (req: Request, res: Response) => {
  try {
    const success = await db.cancelBooking(req.params.id, req.user!.id);
    if (!success) {
      res.status(403).json({ error: 'Action not authorized or booking not found.' });
      return;
    }

    res.json({ message: 'Booking has been cancelled.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to cancel booking.' });
  }
});
