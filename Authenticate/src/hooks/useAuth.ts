import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

/**
 * HOOK: useAuth
 * Purpose: Manages the Biometric Master Key state with strict anti-reloop logic.
 * Updates: 
 * 1. Removed lock-on-blur to prevent Android lifecycle crashes.
 * 2. Added 500ms transition delay to allow system UI to dismiss before rendering Dashboard.
 */
export const useAuth = (isEnrolled: boolean) => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const authRequestInProgress = useRef(false);

    const authenticate = useCallback(async () => {
        if (authRequestInProgress.current) return;

        try {
            authRequestInProgress.current = true;
            setIsAuthenticating(true);

            const { available, biometryType } = await rnBiometrics.isSensorAvailable();

            if (available && biometryType) {
                const { success } = await rnBiometrics.simplePrompt({
                    promptMessage: 'Unlock Master Key',
                    cancelButtonText: 'Cancel'
                });

                if (success) {
                    // CRITICAL: Delay the state update to allow the Android Biometric 
                    // Activity to fully finish and return focus to the app. 
                    // This prevents the "Black Screen" race condition.
                    setTimeout(() => {
                        setIsUnlocked(true);
                    }, 500);
                }
            } else {
                setIsUnlocked(true);
            }
        } catch (error) {
            console.error('[useAuth] Biometric Prompt Error:', error);
        } finally {
            setIsAuthenticating(false);
            authRequestInProgress.current = false;
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (isEnrolled && !isUnlocked && !authRequestInProgress.current) {
                authenticate();
            }
            // Removed relock on blur for stability
        }, [isEnrolled, isUnlocked, authenticate])
    );

    return { isUnlocked, isAuthenticating, authenticate };
};
export default useAuth;
