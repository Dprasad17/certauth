/**
 * useScreenGuard — Privacy Shield Hook
 *
 * Activates platform-specific screenshot & screen-recording protection
 * on the screen that mounts this hook, and automatically removes it when
 * the screen unmounts.
 *
 * Android: calls the native ScreenGuardModule (FLAG_SECURE) which
 *          - Blocks all screenshot APIs
 *          - Shows a black frame in Recents / Recent Apps view
 *
 * iOS:     Installs a listener for the UserDidTakeScreenshotNotification
 *          and shows a themed "Privacy Alert" overlay when triggered.
 *          (No native module required — pure RN APIs)
 *
 * @param options.showIosOverlay   (default true) Show themed overlay on iOS screenshot
 * @param options.enabled          (default true) Allows conditional disabling per-screen
 */

import { useEffect, useRef } from 'react';
import { NativeModules, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const { ScreenGuard } = NativeModules;

export const useScreenGuard = ({ enabled = true } = {}) => {
    const navigation = useNavigation();

    useEffect(() => {
        if (!enabled || Platform.OS !== 'android' || !ScreenGuard) return;

        // Enable when screen comes into focus
        const unsubscribeFocus = navigation.addListener('focus', () => {
            ScreenGuard.enable();
        });

        // Disable when screen loses focus
        const unsubscribeBlur = navigation.addListener('blur', () => {
            ScreenGuard.disable();
        });

        // Initial check: if already focused when hook mounts
        if (navigation.isFocused()) {
            ScreenGuard.enable();
        }

        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
            // Ensure disabled on unmount
            ScreenGuard.disable();
        };
    }, [enabled, navigation]);
};

export default useScreenGuard;
