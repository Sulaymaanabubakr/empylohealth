import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import EmailIllustration from '../../assets/images/email_icon.svg';
import { authService } from '../services/auth/authService';
import { useModal } from '../context/ModalContext';
import { getDeviceIdentity } from '../services/auth/deviceIdentity';

const ForgotPasswordScreen = ({ navigation }) => {
    const { showModal } = useModal();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReset = async () => {
        if (!email) {
            showModal({ type: 'error', title: 'Missing email', message: 'Please enter your email address.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const metadata = await getDeviceIdentity();
            const result = await authService.requestOtp({
                email,
                purpose: 'RESET_PASSWORD',
                metadata
            });
            navigation.navigate('OtpVerification', {
                email,
                purpose: 'RESET_PASSWORD',
                title: 'Reset Password',
                subtitle: `Enter the code sent to ${email} to continue.`,
                initialCooldownSeconds: Number(result?.cooldownSeconds || 60),
                nextAction: {
                    type: 'reset_password',
                    email
                }
            });
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: error.message || 'Unable to send reset code.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SignIn')}
                    >
                        <Ionicons name="chevron-back" size={24} color="black" />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        <Text style={styles.title}>Forgot Password</Text>

                        <View style={[styles.icon, { justifyContent: 'center', alignItems: 'center' }]}>
                            <EmailIllustration width={120} height={120} />
                        </View>

                        <Text style={styles.infoText}>
                            Please enter your email and we will send you instructions on how to reset your password
                        </Text>

                        <Input
                            placeholder="Enter your email..."
                            keyboardType="email-address"
                            icon={<MaterialCommunityIcons name="email-outline" size={20} color={COLORS.secondary} />}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />

                        <Button
                            title={isSubmitting ? "Sending..." : "Reset Password"}
                            onPress={handleReset}
                            style={styles.resetButton}
                            disabled={isSubmitting}
                        />
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
    backButton: {
        padding: SPACING.md,
        marginTop: SPACING.sm,
        width: 60,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        alignItems: 'center',
    },
    title: {
        ...TYPOGRAPHY.h2,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
    },
    icon: {
        width: 150,
        height: 150,
        marginBottom: SPACING.xl,
    },
    infoText: {
        ...TYPOGRAPHY.caption,
        textAlign: 'center',
        color: '#666',
        lineHeight: 20,
        marginBottom: SPACING.xl,
    },
    resetButton: {
        width: '100%',
        marginTop: SPACING.xl,
    },
});

export default ForgotPasswordScreen;
