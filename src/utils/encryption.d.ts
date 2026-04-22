/**
 * Encrypts a string using AES-256.
 * @param data The string to encrypt.
 * @returns The base64 encoded encrypted string.
 */
export declare const encryptSecret: (data: string) => string;
/**
 * Decrypts an AES-256 encrypted string.
 * @param encryptedData The base64 encoded encrypted string.
 * @returns The decrypted string.
 */
export declare const decryptSecret: (encryptedData: string) => string;
//# sourceMappingURL=encryption.d.ts.map