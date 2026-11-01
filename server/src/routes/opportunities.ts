import { Router, Request, Response } from 'express';
import { db } from '../db/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';

export const opportunitiesRouter = Router();

opportunitiesRouter.use(requireAuth);

// Browse opportunities (with filters)
opportunitiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { search, type, status } = req.query;
    const list = await db.getOpportunities({
      search: search as string,
      type: type as string,
      status: status as string
    });
    res.json({ opportunities: list, total: list.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch opportunities' });
  }
});

// Single opportunity
opportunitiesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await db.getOpportunityById(req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Opportunity not found' });
      return;
    }
    res.json({ opportunity: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch opportunity' });
  }
});

// Create opportunity (Alumni and Admin)
opportunitiesRouter.post('/', requireRole(['alumni', 'admin']), async (req: Request, res: Response) => {
  try {
    const { title, description, opportunity_type, company, location, required_skills, application_url, deadline } = req.body;

    if (!title || !description || !company || !opportunity_type || !location) {
      res.status(400).json({ error: 'Title, description, company, type, and location are required.' });
      return;
    }

    const skillsFormatted = Array.isArray(required_skills) ? JSON.stringify(required_skills) : required_skills;

    const opp = await db.createOpportunity({
      posted_by: req.user!.id,
      title: title.trim(),
      description: description.trim(),
      opportunity_type,
      company: company.trim(),
      location: location.trim(),
      required_skills: skillsFormatted,
      application_url: application_url ? application_url.trim() : null,
      deadline: deadline || null,
      status: 'active'
    });

    res.status(201).json({ message: 'Opportunity created successfully', opportunity: opp });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create opportunity' });
  }
});

// Update opportunity
opportunitiesRouter.patch('/:id', requireRole(['alumni', 'admin']), async (req: Request, res: Response) => {
  try {
    const isAdmin = req.user!.role === 'admin';
    const updated = await db.updateOpportunity(req.params.id, req.body, req.user!.id, isAdmin);
    if (!updated) {
      res.status(403).json({ error: 'Not authorized or opportunity not found' });
      return;
    }
    res.json({ message: 'Opportunity updated successfully', opportunity: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update opportunity' });
  }
});

// Apply to opportunity (Students only)
opportunitiesRouter.post('/:id/applications', requireRole(['student']), async (req: Request, res: Response) => {
  try {
    const { resume_url, cover_letter } = req.body;
    const opp = await db.getOpportunityById(req.params.id);
    if (!opp) {
      res.status(404).json({ error: 'Opportunity not found' });
      return;
    }

    if (opp.status !== 'active') {
      res.status(400).json({ error: 'This opportunity is no longer accepting applications' });
      return;
    }

    const result = await db.createApplication({
      opportunity_id: req.params.id,
      student_id: req.user!.id,
      resume_url,
      cover_letter
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ message: 'Application submitted successfully!', application: result.application });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit application' });
  }
});

// View applicants for an opportunity (Alumni owner or Admin)
opportunitiesRouter.get('/:id/applications', requireRole(['alumni', 'admin']), async (req: Request, res: Response) => {
  try {
    const applications = await db.getApplicationsForOpportunity(req.params.id, req.user!.id);
    res.json({ applications });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch applicants' });
  }
});
