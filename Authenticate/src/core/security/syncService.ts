import { getEnrolledCredentials } from './keychainService';
import { CONFIG } from '../../constants/Config';
import * as Keychain from 'react-native-keychain';

/**
 * Unified Sync Service
 * Ensures all scans (TOTP and Certificates) are vaulted to the backend
 * using the primary user email as the anchor.
 */
export const syncToBackend = async (payload: {
    totpSecret?: string;
    blockchainId?: string;
    content?: string;
    issuer?: string;
    label?: string;
    uri?: string;
}) => {
    try {
        const keychain = await Keychain.getGenericPassword();
        if (!keychain) {
            return { success: false, error: 'Unauthorized: No secure session found' };
        }

        const primaryEmail = keychain.username;
        const token = keychain.password;
        const BACKEND_URL = CONFIG.BASE_URL || 'https://certauth-backend.onrender.com';
        
        const finalPayload = {
            ...payload,
            email: primaryEmail,
        };

        console.log(`[SyncService] Vaulting data for anchor: ${primaryEmail}`);

        const response = await fetch(`${BACKEND_URL}/api/identity/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(finalPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const serverError = errorData.error || 'Identity Vault Interrupted';
            console.error(`[SyncService] Target Error: ${serverError}`);

            return {
                success: false,
                conflict: response.status === 409,
                error: serverError
            };
        }

        console.log(`[SyncService] Vaulted successfully to: ${primaryEmail}`);
        return { success: true };
    } catch (error: any) {
        console.error('[SyncService] Network Error:', error);
        return {
            success: false,
            error: error.message || 'Network sync failed'
        };
    }
};
