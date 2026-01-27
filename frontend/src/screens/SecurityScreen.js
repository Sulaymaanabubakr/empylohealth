import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api/userService';
import { functions } from '../services/firebaseConfig';
import { httpsCallable } from 'firebase/functions';

const SecurityScreen = ({ navigation }) => {
    const { user, userData } = useAuth();
    // State for toggles
    const [securityNotif, setSecurityNotif] = useState(true);
    const [biometrics, setBiometrics] = useState(true);

    const [isDeleteVisible, setIsDeleteVisible] = useState(false);
    const [isDeleteSuccessVisible, setIsDeleteSuccessVisible] = useState(false);

    useEffect(() => {
        setSecurityNotif(userData?.settings?.securityNotifications ?? true);
        setBiometrics(userData?.settings?.biometrics ?? false);
    }, [userData]);

    const persistSetting = async (field, value) => {
        if (!user?.uid) return;
        try {
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

    const handleDeleteAccount = async () => {
        if (!user?.uid) return;
        try {
            const deleteFn = httpsCallable(functions, 'deleteUserAccount');
            await deleteFn();
            setIsDeleteVisible(false);
            setIsDeleteSuccessVisible(true);
        } catch (error) {
            console.error('Delete account failed', error);
            Alert.alert('Error', error.message || 'Unable to delete account.');
        }
    };

    const handleDeleteComplete = () => {
        setIsDeleteSuccessVisible(false);
        navigation.navigate('SignIn');
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
                    "Get notified when your security code changes for a contact's phone in an end-to-end encrypted chat.",
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

                {/* Delete Account */}
                <TouchableOpacity
                    style={styles.deleteCard}
                    onPress={() => setIsDeleteVisible(true)}
                >
                    <View style={styles.deleteHeader}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#D32F2F" />
                        <Text style={styles.deleteTitle}>Delete My Account</Text>
                    </View>

                    <Text style={styles.deleteDescription}>Deleting your account will permanently remove:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Your account info and profile photo</Text>
                        <Text style={styles.bulletItem}>• You from all Circles groups</Text>
                        <Text style={styles.bulletItem}>• Your message history on this device</Text>
                        <Text style={styles.bulletItem}>• Any Circle that you created</Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>

            <ConfirmationModal
                visible={isDeleteVisible}
                title="Delete Account"
                message="Are you sure you want to permanently delete your account? This action cannot be undone."
                onConfirm={handleDeleteAccount}
                onCancel={() => setIsDeleteVisible(false)}
                confirmText="Delete"
                cancelText="Cancel"
            />

            <ConfirmationModal
                visible={isDeleteSuccessVisible}
                message="Your account has been deleted."
                singleButton={true}
                confirmText="Goodbye"
                onConfirm={handleDeleteComplete}
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
    deleteCard: {
        backgroundColor: '#FFEBEE', // Light Red bg
        borderRadius: 20,
        padding: 20,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    deleteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    deleteTitle: {
        fontSize: 16,
        color: '#D32F2F',
        fontWeight: '700',
    },
    deleteDescription: {
        fontSize: 14,
        color: '#B71C1C',
        marginBottom: 8,
        fontWeight: '500',
    },
    bulletList: {
        marginLeft: 8,
    },
    bulletItem: {
        fontSize: 13,
        color: '#D32F2F',
        marginBottom: 4,
        lineHeight: 18,
    },
});

export default SecurityScreen;
