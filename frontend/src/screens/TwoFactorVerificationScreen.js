import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TwoFactorSuccessModal from '../components/TwoFactorSuccessModal';

const TwoFactorVerificationScreen = ({ navigation, route }) => {
    const { phoneNumber } = route.params || { phoneNumber: '+44 7700 900000' };
    const [otp, setOtp] = useState(['', '', '', '']);
    const [isSuccessVisible, setIsSuccessVisible] = useState(false);

    const handleOtpChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus logic would go here ideally
    };

    const handleVerify = () => {
        setIsSuccessVisible(true);
    };

    const handleSuccessContinue = () => {
        setIsSuccessVisible(false);
        navigation.navigate('Security'); // Go back to Security settings
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>2-Step Verification</Text>

                {/* Illustration Placeholder */}
                <View style={styles.illustrationContainer}>
                    {/* Using a simple envelope icon as placeholder for the illustration in the design */}
                    <Ionicons name="mail-open-outline" size={80} color="#E0E0E0" />
                    <View style={styles.notificationBadge}>
                        <Text style={styles.badgeText}>1</Text>
                    </View>
                </View>

                <Text style={styles.instruction}>
                    A text message with your code has been sent to{'\n'}
                    <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                </Text>

                <Text style={styles.enterCodeLabel}>Enter 4 digit code</Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            style={styles.otpInput}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={digit}
                            onChangeText={(text) => handleOtpChange(text, index)}
                        />
                    ))}
                </View>

                <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive code? </Text>
                    <TouchableOpacity>
                        <Text style={styles.resendLink}>Resend</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.stepText}>Step 2</Text>
                <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
                    <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
            </View>

            <TwoFactorSuccessModal
                visible={isSuccessVisible}
                onContinue={handleSuccessContinue}
            />

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
        marginBottom: 40,
    },
    illustrationContainer: {
        marginBottom: 32,
        position: 'relative',
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 20,
        right: -10,
        backgroundColor: '#E91E63',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    instruction: {
        fontSize: 14,
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    phoneNumber: {
        fontWeight: '700',
    },
    enterCodeLabel: {
        fontSize: 14,
        color: '#424242',
        marginBottom: 16,
    },
    otpContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    otpInput: {
        width: 50,
        height: 50,
        backgroundColor: '#E0E0E0', // Light grey background
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 20,
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
        color: '#009688', // Teal color
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    stepText: {
        fontSize: 16,
        color: '#009688',
        fontWeight: '600',
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
});

export default TwoFactorVerificationScreen;
