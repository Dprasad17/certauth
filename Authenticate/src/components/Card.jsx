import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import { decryptSecret } from '../utils/security';

/**
 * Interactive Scale & Glow Wrapper for Luxury Tactile Feedback
 */
const InteractiveCard = ({ children, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0.96,
                useNativeDriver: true,
                speed: 40,
                bounciness: 8,
            }),
            Animated.timing(glowAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 40,
                bounciness: 12,
            }),
            Animated.timing(glowAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const animatedGlow = {
        shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.4],
        }),
        shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [5, 15],
        }),
        borderColor: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [COLORS.inputBorder, COLORS.primary],
        }),
        backgroundColor: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [COLORS.glassPrimary, 'rgba(212, 175, 55, 0.1)'],
        }),
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.9}
            >
                <Animated.View style={[styles.listTile, animatedGlow]}>
                    {children}
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

/**
 * Luxury Gold Foil Avatar
 */
const GoldFoilAvatar = ({ label }) => (
    <View style={styles.avatar}>
        <Svg height="44" width="44" style={styles.foilSvg}>
            <Defs>
                <LinearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#D4AF37" />
                    <Stop offset="25%" stopColor="#FFF0A5" />
                    <Stop offset="50%" stopColor="#D4AF37" />
                    <Stop offset="75%" stopColor="#F6E27A" />
                    <Stop offset="100%" stopColor="#B38B2D" />
                </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="44" height="44" rx="22" fill="url(#goldFoil)" />
        </Svg>
        <Text style={styles.avatarText}>{label}</Text>
    </View>
);

/**
 * Luxury List Tile - TOTP Card
 */
export const TotpCard = ({ uri, account, onPress }) => {
    // Decrypt the URI if it's coming from the encrypted vault
    const decryptedUri = decryptSecret(uri) || uri;
    const issuer = decryptedUri?.match(/issuer=([^&]+)/)?.[1] || 'Digital Identity';
    const initial = issuer.charAt(0).toUpperCase();

    return (
        <InteractiveCard onPress={onPress}>
            {/* Left: Luxury Avatar */}
            <GoldFoilAvatar label={initial} />

            {/* Center: Essential Info */}
            <View style={styles.content}>
                <Text style={styles.issuerText}>{issuer}</Text>
                <Text style={styles.accountText} numberOfLines={1}>{account}</Text>
            </View>

            {/* Right: Gold Action Indicator */}
            <View style={styles.rightAction}>
                <Text style={styles.chevron}>›</Text>
            </View>
        </InteractiveCard>
    );
};

/**
 * Luxury List Tile - Certificate Card
 */
export const CertificateCard = ({ cert, onPress }) => {
    // 1. Safety check for cert object
    if (!cert) return null;

    // 2. Defensive Decryption
    const decryptedId = cert.blockchainId ? decryptSecret(cert.blockchainId) : null;

    // 3. Robust JSON-LD Parser for identity names
    let content = {};
    try {
        if (cert.content) {
            content = typeof cert.content === 'string' ? JSON.parse(cert.content) : cert.content;
        }
    } catch (e) {
        console.warn('[CertificateCard] Failed to parse content JSON');
    }

    const subjectName = content?.credentialSubject?.name ||
        content?.id?.split(':').pop()?.slice(-12) ||
        'Secure Identity';

    // Safe check for startsWith
    const isIpfs = (decryptedId && typeof decryptedId === 'string') ? decryptedId.startsWith('ipfs://') : false;

    return (
        <InteractiveCard onPress={onPress || (() => { })}>
            {/* Left: Identity Avatar */}
            <GoldFoilAvatar label="V" />

            {/* Center: Identity Info */}
            <View style={styles.content}>
                <Text style={styles.issuerText}>{subjectName.toUpperCase()}</Text>
                <Text style={styles.accountText} numberOfLines={1}>
                    {isIpfs ? 'IPFS Blockchain Identity' : 'Secure Distributed Ledger'}
                </Text>
            </View>

            {/* Right: Gold Indicator */}
            <View style={styles.rightAction}>
                <Text style={styles.chevron}>›</Text>
            </View>
        </InteractiveCard>
    );
};

const styles = StyleSheet.create({
    listTile: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        // Premium soft inner glow
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
    },
    foilSvg: {
        position: 'absolute',
    },
    avatarText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '900',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    issuerText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    accountText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    rightAction: {
        marginLeft: 12,
    },
    chevron: {
        color: COLORS.primary,
        fontSize: 28,
        fontWeight: '300',
        lineHeight: 28,
    },
});
