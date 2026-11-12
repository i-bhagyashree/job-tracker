// Vercel serverless entry: the whole Express API runs as one function
import app from '../server/src/app.js';
import { connectDB } from '../server/src/db.js';

export default async function handler(req, res) {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: 'Server misconfigured: JWT_SECRET is not set' });
  }
  await connectDB();
  return app(req, res);
}
