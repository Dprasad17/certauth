import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TOTP } from '@otplib/totp';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

/**
 * Verifies OTP and returns JWT.
 * POST /api/auth/verify-otp
 */
export const verifyOTP = async (req: Request, res: Response) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'Missing required fields: email, code' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // otplib v13 usage with TOTP class
        const totp = new TOTP();
        const result = await totp.verify(code, {
            secret: (user as any).totpSecret,
            epochTolerance: 30, // 30 seconds allows for 1 step drift
        });

        if (!result.valid) {
            return res.status(401).json({ error: 'Invalid OTP code' });
        }

        // Generate JWT with user id and email in payload
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'OTP verified successfully',
            token,
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
