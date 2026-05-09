import { Router } from 'express';
import { verifyOTP } from '../controllers/authController.js';
import { syncIdentity } from '../controllers/identityController.js';
const router = Router();
// Identity Sync Endpoint
router.post('/identity/sync', syncIdentity);
// OTP Verification Endpoint
router.post('/auth/verify-otp', verifyOTP);
export default router;
//# sourceMappingURL=authRoutes.js.map