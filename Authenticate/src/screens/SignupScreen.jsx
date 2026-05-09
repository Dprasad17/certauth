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
    ScrollView,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Keychain from 'react-native-keychain';
import { COLORS } from '../constants/theme';
import { CONFIG } from '../constants/Config';

const LOGO = require('../assets/logo.jpg');

const SignupScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all security fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Security mismatch', 'Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Securely store JWT and user email in Keychain
                await Keychain.setGenericPassword(data.user.email, data.token);
                Alert.alert('Identity Enrolled', 'Your secure vault has been created.', [
                    { text: 'CONTINUE', onPress: () => navigation.replace('Home') }
                ]);
            } else {
                Alert.alert('Enrollment Failed', data.error || 'Failed to create identity');
            }
        } catch (error) {
            console.error('[Signup] error:', error);
            Alert.alert('Network Error', 'Secure vault server is unreachable.');
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
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <Image source={LOGO} style={styles.logo} />
                            <Text style={styles.brandTitle}>EtherXAUTH</Text>
                            <Text style={styles.subtitle}>IDENTITY ENROLLMENT</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>E-mail Address</Text>
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
                                <Text style={styles.inputLabel}>PASSWORD</Text>
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

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="••••••••"
                                        placeholderTextColor={COLORS.textMuted}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        underlineColorAndroid="transparent"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.eyeButton}
                                    >
                                        <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                            {showConfirmPassword ? (
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
                                style={styles.signupButton}
                                onPress={handleSignup}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={styles.signupButtonText}>ENROLL NEW IDENTITY</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginLink}
                                onPress={() => navigation.goBack()}
                            >
                                <Text style={styles.loginLinkText}>
                                    ALREADY ENROLLED? <Text style={{ color: COLORS.primary }}>AUTHORIZE ACCESS</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, justifyContent: 'center' },
    content: { paddingHorizontal: 32, paddingVertical: 40 },
    header: { alignItems: 'center', marginBottom: 40 },
    logo: { width: 60, height: 60, borderRadius: 30, marginBottom: 16 },
    brandTitle: { color: COLORS.primary, fontSize: 28, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: COLORS.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 4, marginTop: 6 },
    form: { width: '100%' },
    inputContainer: { marginBottom: 20 },
    inputLabel: { color: COLORS.textMuted, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 8, marginLeft: 4 },
    input: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        color: '#FFF',
        fontSize: 15
    },
    inputContainer: {
        marginBottom: 20,
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
        paddingVertical: 16,
        color: '#FFF',
        fontSize: 15,
    },
    eyeButton: {
        paddingRight: 16,
        paddingLeft: 10,
    },
    signupButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginTop: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
    signupButtonText: { color: '#000', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
    loginLink: { marginTop: 24, alignItems: 'center' },
    loginLinkText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});

export default SignupScreen;
