import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyOTP } from '../controllers/authController.js';
import { syncIdentity } from '../controllers/identityController.js';

const prisma = new PrismaClient();
const router = Router();

// Identity Sync Endpoint
router.post('/identity/sync', syncIdentity);

// OTP Verification Endpoint
router.post('/auth/verify-otp', verifyOTP);

/**
 * GET Vault Data for a user.
 * GET /api/identity/vault/:email
 */
router.get('/identity/vault/:email', async (req: Request, res: Response) => {
    const { email } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                authenticators: true,
                certificates: true,
            },
        } as any);

        if (!user) {
            return res.status(200).json({
                authenticators: [],
                certificates: []
            });
        }

        res.status(200).json({
            authenticators: (user as any).authenticators || [],
            certificates: (user as any).certificates || [],
        });
    } catch (error) {
        console.error('Error fetching vault:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
