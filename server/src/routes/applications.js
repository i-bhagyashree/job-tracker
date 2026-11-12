import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Application, { JOB_TYPES, PRIORITIES, STATUSES, WORK_MODES } from '../models/Application.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const optionalDate = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => (v ? new Date(v) : null));

const baseSchema = z.object({
  company: z.string().trim().min(1, 'Company is required'),
  role: z.string().trim().min(1, 'Role is required'),
  status: z.enum(STATUSES).optional(),
  location: z.string().trim().optional(),
  jobUrl: z.string().trim().url('Job URL must be a valid URL').or(z.literal('')).optional(),
  salary: z.string().trim().optional(),
  notes: z.string().optional(),
  priority: z.enum(PRIORITIES).optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  workMode: z.enum([...WORK_MODES, '']).optional(),
  appliedDate: optionalDate,
  followUpDate: optionalDate,
  interviewDate: optionalDate,
  contactName: z.string().trim().optional(),
  contactEmail: z.string().trim().email('Contact email must be valid').or(z.literal('')).optional(),
  contactLinkedin: z.string().trim().url('LinkedIn must be a valid URL').or(z.literal('')).optional(),
  tasks: z
    .array(
      z.object({
        _id: z.string().optional(),
        text: z.string().trim().min(1, 'Task cannot be empty').max(200, 'Task is too long'),
        done: z.boolean().optional(),
      })
    )
    .max(50, 'Too many tasks')
    .optional(),
});

const STALE_DAYS = 14;
const DAY = 86_400_000;
const updateSchema = baseSchema.partial().extend({ order: z.number().optional() });

// GET /api/applications?search=&status=
router.get('/', async (req, res) => {
  const filter = { user: req.userId };
  if (req.query.status && STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ company: rx }, { role: rx }, { location: rx }];
  }
  const apps = await Application.find(filter).sort({ order: 1, updatedAt: -1 });
  res.json(apps);
});

// GET /api/applications/stats
router.get('/stats', async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);

  const [byStatus, weekly, total] = await Promise.all([
    Application.aggregate([
      { $match: { user: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { user: userId, appliedDate: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: '%G-W%V', date: '$appliedDate' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    Application.countDocuments({ user: userId }),
  ]);

  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  byStatus.forEach((s) => (counts[s._id] = s.count));

  const submitted = counts.applied + counts.interview + counts.offer + counts.rejected;
  const responded = counts.interview + counts.offer + counts.rejected;

  const upcomingFollowUps = await Application.find({
    user: userId,
    followUpDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  })
    .sort({ followUpDate: 1 })
    .limit(5)
    .select('company role followUpDate status');

  const upcomingInterviews = await Application.find({
    user: userId,
    interviewDate: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  })
    .sort({ interviewDate: 1 })
    .limit(5)
    .select('company role interviewDate status');

  // "Needs attention": overdue follow-ups + applications stuck in "applied" with no movement
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const staleBefore = new Date(Date.now() - STALE_DAYS * DAY);
  const [overdue, stale] = await Promise.all([
    Application.find({
      user: userId,
      status: { $nin: ['offer', 'rejected'] },
      followUpDate: { $lt: today },
    })
      .sort({ followUpDate: 1 })
      .limit(10)
      .select('company role followUpDate status'),
    Application.aggregate([
      { $match: { user: userId, status: 'applied' } },
      {
        $addFields: {
          lastMove: { $ifNull: [{ $last: '$history.at' }, { $ifNull: ['$appliedDate', '$createdAt'] }] },
        },
      },
      { $match: { lastMove: { $lt: staleBefore } } },
      { $sort: { lastMove: 1 } },
      { $limit: 10 },
      { $project: { company: 1, role: 1, status: 1, lastMove: 1 } },
    ]),
  ]);
  const overdueIds = new Set(overdue.map((a) => String(a._id)));
  const needsAttention = [
    ...overdue.map((a) => ({
      _id: a._id, company: a.company, role: a.role, reason: 'followup', since: a.followUpDate,
    })),
    ...stale
      .filter((a) => !overdueIds.has(String(a._id)))
      .map((a) => ({ _id: a._id, company: a.company, role: a.role, reason: 'stale', since: a.lastMove })),
  ];

  // Weekly goal progress: applications sent since Monday
  const monday = new Date(today);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const thisWeek = await Application.countDocuments({ user: userId, appliedDate: { $gte: monday } });

  res.json({
    total,
    needsAttention,
    thisWeek,
    upcomingInterviews,
    counts,
    responseRate: submitted ? Math.round((responded / submitted) * 100) : 0,
    interviewRate: submitted ? Math.round(((counts.interview + counts.offer) / submitted) * 100) : 0,
    weekly: weekly.map((w) => ({ week: w._id, count: w.count })),
    upcomingFollowUps,
  });
});

router.post('/', async (req, res) => {
  const data = baseSchema.parse(req.body);
  if (data.status && data.status !== 'wishlist' && !data.appliedDate) data.appliedDate = new Date();
  const app = await Application.create({
    ...data,
    user: req.userId,
    history: [{ status: data.status || 'wishlist', at: new Date() }],
  });
  res.status(201).json(app);
});

// PATCH /api/applications/reorder  body: { items: [{ id, status, order }] }
router.patch('/reorder', async (req, res) => {
  const { items } = z
    .object({
      items: z.array(z.object({ id: z.string(), status: z.enum(STATUSES), order: z.number() })),
    })
    .parse(req.body);

  await Application.bulkWrite(
    items.map((i) => ({
      updateOne: {
        filter: { _id: i.id, user: req.userId },
        // Pipeline update so we can stamp appliedDate the first time a card leaves "wishlist"
        update: [
          {
            $set: {
              status: i.status,
              order: i.order,
              appliedDate:
                i.status === 'wishlist' ? '$appliedDate' : { $ifNull: ['$appliedDate', '$$NOW'] },
              history: {
                $cond: [
                  { $ne: ['$status', i.status] },
                  { $concatArrays: [{ $ifNull: ['$history', []] }, [{ status: i.status, at: '$$NOW' }]] },
                  '$history',
                ],
              },
            },
          },
        ],
      },
    }))
  );
  res.json({ ok: true });
});

router.patch('/:id', async (req, res) => {
  const data = updateSchema.parse(req.body);
  const existing = await Application.findOne({ _id: req.params.id, user: req.userId });
  if (!existing) return res.status(404).json({ message: 'Application not found' });

  // Auto-stamp appliedDate when moved out of wishlist for the first time
  if (data.status && data.status !== 'wishlist' && !existing.appliedDate && !data.appliedDate) {
    data.appliedDate = new Date();
  }
  if (data.status && data.status !== existing.status) {
    existing.history.push({ status: data.status, at: new Date() });
  }
  Object.assign(existing, data);
  await existing.save();
  res.json(existing);
});

router.delete('/:id', async (req, res) => {
  const deleted = await Application.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!deleted) return res.status(404).json({ message: 'Application not found' });
  res.json({ ok: true });
});

export default router;
