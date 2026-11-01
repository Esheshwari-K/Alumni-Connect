import { Router, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { requireAuth } from '../middleware/auth.ts';

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

// Get conversations list
messagesRouter.get('/conversations', async (req: Request, res: Response) => {
  try {
    const list = await db.getConversations(req.user!.id);
    res.json({ conversations: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch conversations.' });
  }
});

// Get messages with a specific partner
messagesRouter.get('/conversations/:partnerId', async (req: Request, res: Response) => {
  try {
    const partner = await db.getUserById(req.params.partnerId);
    if (!partner) {
      res.status(404).json({ error: 'Conversation recipient not found.' });
      return;
    }

    const messages = await db.getMessagesBetween(req.user!.id, req.params.partnerId);
    res.json({
      partner: {
        id: partner.id,
        full_name: partner.full_name,
        role: partner.role
      },
      messages
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch message history.' });
  }
});

// Send message
messagesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { receiver_id, content } = req.body;
    if (!receiver_id || !content || !content.trim()) {
      res.status(400).json({ error: 'Receiver ID and non-empty message content are required.' });
      return;
    }

    const receiver = await db.getUserById(receiver_id);
    if (!receiver) {
      res.status(404).json({ error: 'Message recipient not found.' });
      return;
    }

    const msg = await db.sendMessage(req.user!.id, receiver_id, content.trim());
    res.status(201).json({ message: 'Message sent successfully', data: msg });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to send message.' });
  }
});
