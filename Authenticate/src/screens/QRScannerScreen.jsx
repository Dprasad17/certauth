import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
    useSharedValue,
} from 'react-native-reanimated';
import { parseOTPAuthURI } from '../utils/otpParser';
import { storeSecret } from '../core/security/keychainService';
import { COLORS } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const SCAN_SIZE = width * 0.68;
const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const QRScannerScreen = ({ navigation }) => {
    const isFocused = useIsFocused();
    const { hasPermission, requestPermission } = useCameraPermission();
    const [isActive, setIsActive] = useState(true);
    const device = useCameraDevice('back');
    const [errorType, setErrorType] = useState(null);

    const scanLineAnim = useSharedValue(0);

    useEffect(() => {
        if (!hasPermission) {
            requestPermission().then(granted => {
                if (!granted) setErrorType('permission');
            });
        }
        scanLineAnim.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, [hasPermission]);

    useEffect(() => {
        if (hasPermission && !device) {
            setErrorType('device');
        } else if (hasPermission && device) {
            setErrorType(null);
        }
    }, [hasPermission, device]);

    const isProcessingRef = React.useRef(false);

    const onCodeScanned = (codes) => {
        if (codes.length > 0 && isActive && isFocused && !isProcessingRef.current) {
            const qrData = codes[0].value;
            if (qrData) {
                isProcessingRef.current = true;
                handleUniversalScan(qrData);
            }
        }
    };

    /**
     * UNIVERSAL SCANNER LOGIC
     * 1. Check if the string is valid JSON (Blockchain Credential).
     * 2. Otherwise, treat as standard otpauth URI (Enrollment).
     */
    const handleUniversalScan = async (data) => {
        setIsActive(false);
        isProcessingRef.current = true;
        console.log('[Scanner] RECEIVED:', data);

        let finalData = data;

        // PHASE 2: DEEP REDIRECT RESOLVER & SCRAPER
        if (data.startsWith('http://') || data.startsWith('https://')) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const browserHeaders = {
                    'Accept': 'application/json, text/html, mapplication/xhtml+xml',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Mobile Safari/537.36',
                };

                let response = await fetch(data, {
                    method: 'GET',
                    headers: browserHeaders,
                    signal: controller.signal
                });

                const resolvedUrl = response.url;
                let contentType = response.headers.get('content-type') || '';
                let bodyText = await response.text();

                const tryProcessJson = (jsonString) => {
                    try {
                        const json = JSON.parse(jsonString);
                        if (json['credentialSubject'] || json['@context']) {
                            console.log('[Scanner] Scraper Success: Certificate Found');
                            navigation.navigate('CertificatePreview', { certificate: json });
                            return true;
                        }
                    } catch (e) { }
                    return false;
                };

                if (contentType.includes('application/json')) {
                    if (tryProcessJson(bodyText)) { clearTimeout(timeoutId); return; }
                }

                if (contentType.includes('text/html')) {
                    console.log('[Scanner] HTML Detected, searching for embedded data...');
                    const jsonLdMatch = bodyText.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
                    const dataVarMatch = bodyText.match(/window\.__DATA__\s*=\s*(\{[\s\S]*?\});/i);
                    const genericJsonMatch = bodyText.match(/(\{[\s\S]*"credentialSubject"[\s\S]*\})/i);
                    const extracted = (jsonLdMatch?.[1] || dataVarMatch?.[1] || genericJsonMatch?.[1] || '').trim();
                    if (extracted && tryProcessJson(extracted)) { clearTimeout(timeoutId); return; }
                }

                if (resolvedUrl.includes('me-qr.com') || resolvedUrl.includes('qr1.me-qr.com')) {
                    console.log('[Scanner] Deep Peeking redirect:', resolvedUrl);
                    const deepResponse = await fetch(resolvedUrl, {
                        method: 'GET',
                        headers: { ...browserHeaders, 'Accept': 'application/json' },
                        signal: controller.signal
                    });
                    const deepBody = await deepResponse.text();
                    if (tryProcessJson(deepBody)) { clearTimeout(timeoutId); return; }
                }

                clearTimeout(timeoutId);
                finalData = resolvedUrl;

            } catch (e) {
                console.log('[Scanner] Deep Scraper Error:', e);
            }
        }

        // STATIC JSON CHECK (Fallback)
        try {
            const potentialJson = JSON.parse(finalData);
            if (potentialJson['@context'] || potentialJson['credentialSubject']) {
                navigation.navigate('CertificatePreview', { certificate: potentialJson });
                return;
            }
        } catch (e) { }

        // ENROLLMENT LOGIC (otpauth://)
        const parsed = parseOTPAuthURI(finalData);
        if (parsed) {
            // Local Save
            const localSuccess = await storeSecret(parsed.label, parsed.secret);

            // Backend Sync (MANDATORY UNIFICATION)
            const { syncToBackend } = require('../core/security/syncService');
            const syncSuccess = await syncToBackend({
                totpSecret: parsed.secret,
                issuer: parsed.issuer || 'Unknown',
                label: parsed.label || 'Unnamed',
                uri: finalData,
            });

            if (localSuccess) {
                Alert.alert(
                    syncSuccess ? 'Vault Synced' : 'Local Vault Only',
                    `Identity authorized: ${parsed.label}.\n${syncSuccess ? 'Cloud backup secured.' : 'Network sync failed.'}`,
                    [{ text: 'Proceed', onPress: () => navigation.goBack() }]
                );
                return;
            }
        }

        // FINAL FALLBACK
        Alert.alert(
            'Unknown QR Format',
            'This QR code does not contain a valid Identity Certificate. It may be a standard webpage.',
            [{
                text: 'OK', onPress: () => {
                    setIsActive(true);
                    isProcessingRef.current = false;
                }
            }]
        );
    };

    const animatedScanLine = useAnimatedStyle(() => ({
        transform: [{ translateY: scanLineAnim.value * SCAN_SIZE }],
    }));

    // ── Error / Loading States ────────────────────────────────────────────────

    if (errorType === 'permission' || errorType === 'device') {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <View style={styles.errorCard}>
                    <Text style={styles.errorLabel}>[ SYSTEM ALERT ]</Text>
                    <Text style={styles.errorText}>
                        {errorType === 'permission' ? 'CAMERA ACCESS RESTRICTED' : 'NO OPTICAL SENSOR DETECTED'}
                    </Text>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.actionButtonText}>◆  RETURN TO DASHBOARD  ◆</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!device || !hasPermission) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.initText}>INITIALIZING OPTICAL SENSOR...</Text>
            </View>
        );
    }

    // ── Main Scanner UI ───────────────────────────────────────────────────────

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={isActive && isFocused}
                codeScanner={{
                    codeTypes: ['qr'],
                    onCodeScanned: onCodeScanned,
                }}
            />

            {/* Dark overlay */}
            <View style={styles.overlay}>

                {/* Top bar */}
                <View style={styles.topBar}>
                    <Text style={styles.topLabel}>◈ ETHERXAUTH SCANNER ◈</Text>
                    <Text style={styles.topSub}>IDENTITY ACQUISITION MODE</Text>
                </View>

                {/* Reticle */}
                <View style={styles.reticle}>
                    {/* Corners */}
                    <View style={[styles.corner, styles.tl]} />
                    <View style={[styles.corner, styles.tr]} />
                    <View style={[styles.corner, styles.bl]} />
                    <View style={[styles.corner, styles.br]} />

                    {/* Center cross-hair dots */}
                    <View style={styles.centerDot} />

                    {/* Animated scan line */}
                    <Animated.View style={[styles.scanLine, animatedScanLine]} />
                </View>

                {/* Bottom HUD */}
                <View style={styles.hud}>
                    <Text style={styles.instrLabel}>SCANNING FOR</Text>
                    <Text style={styles.instrText}>BLOCKCHAIN CERTIFICATE  ·  ENROLLMENT QR</Text>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cancelText}>✕  ABORT SCAN</Text>
                    </TouchableOpacity>

                    <Text style={styles.copyrightText}>© 2026 EtherX Innovations Pvt Ltd. All rights reserved.</Text>
                </View>
            </View>
        </View>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ── Overlay ──
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 52,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    // ── Top Bar ──
    topBar: {
        alignItems: 'center',
    },
    topLabel: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 4,
    },
    topSub: {
        color: COLORS.textHint,
        fontSize: 9,
        letterSpacing: 3,
        marginTop: 6,
        fontWeight: '600',
    },
    // ── Reticle ──
    reticle: {
        width: SCAN_SIZE,
        height: SCAN_SIZE,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: CORNER_SIZE,
        height: CORNER_SIZE,
        borderColor: COLORS.primary,
        borderWidth: CORNER_WIDTH,
    },
    tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    centerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(212, 175, 55, 0.5)',
        position: 'absolute',
    },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        elevation: 4,
    },
    // ── HUD ──
    hud: {
        alignItems: 'center',
    },
    instrLabel: {
        color: COLORS.textHint,
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 6,
    },
    instrText: {
        color: COLORS.textSecondary,
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
        marginBottom: 36,
    },
    cancelButton: {
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 2,
    },
    cancelText: {
        color: 'rgba(212, 175, 55, 0.7)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 3,
    },
    copyrightText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 8,
        fontWeight: '600',
        marginTop: 20,
        letterSpacing: 0.5,
    },
    // ── Error / Loading ──
    errorCard: {
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 32,
        borderRadius: 4,
        alignItems: 'center',
        marginHorizontal: 32,
        backgroundColor: '#0F0F13',
    },
    errorLabel: {
        color: COLORS.textHint,
        fontSize: 9,
        letterSpacing: 3,
        fontWeight: '700',
        marginBottom: 12,
    },
    errorText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
        textAlign: 'center',
        marginBottom: 28,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 2,
    },
    actionButtonText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2.5,
    },
    initText: {
        color: COLORS.textHint,
        fontSize: 10,
        letterSpacing: 3,
        fontWeight: '700',
        marginTop: 20,
    },
});

export default QRScannerScreen;
