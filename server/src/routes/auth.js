import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Application from '../models/Application.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, weeklyGoal: u.weeklyGoal ?? 5 });

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  weeklyGoal: z.number().int().min(0).max(100).optional(),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

router.post('/register', async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await User.create(data);
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: signToken(user._id), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: publicUser(user) });
});

// PATCH /api/auth/me  — update name / weekly goal
router.patch('/me', requireAuth, async (req, res) => {
  const data = profileSchema.parse(req.body);
  const user = await User.findByIdAndUpdate(req.userId, data, { returnDocument: 'after', runValidators: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user: publicUser(user) });
});

// PATCH /api/auth/password
router.patch('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = passwordSchema.parse(req.body);
  const user = await User.findById(req.userId).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }
  user.password = newPassword; // hashed by the pre-save hook
  await user.save();
  res.json({ ok: true });
});

// DELETE /api/auth/me  body: { password } — deletes the account and all its applications
router.delete('/me', requireAuth, async (req, res) => {
  const { password } = z.object({ password: z.string().min(1, 'Password is required') }).parse(req.body);
  const user = await User.findById(req.userId).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!(await user.comparePassword(password))) {
    return res.status(400).json({ message: 'Password is incorrect' });
  }
  await Application.deleteMany({ user: user._id });
  await user.deleteOne();
  res.json({ ok: true });
});

export default router;
