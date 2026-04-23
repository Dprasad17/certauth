import { Router } from 'express';
import { signup, login } from '../controllers/authController.js';
import { syncIdentity } from '../controllers/identityController.js';
import { authenticateToken } from '../lib/authMiddleware.js';

const router = Router();

// --- Public Routes ---
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// --- Protected Routes ---
// Unified Sync Endpoint - Now protected by JWT
router.post('/identity/sync', authenticateToken as any, syncIdentity);

export default router;
