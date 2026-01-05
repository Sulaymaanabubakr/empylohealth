import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const ResetPasswordScreen = ({ navigation }) => {
    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
                />

                <Input
                    label="Confirm Password"
                    placeholder="Confirm your password..."
                    secureTextEntry
                    icon={<MaterialCommunityIcons name="lock-outline" size={20} color={COLORS.secondary} />}
                />

                <Button
                    title="Reset Password"
                    onPress={() => navigation.navigate('SignIn')}
                    style={styles.resetButton}
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
