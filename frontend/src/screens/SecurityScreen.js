import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api/userService';
import { biometricPrefs } from '../services/security/biometricPrefs';

const SecurityScreen = ({ navigation }) => {
    const { user, userData } = useAuth();
    // State for toggles
    const [securityNotif, setSecurityNotif] = useState(true);
    const [biometrics, setBiometrics] = useState(true);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const remoteEnabled = userData?.settings?.biometrics ?? false;
            const localEnabled = await biometricPrefs.isDeviceBiometricEnabled(user?.uid);
            if (!mounted) return;
            setSecurityNotif(userData?.settings?.securityNotifications ?? true);
            setBiometrics(Boolean(remoteEnabled && localEnabled));
        };
        load().catch(() => {
            setSecurityNotif(userData?.settings?.securityNotifications ?? true);
            setBiometrics(userData?.settings?.biometrics ?? false);
        });
        return () => {
            mounted = false;
        };
    }, [userData, user?.uid]);

    const persistSetting = async (field, value) => {
        if (!user?.uid) return;
        try {
            if (field === 'biometrics') {
                await biometricPrefs.markSetupPromptSeen(user.uid);
                await biometricPrefs.setDeviceBiometricEnabled(user.uid, value);
            }
            await userService.updateUserDocument(user.uid, {
                settings: {
                    ...(userData?.settings || {}),
                    [field]: value
                }
            });
        } catch (error) {
            console.error('Failed to update settings', error);
        }
    };

    const renderToggleCard = (label, description, value, onValueChange, iconName) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <View style={styles.iconContainer}>
                        <Ionicons name={iconName} size={22} color="#009688" />
                    </View>
                    <Text style={styles.cardTitle}>{label}</Text>
                </View>
                <Switch
                    trackColor={{ false: "#E0E0E0", true: "#4DB6AC" }}
                    thumbColor={"#FFFFFF"}
                    ios_backgroundColor="#E0E0E0"
                    onValueChange={onValueChange}
                    value={value}
                />
            </View>
            {description && (
                <View style={styles.cardBody}>
                    <Text style={styles.cardDescription}>{description}</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Simple Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Security</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {renderToggleCard(
                    "Security Notifications",
                    "Get notified about important account and chat security events.",
                    securityNotif,
                    (value) => {
                        setSecurityNotif(value);
                        persistSetting('securityNotifications', value);
                    },
                    "shield-checkmark-outline"
                )}



                {renderToggleCard(
                    "Biometrics",
                    "Use Face ID or Fingerprint to securely unlock your app.",
                    biometrics,
                    (value) => {
                        setBiometrics(value);
                        persistSetting('biometrics', value);
                    },
                    "finger-print-outline"
                )}

            </ScrollView>



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
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: '#E0F2F1', // Light teal bg
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        flex: 1,
    },
    cardBody: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    cardDescription: {
        fontSize: 13,
        color: '#757575',
        lineHeight: 18,
    },
});

export default SecurityScreen;
