import { Router, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { requireAuth } from '../middleware/auth.ts';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// Get user notifications
notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const list = await db.getNotifications(req.user!.id);
    const unreadCount = list.filter((n: any) => !n.is_read).length;
    res.json({ notifications: list, unread_count: unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
});

// Mark single notification read
notificationsRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const success = await db.markNotificationRead(req.params.id, req.user!.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update notification' });
  }
});

// Mark all read
notificationsRouter.post('/mark-all-read', async (req: Request, res: Response) => {
  try {
    await db.markAllNotificationsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark all notifications as read' });
  }
});
