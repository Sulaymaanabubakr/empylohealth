import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { auth, app } from '../services/firebaseConfig';
import { authService } from '../services/auth/authService';

const TwoFactorSignInScreen = ({ navigation }) => {
    const resolver = authService.getPendingMfaResolver();
    const [selectedHint, setSelectedHint] = useState(resolver?.hints?.[0] || null);
    const [otp, setOtp] = useState(Array(6).fill(''));
    const [verificationId, setVerificationId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const recaptchaVerifier = useRef(null);

    const otpValue = otp.join('');
    const isSms = selectedHint?.factorId === 'phone';

    useEffect(() => {
        const init = async () => {
            if (!resolver || !selectedHint) return;
            if (isSms) {
                const id = await authService.startSmsMfaSignIn(selectedHint, recaptchaVerifier.current);
                setVerificationId(id);
            }
        };

        init().catch((error) => {
            console.error('MFA sign-in init failed', error);
            Alert.alert('Error', error.message || 'Unable to start MFA sign-in.');
        });
    }, [resolver, selectedHint, isSms]);

    const handleVerify = async () => {
        if (!resolver || !selectedHint) {
            Alert.alert('Error', 'No MFA session found. Please sign in again.');
            navigation.goBack();
            return;
        }

        if (otpValue.length < 6) {
            Alert.alert('Invalid code', 'Enter the 6-digit code.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isSms) {
                if (!verificationId) {
                    throw new Error('Verification code not sent.');
                }
                await authService.resolveSmsMfaSignIn(verificationId, otpValue);
            } else {
                await authService.resolveTotpMfaSignIn(selectedHint, otpValue);
            }
            navigation.replace('Dashboard');
        } catch (error) {
            console.error('MFA sign-in failed', error);
            Alert.alert('Error', error.message || 'Unable to sign in.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (!selectedHint) return;
        try {
            const id = await authService.startSmsMfaSignIn(selectedHint, recaptchaVerifier.current);
            setVerificationId(id);
            Alert.alert('Code sent', 'Check your phone for the verification code.');
        } catch (error) {
            Alert.alert('Error', error.message || 'Unable to resend code.');
        }
    };

    if (!resolver || !selectedHint) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>Multi-factor session expired. Please sign in again.</Text>
                    <TouchableOpacity style={styles.verifyButton} onPress={() => navigation.replace('SignIn')}>
                        <Text style={styles.verifyButtonText}>Back to Sign In</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={app.options}
                attemptInvisibleVerification
            />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Two-Factor Sign In</Text>
                <Text style={styles.instruction}>
                    {isSms
                        ? 'Enter the verification code sent to your phone.'
                        : 'Enter the 6-digit code from your authenticator app.'}
                </Text>

                <Text style={styles.enterCodeLabel}>Enter 6 digit code</Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            style={styles.otpInput}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(text) => {
                                const next = [...otp];
                                next[index] = text;
                                setOtp(next);
                            }}
                        />
                    ))}
                </View>

                {isSms && (
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn't receive code? </Text>
                        <TouchableOpacity onPress={handleResend}>
                            <Text style={styles.resendLink}>Resend</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.verifyButton} onPress={handleVerify} disabled={isSubmitting}>
                    <Text style={styles.verifyButtonText}>{isSubmitting ? 'Verifying...' : 'Verify'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        alignSelf: 'flex-start',
        marginBottom: 24,
    },
    instruction: {
        fontSize: 14,
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    enterCodeLabel: {
        fontSize: 14,
        color: '#424242',
        marginBottom: 16,
    },
    otpContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    otpInput: {
        width: 40,
        height: 50,
        backgroundColor: '#E0E0E0',
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#757575',
    },
    resendLink: {
        fontSize: 14,
        color: '#009688',
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    verifyButton: {
        backgroundColor: '#4DB6AC',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 24,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyText: {
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 20,
    },
});

export default TwoFactorSignInScreen;
