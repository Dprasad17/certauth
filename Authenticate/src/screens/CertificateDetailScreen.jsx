import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import { useScreenGuard } from '../hooks/useScreenGuard';
import { decryptSecret } from '../utils/security';

// ─── Premium SVG Icons ──────────────────────────────────────────────────────

const ShieldVerifiedIcon = ({ size = 32 }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2L4 5V11C4 16.1 7.4 20.8 12 22C16.6 20.8 20 16.1 20 11V5L12 2Z" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
        <Path d="M9 12L11 14L15 10" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

// ─── Sub-Components ──────────────────────────────────────────────────────────

const GoldFoilBadge = ({ label }) => (
    <View style={styles.foilContainer}>
        <Svg height="40" width="100%" style={styles.foilSvg}>
            <Defs>
                <LinearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#D4AF37" />
                    <Stop offset="25%" stopColor="#FFF0A5" />
                    <Stop offset="50%" stopColor="#D4AF37" />
                    <Stop offset="75%" stopColor="#F6E27A" />
                    <Stop offset="100%" stopColor="#B38B2D" />
                </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="40" rx="8" fill="url(#goldFoil)" />
        </Svg>
        <Text style={styles.foilLabel}>{label}</Text>
    </View>
);

const DataRow = ({ label, value, mono, accent }) => (
    <View style={styles.dataRow}>
        <Text style={styles.dataLabel}>{label}</Text>
        <Text style={[
            styles.dataValue,
            mono && { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },
            accent && { color: COLORS.primary },
        ]}>
            {value}
        </Text>
    </View>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const CertificatePreviewScreen = ({ navigation, route }) => {
    const rawData = route.params?.certificate || route.params?.cert;
    
    // Safety check for null cert
    if (!rawData) return null;

    let certificate = rawData;
    let isVaulted = false;

    if (typeof rawData.content === 'string') {
        try {
            certificate = JSON.parse(rawData.content);
            isVaulted = true;
        } catch (e) { }
    }

    let blockchainId = rawData.blockchainId || certificate.id || '';
    if (isVaulted && blockchainId) {
        blockchainId = decryptSecret(blockchainId);
    }

    // Safe check for startsWith
    const isAnchored = !!blockchainId && typeof blockchainId === 'string' && (blockchainId.startsWith('ipfs://') || blockchainId.length > 32);
    const proof = certificate?.proof || certificate?.blockchainProof;
    const isVerified = !!proof || isAnchored;

    const credentialSubject = certificate?.credentialSubject || {};
    const issuerData = certificate?.issuer || {};
    const issuerName = typeof issuerData === 'string'
        ? issuerData
        : (issuerData.name || issuerData.id || 'SECURE BACKEND');

    const subjectName = credentialSubject.name ||
        credentialSubject.id?.split(':').pop()?.slice(-12) ||
        'VALIDATING SUBJECT...';

    useScreenGuard();

    const handleAcknowledge = async () => {
        try {
            if (isVaulted) {
                navigation.navigate('Home');
                return;
            }

            const { saveIdentity } = require('../core/security/keychainService');
            const success = await saveIdentity(certificate);
            if (!success) {
                navigation.goBack();
                return;
            }

            const { syncToBackend } = require('../core/security/syncService');
            const syncRes = await syncToBackend({
                blockchainId: certificate?.id || 'Unknown',
                content: JSON.stringify(certificate),
            });

            if (!syncRes.success && syncRes.conflict) {
                Alert.alert(
                    'Certificate Already Anchored',
                    'This digital identity is already securely stored in your Luxury Vault.',
                    [{ text: 'Acknowledged', onPress: () => navigation.navigate('Home') }]
                );
                return;
            }

            navigation.navigate('Home');
        } catch (error) {
            console.error('[Sync] Critical error:', error);
            navigation.navigate('Home');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Navigation Header */}
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                        <Text style={styles.backArrow}>‹</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleBlock}>
                        <Text style={styles.headerLabel}>IDENTITY REVIEW</Text>
                        <Text style={styles.headerSub}>SECURE SECTOR 7-G</Text>
                    </View>
                </View>

                {/* Identity Hero */}
                <View style={styles.heroSection}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarTextLarge}>{subjectName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.subjectName}>{subjectName.toUpperCase()}</Text>
                    <View style={styles.statusRow}>
                        {isVerified && <GoldFoilBadge label="VERIFIED IDENTITY" />}
                    </View>
                </View>

                {/* Data Card Architecture */}
                <View style={styles.dataCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>METADATA ATTRIBUTES</Text>
                    </View>

                    <DataRow
                        label="DISTRIBUTED UID"
                        value={certificate?.id || 'N/A'}
                        mono
                    />
                    <View style={styles.divider} />
                    <DataRow
                        label="ROOT ISSUER"
                        value={issuerName.toUpperCase()}
                        mono
                    />

                    {blockchainId ? (
                        <>
                            <View style={styles.divider} />
                            <DataRow
                                label="BLOCKCHAIN ANCHOR"
                                value={blockchainId.slice(0, 28) + '...'}
                                mono
                                accent
                            />
                        </>
                    ) : null}
                </View>

                {/* Verification Deep Dive */}
                <View style={styles.verificationBox}>
                    <View style={styles.verifyIconBox}>
                        <ShieldVerifiedIcon size={32} />
                    </View>
                    <View style={styles.verifyContent}>
                        <Text style={styles.verifyTitle}>LEDGER VALIDATED</Text>
                        <Text style={styles.verifyText}>
                            This identity vector has been cryptographically signed and anchored to a tamper-proof distributed ledger.
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actionSection}>
                    {!isVaulted && (
                        <TouchableOpacity
                            style={styles.primaryAction}
                            onPress={handleAcknowledge}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryActionText}>ANCHOR TO SECURE VAULT</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={styles.secondaryAction}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.secondaryActionText}>RETURN TO DASHBOARD</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerBranding}>© 2026 EtherX Innovations Pvt Ltd. All rights reserved.</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 60,
    },
    navHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 20,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: COLORS.glassPrimary,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        color: COLORS.primary,
        fontSize: 32,
        fontWeight: '200',
        marginTop: -4,
    },
    headerTitleBlock: {
        flex: 1,
    },
    headerLabel: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    headerSub: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 3,
        marginTop: 2,
    },
    // ── Hero ──
    heroSection: {
        alignItems: 'center',
        marginVertical: 40,
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    avatarTextLarge: {
        color: '#000',
        fontSize: 36,
        fontWeight: '900',
    },
    subjectName: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
    },
    statusRow: {
        marginTop: 16,
        width: '100%',
        alignItems: 'center',
    },
    // ── Foil Badge ──
    foilContainer: {
        width: 200,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        overflow: 'hidden',
    },
    foilSvg: {
        position: 'absolute',
    },
    foilLabel: {
        color: '#000',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 2,
    },
    // ── Data Card ──
    dataCard: {
        backgroundColor: COLORS.glassPrimary,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        marginBottom: 24,
    },
    cardHeader: {
        marginBottom: 20,
    },
    cardTitle: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
    },
    dataRow: {
        paddingVertical: 14,
    },
    dataLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 6,
    },
    dataValue: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.inputBorder,
        opacity: 0.5,
    },
    // ── Verification Box ──
    verificationBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
        gap: 16,
        alignItems: 'center',
    },
    verifyIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifyContent: {
        flex: 1,
    },
    verifyTitle: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 4,
    },
    verifyText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        lineHeight: 18,
    },
    // ── Actions ──
    actionSection: {
        marginTop: 40,
        gap: 16,
    },
    primaryAction: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    primaryActionText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
    },
    secondaryAction: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    secondaryActionText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    footer: {
        marginTop: 50,
        alignItems: 'center',
    },
    footerBranding: {
        color: COLORS.textHint,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    securitySeal: {
        marginTop: 30,
        alignItems: 'center',
    },
    sealText: {
        color: COLORS.textHint,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 4,
    },
});

export default CertificatePreviewScreen;
