import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { MaterialCommunityIcons, AntDesign, FontAwesome } from '@expo/vector-icons';
import { LEGAL_LINKS } from '../constants/legalLinks';
import { authService } from '../services/auth/authService';
import { getDeviceIdentity } from '../services/auth/deviceIdentity';
// import { Checkbox } from 'expo-checkbox'; // Removed unused import to avoid dependency error

const { width } = Dimensions.get('window');

const SignUpScreen = ({ navigation }) => {
    // const { type = 'personal' } = route.params || {}; // Removed param usage
    const { loginWithGoogle, loginWithApple } = useAuth();
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name || !email || !password || !confirmPassword) {
            showToast("Please fill in all fields", 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast("Passwords do not match", 'error');
            return;
        }

        if (!agree) {
            showToast("Please agree to the Terms and Privacy", 'error');
            return;
        }

        setLoading(true);
        try {
            const metadata = await getDeviceIdentity();
            const otpResult = await authService.requestOtp({
                email,
                purpose: 'SIGNUP_VERIFY',
                metadata
            });
            setLoading(false);
            navigation.navigate('OtpVerification', {
                email,
                purpose: 'SIGNUP_VERIFY',
                title: 'Verify Your Email',
                subtitle: `We sent a 6-digit code to ${email}. Enter it to create your account.`,
                initialCooldownSeconds: Number(otpResult?.cooldownSeconds || 60),
                nextAction: {
                    type: 'signup',
                    email,
                    password,
                    name
                }
            });
        } catch (error) {
            setLoading(false);
            showToast(error?.message || "Unable to send verification code", 'error');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Image
                            source={require('../assets/images/header_shape.png')}
                            style={styles.headerShape}
                            resizeMode="stretch"
                        />
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.title}>Sign Up</Text>

                        <Input
                            label="Full Name"
                            placeholder="Enter your full name"
                            icon={<MaterialCommunityIcons name="account-outline" size={20} color={COLORS.secondary} />}
                            value={name}
                            onChangeText={setName}
                        />

                        <Input
                            label="Email Address"
                            placeholder="Enter your email..."
                            keyboardType="email-address"
                            icon={<MaterialCommunityIcons name="email-outline" size={20} color={COLORS.secondary} />}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />

                        <Input
                            label="Password"
                            placeholder="Enter your password..."
                            secureTextEntry
                            icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                            value={password}
                            onChangeText={setPassword}
                        />

                        <Input
                            label="Confirm password"
                            placeholder="Re-enter your password..."
                            secureTextEntry
                            icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <View style={styles.checkboxContainer}>
                            <TouchableOpacity
                                style={[styles.checkbox, agree && styles.checked]}
                                onPress={() => setAgree(!agree)}
                            >
                                {agree && <MaterialCommunityIcons name="check" size={14} color="white" />}
                            </TouchableOpacity>
                            <Text style={styles.checkboxLabel}>
                                I agree to the{' '}
                                <Text style={styles.boldLink} onPress={() => Linking.openURL(LEGAL_LINKS.terms)}>Terms</Text>
                                {' '}and{' '}
                                <Text style={styles.boldLink} onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}>Privacy</Text>
                            </Text>
                        </View>

                        <Button
                            title={loading ? "Creating account..." : "Sign up"}
                            onPress={handleSignUp}
                            disabled={!agree || loading}
                            style={styles.signUpButton}
                        />

                        <Text style={styles.orText}>Or continue with</Text>

                        <View style={styles.socialContainer}>
                            <TouchableOpacity style={styles.socialIcon} onPress={async () => {
                                const res = await loginWithGoogle();
                                if (!res?.success && !res?.cancelled) {
                                    showToast(res?.error || 'Google sign-in failed', 'error');
                                }
                            }}>
                                <AntDesign name="google" size={24} color="black" />
                            </TouchableOpacity>
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity style={styles.socialIcon} onPress={async () => {
                                    const res = await loginWithApple();
                                    if (!res?.success && !res?.cancelled) {
                                        showToast(res?.error || 'Apple sign-in failed', 'error');
                                    }
                                }}>
                                    <FontAwesome name="apple" size={24} color="black" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                                <Text style={styles.linkText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerShape: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '100%',
    },
    logo: {
        width: 60,
        height: 60,
        tintColor: COLORS.white,
        marginTop: 30,
    },
    formContainer: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.md,
        backgroundColor: '#F8F9FA',
    },
    title: {
        ...TYPOGRAPHY.h1,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: SPACING.md,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 4,
        marginRight: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checked: {
        backgroundColor: COLORS.primary,
    },
    checkboxLabel: {
        ...TYPOGRAPHY.caption,
        color: '#666',
    },
    boldLink: {
        fontWeight: 'bold',
        color: '#333',
    },
    signUpButton: {
        marginTop: SPACING.md,
    },
    orText: {
        textAlign: 'center',
        color: '#666',
        marginTop: SPACING.lg,
        fontSize: 14,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
        gap: SPACING.lg,
    },
    socialIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    footerText: {
        ...TYPOGRAPHY.caption,
        color: '#666',
    },
    linkText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.secondary,
        fontWeight: 'bold',
    },
});

export default SignUpScreen;
