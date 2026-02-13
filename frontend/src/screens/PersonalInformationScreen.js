import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Only for button
import Input from '../components/Input';
import Dropdown from '../components/Dropdown';
import DatePicker from '../components/DatePicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { userService } from '../services/api/userService';
import { mediaService } from '../services/api/mediaService';
import Avatar from '../components/Avatar';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';

const PersonalInformationScreen = ({ navigation }) => {
    const { user, userData } = useAuth();
    const { showModal } = useModal();

    // Form State (initialized with userData)
    const [name, setName] = useState(userData?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [dob, setDob] = useState(userData?.dob || '');
    const [gender, setGender] = useState(userData?.gender || 'Prefer not to say');
    const [location, setLocation] = useState(userData?.location || '');
    const [avatarUri, setAvatarUri] = useState(userData?.photoURL || user?.photoURL || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track if avatar changed to avoid unnecessary uploads
    const [hasNewAvatar, setHasNewAvatar] = useState(false);

    const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
    const locationOptions = [
        'England - East Midlands',
        'England - East of England',
        'England - London',
        'England - North East',
        'England - North West',
        'England - South East',
        'England - South West',
        'England - West Midlands',
        'England - Yorkshire and the Humber',
        'Scotland',
        'Wales',
        'Northern Ireland'
    ];

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showModal({ type: 'error', title: 'Permission needed', message: 'Please grant camera roll permissions to upload an image.' });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
            setHasNewAvatar(true);
        }
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            let photoURL = avatarUri;

            // 1. Upload new avatar if selected
            if (hasNewAvatar) {
                photoURL = await mediaService.uploadAsset(avatarUri, 'avatars');
            }

            // 2. Prepare Data
            const updateData = {
                name,
                dob,
                gender,
                location,
                photoURL,
                updatedAt: new Date()
            };

            if (newPassword) {
                if (!currentPassword) {
                    showModal({ type: 'error', title: 'Missing password', message: 'Enter your current password to update it.' });
                    setIsSubmitting(false);
                    return;
                }
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(auth.currentUser, credential);
                await updatePassword(auth.currentUser, newPassword);
            }

            // 3. Update Firestore via userService
            if (user?.uid) {
                await userService.updateUserDocument(user.uid, updateData);
                showModal({ type: 'success', title: 'Success', message: 'Profile updated successfully!' });
                navigation.goBack();
            } else {
                showModal({ type: 'error', title: 'Error', message: 'User not found. Please login again.' });
            }
        } catch (error) {
            console.error("Profile Save Error:", error);
            showModal({ type: 'error', title: 'Error', message: `Failed to save profile changes. ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Simple Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Personal information</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarWrapper}>
                            <View style={styles.avatarBorder}>
                                <Avatar uri={avatarUri || ''} name={name || user?.displayName || 'User'} size={100} />
                            </View>
                            <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage}>
                                <MaterialCommunityIcons name="camera" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Form Card */}
                    <View style={styles.formCard}>
                        <Input
                            label="Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            icon={<Ionicons name="person-outline" size={20} color="#009688" />}
                        />

                        <Input
                            label="Current password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            placeholder="Enter current password"
                            icon={<Ionicons name="lock-closed-outline" size={20} color="#009688" />}
                        />

                        <Input
                            label="New password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholder="Enter new password"
                            icon={<Ionicons name="lock-closed-outline" size={20} color="#009688" />}
                        />

                        <DatePicker
                            label="Date of Birth"
                            value={dob}
                            onSelect={setDob}
                            placeholder="Select date"
                            icon={<MaterialCommunityIcons name="calendar-outline" size={20} color="#009688" />}
                        />

                        <Dropdown
                            label="Gender"
                            value={gender}
                            options={genderOptions}
                            onSelect={setGender}
                            icon={<MaterialCommunityIcons name="gender-male-female" size={20} color="#009688" />}
                        />

                        <Dropdown
                            label="Location"
                            value={location}
                            options={locationOptions}
                            onSelect={setLocation}
                            icon={<Ionicons name="location-outline" size={20} color="#009688" />}
                        />
                    </View>

                    {/* Gradient Save Button */}
                    <TouchableOpacity style={styles.saveButtonContainer} onPress={handleSave} disabled={isSubmitting}>
                        <LinearGradient
                            colors={['#009688', '#4DB6AC']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.saveButton}
                        >
                            <Text style={styles.saveButtonText}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

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
        paddingTop: 10,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarBorder: {
        padding: 4, // White border
        backgroundColor: '#FFF',
        borderRadius: 54,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E0E0E0',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#FFA000', // Accent color
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        elevation: 3,
    },
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        gap: 16,
    },
    saveButtonContainer: {
        borderRadius: 28,
        elevation: 4,
        shadowColor: "#009688",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default PersonalInformationScreen;
