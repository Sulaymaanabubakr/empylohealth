import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { LEGAL_LINKS } from '../constants/legalLinks';

const DeleteAccountScreen = ({ navigation }) => {
    const { user, deleteAccount } = useAuth();
    const { showModal } = useModal();

    const handleDeleteAccount = () => {
        if (!user?.uid) return;

        showModal({
            type: 'confirmation',
            title: 'Delete Account',
            message: 'Are you sure you want to permanently delete your account? This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    await deleteAccount();
                    showModal({
                        type: 'success',
                        title: 'Deleted',
                        message: 'Your account has been deleted.',
                        confirmText: 'Goodbye',
                        onConfirm: () => navigation.navigate('SignIn')
                    });
                } catch (error) {
                    console.error('Delete account failed', error);
                    showModal({
                        type: 'error',
                        title: 'Error',
                        message: error?.message || 'Unable to delete account.'
                    });
                }
            }
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Profile')}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delete account</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroCard}>
                    <View style={styles.heroIcon}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#D32F2F" />
                    </View>
                    <Text style={styles.heroTitle}>This action is permanent</Text>
                    <Text style={styles.heroBody}>
                        Deleting your account removes your access and permanently deletes personal account data that can be removed.
                    </Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>What will happen</Text>
                    <Text style={styles.bulletItem}>• Your account profile and sign-in access will be removed.</Text>
                    <Text style={styles.bulletItem}>• You will be removed from your Circles.</Text>
                    <Text style={styles.bulletItem}>• Your local message history on this device will no longer be accessible through your account.</Text>
                    <Text style={styles.bulletItem}>• Circles or records that need retention for safety, moderation, or legal reasons may be retained or anonymised.</Text>

                    <TouchableOpacity style={styles.learnMoreBtn} onPress={() => Linking.openURL(LEGAL_LINKS.deletionPolicy)}>
                        <Text style={styles.learnMoreText}>Learn what is retained and why</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                    <Ionicons name="trash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.deleteButtonText}>Delete my account</Text>
                </TouchableOpacity>
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
    heroCard: {
        backgroundColor: '#FFF4F4',
        borderWidth: 1,
        borderColor: '#FFD6D6',
        borderRadius: 24,
        padding: 20,
        marginBottom: 18,
    },
    heroIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#FFE5E5',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#991B1B',
        marginBottom: 8,
    },
    heroBody: {
        fontSize: 14,
        lineHeight: 22,
        color: '#7F1D1D',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 14,
    },
    bulletItem: {
        fontSize: 14,
        lineHeight: 22,
        color: '#4B5563',
        marginBottom: 8,
    },
    learnMoreBtn: {
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    learnMoreText: {
        color: '#B91C1C',
        fontSize: 13,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
        borderRadius: 18,
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 5,
    },
    deleteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
});

export default DeleteAccountScreen;
