import CryptoJS from 'crypto-js';
import { CONFIG } from '../constants/Config';

/**
 * Decrypts AES-256-CBC encrypted data string.
 * This is designed to match the backend's encryptSecret implementation.
 * 
 * @param {string} ciphertext - The base64/hex encrypted string from the vault.
 * @returns {string} - Decrypted plain text or error placeholder.
 */
// --- Security Configuration (Synchronized with Backend) ---
// Using exact 16-byte IV parsed as UTF-8
const STATIC_IV = CryptoJS.enc.Utf8.parse('3141592653589793');

/**
 * Encrypts a string using AES-256-CBC with raw key.
 */
export const encryptSecret = (data) => {
    if (!CONFIG.ENCRYPTION_KEY) return data;
    const key = CryptoJS.enc.Utf8.parse(CONFIG.ENCRYPTION_KEY);
    return CryptoJS.AES.encrypt(data, key, {
        iv: STATIC_IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    }).toString();
};

/**
 * Decrypts AES-256-CBC encrypted data string using a raw key.
 */
export const decryptSecret = (ciphertext) => {
    if (!CONFIG.ENCRYPTION_KEY) {
        console.warn('[Security] Missing ENCRYPTION_KEY in CONFIG');
        return null;
    }

    if (!ciphertext || typeof ciphertext !== 'string') return null;

    // --- HEURISTIC: Skip decryption for legacy plain-text data ---
    // If it starts with otpauth:// or contains spaces/special URI chars, it's not AES ciphertext
    if (ciphertext.startsWith('otpauth://') || ciphertext.includes(' ') || ciphertext.includes(':') && !ciphertext.includes('==')) {
        return ciphertext; 
    }

    try {
        const key = CryptoJS.enc.Utf8.parse(CONFIG.ENCRYPTION_KEY);
        
        // Explicitly parse as Base64 to handle raw ciphertext from Node.js crypto
        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: CryptoJS.enc.Base64.parse(ciphertext)
        });

        const bytes = CryptoJS.AES.decrypt(cipherParams, key, {
            iv: STATIC_IV,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });

        const originalText = bytes.toString(CryptoJS.enc.Utf8);

        if (!originalText) {
            // Likely legacy data that doesn't look like a URI but isn't encrypted correctly
            return ciphertext;
        }

        return originalText;
    } catch (error) {
        // Quietly return the original text if decryption fails (likely legacy data)
        return ciphertext;
    }
};
