import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// CORS configuration - Restrict to mobile app origin if known, otherwise allow all for now
// In production, this should be specific to the mobile app's bundle ID or domain
app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map