import CryptoJS from 'crypto-js';

let _cachedKey: string | null = null;

const getEncryptionKey = (): string => {
    if (_cachedKey) return _cachedKey;
    
    const key = process.env.ENCRYPTION_KEY;
    if (key) {
        console.log(`[Security] Production key detected (Length: ${key.length})`);
        _cachedKey = key;
        return key;
    }
    
    console.warn('[Security] WARNING: Using fallback encryption key. Data will be insecure!');
    return 'default_key_32_characters_long_!!';
};

/**
 * Encrypts a string using AES-256.
 * @param data The string to encrypt.
 * @returns The base64 encoded encrypted string.
 */
export const encryptSecret = (data: string): string => {
    return CryptoJS.AES.encrypt(data, getEncryptionKey()).toString();
};

/**
 * Decrypts an AES-256 encrypted string.
 * @param encryptedData The base64 encoded encrypted string.
 * @returns The decrypted string.
 */
export const decryptSecret = (encryptedData: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, getEncryptionKey());
    return bytes.toString(CryptoJS.enc.Utf8);
};
