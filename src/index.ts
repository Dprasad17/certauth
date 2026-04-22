import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - Restrict to mobile app origin if known, otherwise allow all for now
app.use(cors());

app.use(express.json());

app.use('/api', authRoutes);

// ARCHITECTURAL FIX: Listen on all interfaces (IPv4) for Cloud Deployment
// Binding to 0.0.0.0 allows Render to route external traffic to this container

// Health Check Route
app.get('/', (req, res) => {
  res.send('CertAuth API is running perfectly! 🚀');
});
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server is broadcast-ready (Cloud/0.0.0.0)!`);
  console.log(`Port: ${PORT}`);
});