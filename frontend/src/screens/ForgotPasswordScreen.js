import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import EmailIllustration from '../../assets/images/email_icon.svg';

const ForgotPasswordScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
                />

                <Button
                    title="Reset Password"
                    onPress={() => navigation.navigate('ResetPassword')}
                    style={styles.resetButton}
                />
            </View>
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
