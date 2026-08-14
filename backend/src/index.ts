import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import celestialRoutes from './routes/celestial.routes';
import dailyMoodRoutes from './routes/dailyMood.routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// Multi-file Upload API Endpoint
app.post('/api/upload', upload.array('photos', 10), (req: any, res: any) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Hiçbir dosya yüklenmedi.' });
    }

    const urls = files.map(file => `/uploads/${file.filename}`);
    return res.json({ success: true, urls });
  } catch (error) {
    console.error('Upload Error:', error);
    return res.status(500).json({ success: false, message: 'Yükleme sırasında bir hata oluştu.' });
  }
});

// Routes
app.use('/api/celestials', celestialRoutes);
app.use('/api/daily-moods', dailyMoodRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌌 My Little Universe Express API is running on http://localhost:${PORT}`);
});
