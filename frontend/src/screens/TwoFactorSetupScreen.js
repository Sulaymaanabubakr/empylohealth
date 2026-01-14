import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const TwoFactorSetupScreen = ({ navigation }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('sms'); // 'sms' | 'authApp'

    // UK Default Flag & Code
    const countryCode = "+44";
    // Placeholder flag icon (emoji or image asset could be used)
    const flagEmoji = "🇬🇧";

    const handleNext = () => {
        navigation.navigate('TwoFactorVerification', {
            phoneNumber: `${countryCode} ${phoneNumber}`,
            method: selectedMethod
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                {/* Empty right view for balance */}
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>2-Step Verification</Text>

                <Text style={styles.subtitle}>Let's set up your phone</Text>

                <Text style={styles.label}>Phone number</Text>
                <View style={styles.phoneInputContainer}>
                    <View style={styles.countryCodeContainer}>
                        <Text style={styles.flag}>{flagEmoji}</Text>
                        <Ionicons name="chevron-down" size={16} color="#1A1A1A" style={{ marginLeft: 4 }} />
                    </View>
                    <Text style={styles.dialCode}>{countryCode}</Text>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="7700 900000" // UK format placeholder
                        keyboardType="phone-pad"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholderTextColor="#BDBDBD"
                    />
                </View>

                <Text style={styles.sectionLabel}>Select any one option to get code</Text>

                {/* Option: Text Message */}
                <TouchableOpacity
                    style={[styles.optionCard, selectedMethod === 'sms' && styles.selectedOption]}
                    onPress={() => setSelectedMethod('sms')}
                >
                    <View style={styles.optionIconContainer}>
                        <MaterialCommunityIcons name="message-text-outline" size={24} color="#009688" />
                    </View>
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Text Message</Text>
                        <Text style={styles.optionDescription}>Receive code via message</Text>
                    </View>
                </TouchableOpacity>

                {/* Option: Authenticator App */}
                <TouchableOpacity
                    style={[styles.optionCard, selectedMethod === 'authApp' && styles.selectedOption]}
                    onPress={() => setSelectedMethod('authApp')}
                >
                    <View style={styles.optionIconContainer}>
                        <MaterialCommunityIcons name="shield-key-outline" size={24} color="#009688" />
                    </View>
                    <View style={styles.optionTextContainer}>
                        <Text style={styles.optionTitle}>Authenticator App</Text>
                        <Text style={styles.optionDescription}>Use a code from your authenticator app</Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.stepText}>Step 1</Text>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Next</Text>
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
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 32,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#424242',
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#757575',
        marginBottom: 8,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        marginBottom: 40,
    },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: '#EEEEEE',
        marginRight: 12,
    },
    flag: {
        fontSize: 24,
    },
    dialCode: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '600',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        height: '100%',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedOption: {
        borderColor: '#009688', // Highlight selection
        backgroundColor: '#E0F2F1',
    },
    optionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E0F2F1', // Light teal
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    optionDescription: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
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
        color: '#009688', // Teal color for "Step 1"
        fontWeight: '600',
    },
    nextButton: {
        backgroundColor: '#4DB6AC',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 24,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default TwoFactorSetupScreen;
