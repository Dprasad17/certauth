import { Router } from 'express';
import { signup, login } from '../controllers/authController.js';
import { syncIdentity, getVault } from '../controllers/identityController.js';
import { authenticateToken } from '../lib/authMiddleware.js';

const router = Router();

// --- Public Routes ---
router.post('/auth/signup', signup);
router.post('/auth/login', login);

// Protected Routes (Authentication Required)
router.post('/identity/sync', authenticateToken as any, syncIdentity);
router.get('/identity/vault/:email', authenticateToken as any, getVault);

export default router;
