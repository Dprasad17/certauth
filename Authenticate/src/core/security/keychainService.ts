import * as Keychain from 'react-native-keychain';

/**
 * SERVICE: KeychainService
 * Stability Improvements: 
 * 1. Atomic Task Queue: Prevents concurrent DataStore access.
 * 2. Post-Biometric 500ms Delay: Allows Android OS to release file locks after UI transitions.
 */

let isProcessing = false;
const queue: (() => Promise<void>)[] = [];

const processQueue = async (): Promise<void> => {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    while (queue.length > 0) {
        const task = queue.shift();
        if (task) {
            try {
                await task();
            } catch (e) {
                console.error('[KeychainQueue] Fatal Error:', e);
            }
        }
    }

    isProcessing = false;
};

const runAtomic = <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        queue.push(async () => {
            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
        processQueue();
    });
};

/**
 * Standard delay to prevent DataStore collisions after biometric prompts.
 */
const stabilityDelay = (ms: number = 500): Promise<void> =>
    new Promise((res) => setTimeout(res, ms));

const STORAGE_KEY_TOTP = 'com.certauth.totp';
const STORAGE_KEY_IDENTITY = 'com.certauth.identity';

export const storeSecret = async (account: string, secret: string): Promise<boolean> => {
    if (!account || !secret || account.trim() === '' || secret.trim() === '') {
        console.warn('[Keychain] Refused: Empty account or secret');
        return false;
    }

    return runAtomic(async () => {
        try {
            await stabilityDelay(500);
            await Keychain.setGenericPassword(account, secret, {
                service: STORAGE_KEY_TOTP,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
            console.log(`[Keychain] SECURE_STORE_TOTP: ${account}`);
            return true;
        } catch (error: any) {
            console.error('[Keychain] TOTP_WRITE_ERROR:', error?.message);
            return false;
        }
    });
};

export const getEnrolledCredentials = async (): Promise<{ username: string; password: string } | null> => {
    return runAtomic(async () => {
        try {
            await stabilityDelay(500);
            const credentials = await Keychain.getGenericPassword({
                service: STORAGE_KEY_TOTP,
            });

            if (credentials) {
                return {
                    username: credentials.username,
                    password: credentials.password,
                };
            }
            return null;
        } catch (error: any) {
            console.error('[Keychain] TOTP_READ_ERROR:', error?.message);
            return null;
        }
    });
};

export const saveIdentity = async (identityData: any): Promise<boolean> => {
    if (!identityData) return false;

    return runAtomic(async () => {
        try {
            await stabilityDelay(500);
            // We store the JSON string in the password field, and '@identity' as username
            await Keychain.setGenericPassword('@identity', JSON.stringify(identityData), {
                service: STORAGE_KEY_IDENTITY,
                accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
            });
            console.log('[Keychain] IDENTITY_STORED');
            return true;
        } catch (error: any) {
            console.error('[Keychain] IDENTITY_WRITE_ERROR:', error?.message);
            return false;
        }
    });
};

export const getIdentity = async (): Promise<any | null> => {
    return runAtomic(async () => {
        try {
            await stabilityDelay(500);
            const credentials = await Keychain.getGenericPassword({
                service: STORAGE_KEY_IDENTITY,
            });

            if (credentials) {
                return JSON.parse(credentials.password);
            }
            return null;
        } catch (error: any) {
            console.error('[Keychain] IDENTITY_READ_ERROR:', error?.message);
            return null;
        }
    });
};

export const hasEnrolledDevice = async (): Promise<boolean> => {
    const creds = await getEnrolledCredentials();
    return !!creds;
};

export const resetEnrolledDevice = async (): Promise<boolean> => {
    return runAtomic(async () => {
        try {
            await stabilityDelay(500);
            // Reset both services
            await Keychain.resetGenericPassword({ service: STORAGE_KEY_TOTP });
            await Keychain.resetGenericPassword({ service: STORAGE_KEY_IDENTITY });
            console.log('[Keychain] COMPLETE_RESET');
            return true;
        } catch (error: any) {
            console.error('[Keychain] RESET_ERROR:', error?.message);
            return false;
        }
    });
};
