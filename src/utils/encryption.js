import CryptoJS from 'crypto-js';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_32_characters_long_!!';
/**
 * Encrypts a string using AES-256.
 * @param data The string to encrypt.
 * @returns The base64 encoded encrypted string.
 */
export const encryptSecret = (data) => {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};
/**
 * Decrypts an AES-256 encrypted string.
 * @param encryptedData The base64 encoded encrypted string.
 * @returns The decrypted string.
 */
export const decryptSecret = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};
//# sourceMappingURL=encryption.js.map