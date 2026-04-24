import CryptoJS from 'crypto-js';

const getEncryptionKey = (): string => {
    return process.env.ENCRYPTION_KEY || 'default_key_32_characters_long_!!';
};

// --- Security Configuration (Synchronized with Frontend) ---
// We use a static IV for the vault to ensure cross-platform compatibility 
// between Node.js and React Native's CryptoJS.
const STATIC_IV = CryptoJS.enc.Utf8.parse('3141592653589793'); // 16-byte IV

/**
 * Encrypts a string using AES-256-CBC with a raw key.
 */
export const encryptSecret = (data: string): string => {
    const key = CryptoJS.enc.Utf8.parse(getEncryptionKey());
    const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: STATIC_IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
};

/**
 * Decrypts an AES-256-CBC encrypted string.
 */
export const decryptSecret = (encryptedData: string): string => {
    const key = CryptoJS.enc.Utf8.parse(getEncryptionKey());
    const bytes = CryptoJS.AES.decrypt(encryptedData, key, {
        iv: STATIC_IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return bytes.toString(CryptoJS.enc.Utf8);
};
