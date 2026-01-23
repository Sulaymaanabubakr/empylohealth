import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import Button from '../components/Button';
import { authService } from '../services/auth/authService';
import { useToast } from '../context/ToastContext';

const TwoFactorSignInScreen = ({ navigation }) => {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [verificationId, setVerificationId] = useState('');
    const [step, setStep] = useState('send'); // 'send' or 'verify'
    const { showToast } = useToast();

    const resolver = authService.getPendingMfaResolver();
    const hints = resolver?.hints || [];

    const handleSendCode = async () => {
        if (hints.length === 0) {
            showToast("No MFA factors found", 'error');
            return;
        }
        setLoading(true);
        try {
            // Start MFA challenge for the first hint (typically SMS)
            const vid = await authService.startSmsMfaSignIn(hints[0], null); // null verifier for now
            setVerificationId(vid);
            setStep('verify');
            showToast("Verification code sent", 'success');
        } catch (error) {
            console.error(error);
            showToast(error.message || "Failed to send code", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length < 6) {
            showToast("Please enter a valid 6-digit code", 'error');
            return;
        }
        setLoading(true);
        try {
            await authService.resolveSmsMfaSignIn(verificationId, code);
            showToast("Signed in successfully", 'success');
            // Navigation will be handled by AuthContext state change
        } catch (error) {
            console.error(error);
            showToast(error.message || "Invalid code", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Two-Factor Authentication</Text>
                <Text style={styles.subtitle}>
                    {step === 'send'
                        ? "We'll send a code to your registered device"
                        : "Enter the code sent to your device"}
                </Text>

                {step === 'verify' && (
                    <TextInput
                        style={styles.input}
                        value={code}
                        onChangeText={setCode}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                    />
                )}

                <Button
                    title={loading ? "Processing..." : (step === 'send' ? "Send Code" : "Verify")}
                    onPress={step === 'send' ? handleSendCode : handleVerify}
                    disabled={loading}
                />

                <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SignIn')} style={styles.backButton}>
                    <Text style={styles.backText}>Back to Sign In</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content: { flex: 1, padding: SPACING.xl, justifyContent: 'center' },
    title: { ...TYPOGRAPHY.h1, marginBottom: SPACING.sm, textAlign: 'center' },
    subtitle: { ...TYPOGRAPHY.body, color: '#666', marginBottom: SPACING.xl, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        letterSpacing: 4
    },
    backButton: { marginTop: SPACING.lg, alignItems: 'center' },
    backText: { color: COLORS.secondary, fontWeight: 'bold' }
});

export default TwoFactorSignInScreen;
