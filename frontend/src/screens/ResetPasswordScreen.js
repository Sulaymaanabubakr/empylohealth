import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '../services/auth/authService';
import { useModal } from '../context/ModalContext';

const ResetPasswordScreen = ({ navigation, route }) => {
    const { oobCode } = route.params || {};
    const { showModal } = useModal();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReset = async () => {
        if (!oobCode) {
            showModal({ type: 'error', title: 'Missing code', message: 'Open the reset link from your email.' });
            return;
        }
        if (!password || password !== confirmPassword) {
            showModal({ type: 'error', title: 'Password mismatch', message: 'Please enter matching passwords.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await authService.confirmPasswordReset(oobCode, password);
            showModal({
                type: 'success',
                title: 'Success',
                message: 'Your password has been reset.',
                onConfirm: () => navigation.navigate('SignIn')
            });
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: error.message || 'Unable to reset password.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SignIn')}
            >
                <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Reset Password</Text>

                <Text style={styles.infoText}>
                    Your new password must be different from previously used password
                </Text>

                <Input
                    label="Password"
                    placeholder="Enter your password..."
                    secureTextEntry
                    icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                    value={password}
                    onChangeText={setPassword}
                />

                <Input
                    label="Confirm Password"
                    placeholder="Confirm your password..."
                    secureTextEntry
                    icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <Button
                    title={isSubmitting ? "Resetting..." : "Reset Password"}
                    onPress={handleReset}
                    style={styles.resetButton}
                    disabled={isSubmitting}
                />
            </ScrollView>
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
    scrollContent: {
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        alignItems: 'center',
    },
    title: {
        ...TYPOGRAPHY.h1,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    infoText: {
        ...TYPOGRAPHY.caption,
        textAlign: 'center',
        color: '#666',
        lineHeight: 20,
        marginBottom: SPACING.xxl,
    },
    resetButton: {
        width: '100%',
        marginTop: SPACING.xl,
    },
});

export default ResetPasswordScreen;
