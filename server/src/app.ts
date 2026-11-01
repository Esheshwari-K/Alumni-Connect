import express from 'express';
import cookieParser from 'cookie-parser';
import { authenticate } from './middleware/auth.ts';
import { authRouter } from './routes/auth.ts';
import { studentsRouter } from './routes/students.ts';
import { alumniRouter } from './routes/alumni.ts';
import { mentorshipRouter } from './routes/mentorship.ts';
import { sessionsRouter } from './routes/sessions.ts';
import { messagesRouter } from './routes/messages.ts';
import { opportunitiesRouter } from './routes/opportunities.ts';
import { applicationsRouter } from './routes/applications.ts';
import { notificationsRouter } from './routes/notifications.ts';
import { adminRouter } from './routes/admin.ts';
import { isUsingPostgres } from './db/index.ts';

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(authenticate);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Alumni Connect — RV University Alumni Mentorship & Networking Platform',
    institution: 'RV University, Bengaluru',
    database: isUsingPostgres() ? 'Neon Serverless PostgreSQL (Active)' : 'Local Persistent Engine (Active)',
    timestamp: new Date().toISOString()
  });
});

// Mount versioned REST API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/alumni', alumniRouter);
app.use('/api/v1/mentorship', mentorshipRouter);
app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/messages', messagesRouter);
app.use('/api/v1/opportunities', opportunitiesRouter);
app.use('/api/v1/applications', applicationsRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/admin', adminRouter);

// Centralized error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});
