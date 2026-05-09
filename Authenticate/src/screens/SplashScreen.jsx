import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Image,
    StatusBar,
    Dimensions,
} from 'react-native';
import * as Keychain from 'react-native-keychain';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
    withRepeat,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');
const LOGO = require('../assets/logo.jpg');

const SplashScreen = ({ navigation }) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.8);
    const textOpacity = useSharedValue(0);
    const subTextOpacity = useSharedValue(0);
    const pulse = useSharedValue(1);

    useEffect(() => {
        // Logo Animation
        opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.exp) });
        scale.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(1.5)) });

        // Branding Text Animation
        textOpacity.value = withDelay(800, withTiming(1, { duration: 1000 }));
        subTextOpacity.value = withDelay(1400, withTiming(1, { duration: 1000 }));

        // Subtle Pulse for Luxury Feel
        pulse.value = withDelay(1200, withRepeat(
            withSequence(
                withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        ));

        // Navigate to Home after sequence
        // Navigate after sequence
        const timeout = setTimeout(async () => {
            try {
                const credentials = await Keychain.getGenericPassword();
                if (credentials) {
                    navigation.replace('Home');
                } else {
                    navigation.replace('Login');
                }
            } catch (error) {
                navigation.replace('Login');
            }
        }, 3200);

        return () => clearTimeout(timeout);
    }, []);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value * pulse.value }],
    }));

    const animatedTextStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: (1 - textOpacity.value) * 10 }],
    }));

    const animatedSubTextStyle = useAnimatedStyle(() => ({
        opacity: subTextOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000" />

            <View style={styles.content}>
                <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                    <Image source={LOGO} style={styles.logo} />
                </Animated.View>

                <View style={styles.textBlock}>
                    <Animated.Text style={[styles.brandText, animatedTextStyle]}>
                        EtherXAUTH
                    </Animated.Text>

                    <Animated.View style={[styles.subTextBlock, animatedSubTextStyle]}>
                        <Text style={styles.separator}>Scan • Store • Secure</Text>
                    </Animated.View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}></Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        zIndex: 2,
        borderRadius: 60,
    },
    logoGlow: { // Removed
        display: 'none',
    },
    textBlock: {
        alignItems: 'center',
    },
    brandText: {
        color: COLORS.primary,
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 4,
        textShadowColor: 'rgba(212, 175, 55, 0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    subTextBlock: {
        marginTop: 12,
        alignItems: 'center',
    },
    separator: {
        color: COLORS.textHint,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(212, 175, 55, 0.4)',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 3,
    },
});

export default SplashScreen;
