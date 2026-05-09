import type { Request, Response } from 'express';
/**
 * Syncs identity data from mobile app to backend.
 * POST /api/identity/sync
 */
export declare const syncIdentity: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=identityController.d.ts.map