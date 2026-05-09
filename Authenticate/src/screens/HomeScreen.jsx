import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Animated,
    RefreshControl,
    Platform,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Keychain from 'react-native-keychain';
import { getEnrolledCredentials, getIdentity } from '../core/security/keychainService';
import { COLORS } from '../constants/theme';
import { CONFIG } from '../constants/Config';
import { useAuth } from '../hooks/useAuth';
import { useScreenGuard } from '../hooks/useScreenGuard';
import { TotpCard, CertificateCard } from '../components/Card';

const LOGO = require('../assets/logo.jpg');
const { width } = Dimensions.get('window');

// ─── Premium SVG Icons ──────────────────────────────────────────────────────

const ShieldIcon = ({ size = 24, color = COLORS.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 2L4 5V11C4 16.1 7.4 20.8 12 22C16.6 20.8 20 16.1 20 11V5L12 2Z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path d="M12 7V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="16" r="1.5" fill={color} />
    </Svg>
);

const VaultIcon = ({ size = 24, color = COLORS.primary }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="11" width="18" height="10" rx="2" stroke={color} strokeWidth="2" />
        <Path d="M7 11V7C7 4.2 9.2 2 12 2C14.8 2 17 4.2 17 7V11" stroke={color} strokeWidth="2" />
        <Circle cx="12" cy="16" r="2" stroke={color} strokeWidth="2" />
    </Svg>
);

const FadeInView = ({ children, delay = 0 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [delay]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {children}
        </Animated.View>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const HomeScreen = ({ navigation }) => {
    const [authenticators, setAuthenticators] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [userEmail, setUserEmail] = useState(null);
    const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [activeTab, setActiveTab] = useState('TOTP'); // 'TOTP' or 'CERT'
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);

    useScreenGuard();
    const { isUnlocked, authenticate } = useAuth(!!userEmail);

    // --- Tab Tap Handler ---
    const handleTabPress = (tab) => {
        const targetX = tab === 'TOTP' ? 0 : width;
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
        setActiveTab(tab);
    };

    // --- Offline Data Persistence Helpers ---
    const saveLocalVault = async (auths, certs) => {
        try {
            const vault = JSON.stringify({ authenticators: auths, certificates: certs, timestamp: Date.now() });
            await AsyncStorage.setItem('@vault_cache', vault);
        } catch (e) { console.warn('[Storage] Cache save failed:', e); }
    };

    const loadLocalVault = async () => {
        try {
            const vault = await AsyncStorage.getItem('@vault_cache');
            if (vault) {
                const { authenticators: a, certificates: c } = JSON.parse(vault);
                setAuthenticators(a || []);
                setCertificates(c || []);
                return true;
            }
        } catch (e) { console.warn('[Storage] Cache load failed:', e); }
        return false;
    };

    const fetchVaultData = async (email, token, silent = false) => {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/api/identity/vault/${email}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.authenticators) setAuthenticators(data.authenticators);
            if (data.certificates) setCertificates(data.certificates);

            setIsOffline(false);
            // Update cache with fresh cloud data
            saveLocalVault(data.authenticators || [], data.certificates || []);
        } catch (err) {
            console.warn('[Home] Network fetch failed, relying on cache');
            setIsOffline(true);
            // Logic to populate from keychain if cache is empty is already in useEffect
        }
    };

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            const checkVaultData = async () => {
                // 1. Load local cache first for instant UI
                await loadLocalVault();

                const [creds, idData, keychain] = await Promise.all([
                    getEnrolledCredentials(),
                    getIdentity(),
                    Keychain.getGenericPassword()
                ]);

                if (isActive) {
                    if (!keychain) {
                        navigation.replace('Login');
                        return;
                    }

                    const emailToFetch = keychain.username;
                    const token = keychain.password;
                    setUserEmail(emailToFetch);

                    // 2. Attempt to sync with Render
                    await fetchVaultData(emailToFetch, token);
                    setIsCheckingEnrollment(false);
                }
            };
            checkVaultData();
            return () => { isActive = false; };
        }, [])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        const keychain = await Keychain.getGenericPassword();
        if (keychain) {
            await fetchVaultData(keychain.username, keychain.password);
        }
        setRefreshing(false);
    }, []);

    // --- Loading State ---
    if (isCheckingEnrollment) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingLabel}>AUTHENTICATING</Text>
                    <Text style={styles.loadingText}>BOOTING SECURE ENCLAVE...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // --- Biometric Lock State ---
    if (!isUnlocked && userEmail) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000" />
                <View style={styles.lockedContainer}>
                    <View style={styles.lockIconContainer}>
                        <ShieldIcon size={64} color={COLORS.primary} />
                    </View>
                    <Text style={styles.lockedLabel}>ENCRYPTED SECTOR</Text>
                    <Text style={styles.lockedTitle}>VAULT LOCKED</Text>
                    <Text style={styles.lockedText}>
                        Identity verified users only. Access to cryptographic keys requires biometric authorization.
                    </Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={authenticate} activeOpacity={0.8}>
                        <Text style={styles.primaryButtonText}>AUTHORIZE ACCESS</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // --- Main Dashboard ---
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            {/* ── Offline Banner (Moved to top of the screen) ── */}
            {isOffline && (
                <Animated.View style={styles.offlineBanner}>
                    <Text style={styles.offlineText}>OFFLINE MODE: SHOWING LAST SYNCED DATA</Text>
                </Animated.View>
            )}

            <View style={{ flex: 1 }}>
                {/* ── Dashboard Header (Fixed) ── */}
                <View style={styles.headerFixed}>
                    <View style={styles.header}>
                        <View style={styles.brandRow}>
                            <Image source={LOGO} style={styles.logo} />
                            <Text style={[styles.brandLabel, { color: COLORS.primary }]}>EtherXAUTH</Text>
                        </View>
                        <TouchableOpacity style={styles.statusBox} onPress={() => navigation.navigate('Scanner')}>
                            <VaultIcon size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* ── Custom Tab Bar ── */}
                    <View style={styles.tabBar}>
                        {/* Sliding Indicator tied to scrollX */}
                        <Animated.View 
                            style={[
                                styles.slidingIndicator, 
                                { 
                                    transform: [{ 
                                        translateX: scrollX.interpolate({
                                            inputRange: [0, width],
                                            outputRange: [0, (width - 48 - 8) / 2] 
                                        }) 
                                    }] 
                                }
                            ]} 
                        />
                        
                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('TOTP')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabLabel, activeTab === 'TOTP' && styles.activeTabLabel]}>
                                AUTHENTICATORS
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.tabButton}
                            onPress={() => handleTabPress('CERT')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.tabLabel, activeTab === 'CERT' && styles.activeTabLabel]}>
                                CERTIFICATES
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Dynamic Section Header ── */}
                    <FadeInView key={activeTab + '-header'} delay={0}>
                        <Text style={styles.sectionHeader}>
                            {activeTab === 'TOTP' ? 'SECURED AUTHENTICATOR IDENTITIES' : 'SECURED BLOCKCHAIN CERTIFICATES'}
                        </Text>
                    </FadeInView>
                </View>

                {/* ── Horizontal Gesture Content ── */}
                <Animated.ScrollView
                    ref={scrollViewRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    onMomentumScrollEnd={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.x / width);
                        setActiveTab(index === 0 ? 'TOTP' : 'CERT');
                    }}
                    scrollEventThrottle={16}
                >
                    {/* PAGE 1: TOTP LIST */}
                    <View style={{ width }}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={COLORS.primary}
                                    colors={[COLORS.primary]}
                                />
                            }
                        >
                            <View style={styles.vaultSection}>
                                {authenticators.map((auth, idx) => (
                                    <FadeInView key={auth.id || `auth-${idx}`} delay={idx * 100}>
                                        <TotpCard
                                            uri={auth.uri}
                                            account={auth.label || 'Unnamed Account'}
                                            onPress={() => navigation.navigate('TOTPDetail', { item: auth })}
                                        />
                                    </FadeInView>
                                ))}
                                {authenticators.length === 0 && (
                                    <View style={styles.emptyPrompt}>
                                        <VaultIcon size={48} color={COLORS.textMuted} />
                                        <Text style={styles.emptyText}>No authenticators found in vault.</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>

                    {/* PAGE 2: CERTIFICATES LIST */}
                    <View style={{ width }}>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={COLORS.primary}
                                    colors={[COLORS.primary]}
                                />
                            }
                        >
                            <View style={styles.vaultSection}>
                                {certificates.map((cert, idx) => (
                                    <FadeInView key={cert.id || `cert-${idx}`} delay={idx * 100}>
                                        <CertificateCard
                                            cert={cert}
                                            onPress={() => navigation.navigate('CertificatePreview', { cert })}
                                        />
                                    </FadeInView>
                                ))}
                                {certificates.length === 0 && (
                                    <View style={styles.emptyPrompt}>
                                        <ShieldIcon size={48} color={COLORS.textMuted} />
                                        <Text style={styles.emptyText}>No certificates found in vault.</Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </Animated.ScrollView>

                {/* ── Floating Action Bar ── */}
                <View style={styles.floatingActionContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('Scanner')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>SCAN NEW IDENTITY OR CERT</Text>
                    </TouchableOpacity>
                </View>

                {/* --- Persistent Footer --- */}
                <View style={styles.footer}>
                    <Text style={styles.footerText} numberOfLines={1}>© 2026 EtherX Innovations Pvt Ltd. All rights reserved.</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 4,
        marginTop: 24,
    },
    loadingText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 140, // Account for floating button
    },
    headerFixed: {
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 32,
        height: 32,
        marginRight: 10,
        resizeMode: 'contain',
        borderRadius: 16,
    },
    brandLabel: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 1,
    },
    statusBox: {
        width: 50,
        height: 50,
        borderRadius: 14,
        backgroundColor: COLORS.glassPrimary,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vaultSection: {
        marginTop: 10,
    },
    // --- Tab Bar Styles ---
    tabBar: {
        flexDirection: 'row',
        marginBottom: 30,
        backgroundColor: COLORS.glassPrimary,
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        zIndex: 2,
    },
    slidingIndicator: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        width: '50%',
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        zIndex: 1,
    },
    tabLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    activeTabLabel: {
        color: COLORS.primary,
    },
    sectionHeader: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
        marginBottom: 20,
        marginLeft: 2,
    },
    offlineBanner: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        alignItems: 'center',
        width: '100%',
        zIndex: 100,
    },
    offlineText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    emptyPrompt: {
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: COLORS.glassPrimary,
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    emptyText: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 16,
        fontWeight: '600',
    },
    floatingActionContainer: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    actionRow: {
        marginTop: 30,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 20,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 3,
    },
    lockedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    lockIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.glassPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
    },
    lockedLabel: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 12,
    },
    lockedTitle: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 16,
    },
    lockedText: {
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        fontSize: 14,
        marginBottom: 48,
    },
    footer: {
        paddingBottom: 20,
        paddingTop: 10,
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textHint,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

export default HomeScreen;