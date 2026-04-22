import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { encryptSecret, decryptSecret } from '../utils/encryption.js';

/**
 * Syncs identity data from mobile app to backend.
 * Refactored for Multi-Identity Relational Vault.
 * POST /api/identity/sync
 */
export const syncIdentity = async (req: Request, res: Response) => {
    const {
        blockchainId,
        content,
        totpSecret,
        label,
        issuer
    } = req.body;

    // VALIDATION HARDENING: Prevent 'Unnamed' ghost records but allow Certificates
    const isTotpSync = totpSecret && totpSecret.length > 0 && !blockchainId;
    if (isTotpSync && (!req.body.uri || req.body.uri === '')) {
        return res.status(400).json({ error: 'Sync Failed: Missing required URI for TOTP enrollment' });
    }

    // ARCHITECTURAL HARD-ANCHOR: Strictly use primary email identity
    const PRIMARY_EMAIL = 'durgacit1704@gmail.com';
    const emailToUse = PRIMARY_EMAIL;

    try {
        // 1. Enforce Primary User (Unified Anchor)
        const user = await prisma.user.upsert({
            where: { email: emailToUse },
            update: {},
            create: { email: emailToUse },
        });

        // 2. Handle TOTP Authenticator (Auto-mapping)
        if (totpSecret) {
            // Priority: Explicit issuer -> Parsed from URI -> URI Path Fallback
            let finalIssuer = issuer;
            if ((!finalIssuer || finalIssuer === 'Unknown') && req.body.uri) {
                // Improved extraction: checks query param first, then the string between totp/ and :
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
            console.log(`[Sync] Authenticator linked to primary identity: ${emailToUse} (Issuer: ${finalIssuer})`);
        }

        // 3. Handle Blockchain Certificate (JSON-LD Link with Duplicate Check)
        if (blockchainId || content) {
            // DUPLICATE PREVENTION: Check if this user already has this blockchainId anchored
            if (blockchainId) {
                const existingCerts = await (prisma as any).blockchainCertificate.findMany({
                    where: { userId: user.id }
                });

                const isDuplicate = existingCerts.some((cert: any) => {
                    if (!cert.blockchainId) return false;
                    try {
                        const decryptedId = decryptSecret(cert.blockchainId);
                        return decryptedId === blockchainId;
                    } catch (e) {
                        return false;
                    }
                });

                if (isDuplicate) {
                    console.log(`[Sync] Conflict: Certificate ${blockchainId} already anchored for ${emailToUse}`);
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
            console.log(`[Sync] Certificate linked to primary identity: ${emailToUse}`);
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
