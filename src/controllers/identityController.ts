import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { encryptSecret, decryptSecret } from '../utils/encryption.js';
import type { AuthRequest } from '../lib/authMiddleware.js';

/**
 * Syncs identity data from mobile app to backend.
 * POST /api/identity/sync
 */
export const syncIdentity = async (req: AuthRequest, res: Response) => {
    const {
        blockchainId,
        content,
        totpSecret,
        label,
        issuer
    } = req.body;

    // The userId is now provided by the authenticateToken middleware
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'User context missing' });
    }

    // VALIDATION: Prevent 'Unnamed' ghost records for TOTP
    const isTotpSync = totpSecret && totpSecret.length > 0 && !blockchainId;
    if (isTotpSync && (!req.body.uri || req.body.uri === '')) {
        return res.status(400).json({ error: 'Sync Failed: Missing required URI for TOTP' });
    }

    try {
        // 1. Verify User Exists (should always be true if JWT is valid)
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 2. Handle TOTP Authenticator
        if (totpSecret) {
            let finalIssuer = issuer;
            if ((!finalIssuer || finalIssuer === 'Unknown') && req.body.uri) {
                finalIssuer = req.body.uri.match(/issuer=([^&]+)/)?.[1] ||
                    req.body.uri.match(/totp\/([^:]+):/)?.[1] ||
                    'Digital Identity';
            }

            await (prisma as any).authenticator.upsert({
                where: {
                    userId_issuer: {
                        userId: user.id,
                        issuer: finalIssuer,
                    }
                },
                update: {
                    secret: totpSecret,
                    label: label || finalIssuer,
                    uri: req.body.uri || '',
                },
                create: {
                    user: { connect: { id: user.id } },
                    secret: totpSecret,
                    label: label || finalIssuer,
                    issuer: finalIssuer,
                    uri: req.body.uri || '',
                },
            });
            console.log(`[Sync] Authenticator linked to User: ${user.email}`);
        }

        // 3. Handle Blockchain Certificate
        if (blockchainId || content) {
            // Check for duplicate by decrypting existing records for THIS user
            if (blockchainId) {
                const existingCerts = await (prisma as any).blockchainCertificate.findMany({
                    where: { userId: user.id }
                });

                const isDuplicate = existingCerts.some((cert: any) => {
                    if (!cert.blockchainId) return false;
                    try {
                        const decryptedId = decryptSecret(cert.blockchainId);
                        return decryptedId === blockchainId;
                    } catch (e) { return false; }
                });

                if (isDuplicate) {
                    return res.status(409).json({ error: 'Certificate Already Anchored' });
                }
            }

            const encryptedId = blockchainId ? encryptSecret(blockchainId) : null;
            await (prisma as any).blockchainCertificate.create({
                data: {
                    user: { connect: { id: user.id } },
                    blockchainId: encryptedId,
                    content: content || JSON.stringify({ id: blockchainId }),
                },
            });
            console.log(`[Sync] Certificate linked to User: ${user.email}`);
        }

        res.status(200).json({
            message: 'Vault synchronization success',
            userId: user.id
        });
    } catch (error) {
        console.error('[Sync] Fatal Error:', error);
        res.status(500).json({ error: 'Identity vault sync interrupted' });
    }
};

/**
 * Retrieves the full vault (Authenticators + Certificates) for a user.
 * GET /api/identity/vault/:email
 */
export const getVault = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User context missing' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                authenticators: {
                    orderBy: { createdAt: 'desc' }
                },
                certificates: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'Vault Not Found: Identity mismatch' });
        }

        res.status(200).json({
            authenticators: user.authenticators,
            certificates: user.certificates
        });
    } catch (error) {
        console.error('[Vault Fetch] Fatal Error:', error);
        res.status(500).json({ error: 'Failed to retrieve secure vault' });
    }
};
