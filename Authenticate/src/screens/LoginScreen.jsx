import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';
import { COLORS } from '../constants/theme';
import { CONFIG } from '../constants/Config';

const LOGO = require('../assets/logo.jpg');

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Securely store JWT and user email in Keychain
                await Keychain.setGenericPassword(data.user.email, data.token);
                navigation.replace('Home');
            } else {
                Alert.alert('Login Failed', data.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('[Login] Network error:', error);
            Alert.alert('Network Error', 'Could not reach the secure vault server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Image source={LOGO} style={styles.logo} />
                        <Text style={styles.brandTitle}>EtherXAUTH</Text>
                        <Text style={styles.subtitle}>SECURE VAULT ACCESS</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>E-MAIL ADDRESS</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="johndoe@gmail.com"
                                placeholderTextColor={COLORS.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                underlineColorAndroid="transparent"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>ENTER PASSWORD</Text>
                            <View style={styles.passwordWrapper}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="••••••••"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    underlineColorAndroid="transparent"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeButton}
                                >
                                    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                        {showPassword ? (
                                            <>
                                                <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <Circle cx="12" cy="12" r="3" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </>
                                        ) : (
                                            <>
                                                <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <Path d="M1 1l22 22" stroke={COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </>
                                        )}
                                    </Svg>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.loginButtonText}>AUTHORIZE LOGIN</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.signupLink}
                            onPress={() => navigation.navigate('Signup')}
                        >
                            <Text style={styles.signupLinkText}>
                                NEW AGENT? <Text style={{ color: COLORS.primary }}>ENROLL IDENTITY</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 EtherX Innovations Pvt. Ltd All rights reserved.</Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    flex: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
    header: { alignItems: 'center', marginBottom: 48 },
    logo: { width: 80, height: 80, borderRadius: 40, marginBottom: 20 },
    brandTitle: { color: COLORS.primary, fontSize: 32, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: COLORS.textMuted, fontSize: 10, fontWeight: '900', letterSpacing: 4, marginTop: 8 },
    form: { width: '100%' },
    inputContainer: { marginBottom: 24 },
    inputLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 10, marginLeft: 4 },
    input: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 18,
        color: '#FFF',
        fontSize: 16
    },
    inputContainer: {
        marginBottom: 24,
        backgroundColor: '#000',
        borderRadius: 14,
    },
    passwordWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 14,
        overflow: 'hidden',
    },
    passwordInput: {
        flex: 1,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 18,
        color: '#FFF',
        fontSize: 16,
    },
    eyeButton: {
        paddingRight: 16,
        paddingLeft: 10,
    },
    loginButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 20, alignItems: 'center', marginTop: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    loginButtonText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    signupLink: { marginTop: 24, alignItems: 'center' },
    signupLinkText: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    footer: { paddingBottom: 20, alignItems: 'center' },
    footerText: { color: COLORS.textHint, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
});

export default LoginScreen;
