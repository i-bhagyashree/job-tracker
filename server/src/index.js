import app from './app.js';
import { connectDB } from './db.js';

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set. Copy .env.example to .env');
  process.exit(1);
}

const PORT = process.env.PORT || 5050;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
