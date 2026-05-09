import { useState, useEffect, useCallback, useRef } from 'react';
import * as OTPAuth from 'otpauth';
import { decryptSecret } from '../utils/security';

/**
 * HOOK: useTotp
 * Purpose: A permissive TOTP generator for a "Relational Multi-Identity" system.
 * Features:
 *  1. Base32 Padding helper (8-char alignment with '=') - Ensures compatibility with short secrets.
 *  2. Independent Timer per instance.
 *  3. Uses 'otpauth' for high stability (permissive parsing).
 */

const padBase32 = (secret: string): string => {
    if (!secret) return '';
    // Strip spaces and normalize case
    const clean = secret.replace(/\s/g, '').toUpperCase();
    // Base32 padding: length must be multiple of 8
    const len = clean.length;
    const padding = (8 - (len % 8)) % 8;
    return clean + '='.repeat(padding);
};

export const useTotp = (secret: string | null, label: string = 'Account') => {
    const [code, setCode] = useState<string>('------');
    const [remaining, setRemaining] = useState<number>(30);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const generateCode = useCallback(() => {
        if (!secret) {
            setCode('------');
            return;
        }

        try {
            // 1. Decrypt the secret if it's coming from the encrypted cloud vault
            // If it's already plain text, decryptSecret is designed to return it as is or handle it.
            const decryptedSecret = decryptSecret(secret);
            
            if (!decryptedSecret) {
                setCode('000000');
                return;
            }

            // 2. Apply defensive Base32 padding as requested
            const paddedSecret = padBase32(decryptedSecret);

            const totp = new OTPAuth.TOTP({
                issuer: 'Vault',
                label: label,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                secret: paddedSecret,
            });

            const newCode = totp.generate();
            setCode(newCode);
        } catch (error) {
            console.warn('[useTotp] Failed to generate for:', label, error);
            setCode('000000'); // Return 000000 on failure as requested
        }
    }, [secret, label]);

    // Independent timer logic
    useEffect(() => {
        generateCode();

        intervalRef.current = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = 30 - (now % 30);
            setRemaining(timeLeft);

            if (now % 30 === 0) {
                generateCode();
            }
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [secret, generateCode]);

    return { code, remaining };
};

export default useTotp;
