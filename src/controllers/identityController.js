import { PrismaClient } from '@prisma/client';
import { encryptSecret } from '../utils/encryption.js';
const prisma = new PrismaClient();
/**
 * Syncs identity data from mobile app to backend.
 * POST /api/identity/sync
 */
export const syncIdentity = async (req, res) => {
    const { email, blockchainId, totpSecret } = req.body;
    if (!email || !blockchainId || !totpSecret) {
        return res.status(400).json({ error: 'Missing required fields: email, blockchainId, totpSecret' });
    }
    try {
        const encryptedBlockchainId = encryptSecret(blockchainId);
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                blockchainId: encryptedBlockchainId,
                totpSecret: totpSecret,
            },
            create: {
                email,
                blockchainId: encryptedBlockchainId,
                totpSecret: totpSecret,
            },
        });
        res.status(200).json({ message: 'Identity synced successfully', userId: user.id });
    }
    catch (error) {
        console.error('Error syncing identity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
//# sourceMappingURL=identityController.js.map