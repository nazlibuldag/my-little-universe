import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import celestialRoutes from './routes/celestial.routes';
import dailyMoodRoutes from './routes/dailyMood.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/celestials', celestialRoutes);
app.use('/api/daily-moods', dailyMoodRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'My Little Universe API', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌌 My Little Universe Express API is running on http://localhost:${PORT}`);
});
