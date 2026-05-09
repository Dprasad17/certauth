import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Vibration,
    StatusBar,
    ToastAndroid,
    Platform,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import { useTotp } from '../hooks/useTotp';
import { useScreenGuard } from '../hooks/useScreenGuard';
import { decryptSecret } from '../utils/security';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TOTPDetailScreen = ({ route, navigation }) => {
    const { item } = route.params;
    const { secret, account, uri } = item;

    // Decrypt the URI if it's coming from the encrypted vault
    const decryptedUri = decryptSecret(uri) || uri;
    const issuer = decryptedUri?.match(/issuer=([^&]+)/)?.[1] || 'Digital Identity';
    const { code, remaining } = useTotp(secret, issuer);

    // Enable privacy shield for this screen
    useScreenGuard();

    // ── Continuous Animation Setup ──
    const radius = 70;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Continuous smooth progress
        Animated.timing(progressAnim, {
            toValue: remaining / 30,
            duration: 900, // Smooth transition every tick
            easing: Easing.linear,
            useNativeDriver: true,
        }).start();

        // Pulse effect for low time (< 5s)
        if (remaining < 5) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 400, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [remaining]);

    const handleCopy = () => {
        Clipboard.setString(code);
        Vibration.vibrate(12);
        if (Platform.OS === 'android') {
            ToastAndroid.show('CODE SECURED TO CLIPBOARD', ToastAndroid.SHORT, ToastAndroid.CENTER);
        }
    };

    const formattedCode = code ? `${code.slice(0, 3)} ${code.slice(3)}` : '--- ---';
    const strokeDashoffset = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <View style={styles.headerTitle}>
                    <Text style={styles.issuerText}>{issuer.toUpperCase()}</Text>
                    <Text style={styles.accountText}>{account}</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                {/* Visual Architecture: Hero Hero */}
                <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Svg width={200} height={200} style={styles.svg}>
                        <Defs>
                            <LinearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <Stop offset="0%" stopColor="#F5C542" />
                                <Stop offset="50%" stopColor="#D4AF37" />
                                <Stop offset="100%" stopColor="#B38B2D" />
                            </LinearGradient>
                        </Defs>
                        {/* Background track */}
                        <Circle
                            cx="100"
                            cy="100"
                            r={radius}
                            stroke={COLORS.border}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            opacity={0.3}
                        />
                        {/* Animated gold track */}
                        <AnimatedCircle
                            cx="100"
                            cy="100"
                            r={radius}
                            stroke="url(#goldGrad)"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform="rotate(-90 100 100)"
                        />
                    </Svg>
                    <View style={styles.timerTextContainer}>
                        <Text style={[styles.remainingText, remaining < 5 && { color: '#FF4444' }]}>
                            {Math.round(remaining)}S
                        </Text>
                    </View>
                </Animated.View>

                {/* Hero Code Display */}
                <TouchableOpacity
                    onPress={handleCopy}
                    activeOpacity={0.7}
                    style={styles.codeButton}
                >
                    <View style={styles.codeWrapper}>
                        <Text style={styles.otpText}>{formattedCode}</Text>
                        <View style={styles.copyIndicator}>
                            <Text style={styles.copyLabel}>TAP TO COPY</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.securitySeal}>
                    <View style={styles.sealLine} />
                    <Text style={styles.sealMessage}>
                        Identity verification rotating. DO NOT SHARE this code with unauthorized vectors or third-party actors.
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerBranding}>© 2026 EtherX Innovations Pvt Ltd. All rights reserved.</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        height: 80,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.glassPrimary,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    backIcon: {
        color: COLORS.primary,
        fontSize: 32,
        fontWeight: '200',
        marginTop: -4,
    },
    headerTitle: {
        alignItems: 'center',
    },
    issuerText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 3,
    },
    accountText: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    timerContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
    },
    svg: {
        position: 'absolute',
    },
    timerTextContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    remainingText: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    codeButton: {
        width: '100%',
    },
    codeWrapper: {
        backgroundColor: COLORS.glassPrimary,
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderStyle: 'dashed',
    },
    otpText: {
        fontSize: 60,
        fontWeight: '900',
        color: COLORS.primary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        letterSpacing: 4,
    },
    copyIndicator: {
        marginTop: 20,
        backgroundColor: COLORS.goldAlpha15,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    copyLabel: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    securitySeal: {
        marginTop: 80,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    sealLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 16,
    },
    sealLine: {
        height: 1,
        width: 60,
        backgroundColor: COLORS.inputBorder,
        marginBottom: 16,
    },
    sealMessage: {
        color: COLORS.textMuted,
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '500',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    footerBranding: {
        color: COLORS.textHint,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default TOTPDetailScreen;
