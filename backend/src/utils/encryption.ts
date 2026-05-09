import crypto from 'crypto';

/**
 * ENCRYPTION_KEY must be exactly 32 characters for AES-256.
 * STATIC_IV must be exactly 16 characters for AES-256-CBC.
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const STATIC_IV = '3141592653589793';

/**
 * Encrypts a string using native Node.js crypto (AES-256-CBC).
 * This is perfectly compatible with CryptoJS on the frontend.
 */
export const encryptSecret = (data: string): string => {
    try {
        const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
        const iv = Buffer.from(STATIC_IV, 'utf8');
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (error) {
        console.error('[Encryption] Fatal Error:', error);
        return data; // Fallback
    }
};

/**
 * Decrypts an AES-256-CBC encrypted string.
 */
export const decryptSecret = (encryptedData: string): string => {
    try {
        const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
        const iv = Buffer.from(STATIC_IV, 'utf8');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        
        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('[Decryption] Fatal Error:', error);
        return '';
    }
};
