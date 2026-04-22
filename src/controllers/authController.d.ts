import type { Request, Response } from 'express';
/**
 * Verifies OTP and returns JWT.
 * POST /api/auth/verify-otp
 */
export declare const verifyOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=authController.d.ts.map