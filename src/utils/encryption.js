import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const STATIC_IV = '3141592653589793';

export const encryptSecret = (data) => {
    try {
        const key = Buffer.from(ENCRYPTION_KEY, 'utf8');
        const iv = Buffer.from(STATIC_IV, 'utf8');
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    } catch (error) {
        console.error('[Encryption] Fatal Error:', error);
        return data;
    }
};

export const decryptSecret = (encryptedData) => {
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