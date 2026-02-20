import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
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
import { authService } from '../services/auth/authService';
import { getDeviceIdentity } from '../services/auth/deviceIdentity';
import { COUNTRY_OPTIONS } from '../constants/countries';

const PersonalInformationScreen = ({ navigation }) => {
    const { user, userData } = useAuth();
    const { showModal } = useModal();

    // Form State (initialized with userData)
    const [name, setName] = useState(userData?.name || '');
    const [newPassword, setNewPassword] = useState('');
    const [dob, setDob] = useState(userData?.dob || '');
    const [gender, setGender] = useState(userData?.gender || 'Prefer not to say');
    const [location, setLocation] = useState(userData?.location || '');
    const [bio, setBio] = useState(userData?.bio || userData?.about || '');
    const [avatarUri, setAvatarUri] = useState(userData?.photoURL || user?.photoURL || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track if avatar changed to avoid unnecessary uploads
    const [hasNewAvatar, setHasNewAvatar] = useState(false);

    const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

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
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || userData?.timezone || 'UTC';
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
                timezone,
                bio: bio.trim(),
                about: bio.trim(), // Keep legacy field in sync for older readers.
                photoURL,
                updatedAt: new Date()
            };

            // 3. Update Firestore via userService
            if (user?.uid) {
                await userService.updateUserDocument(user.uid, updateData);
                if (newPassword) {
                    const metadata = await getDeviceIdentity();
                    const otpResult = await authService.requestOtp({
                        email: user?.email,
                        purpose: 'CHANGE_PASSWORD',
                        metadata
                    });
                    showModal({ type: 'success', title: 'Code sent', message: 'Enter the OTP code to confirm your password change.' });
                    navigation.navigate('OtpVerification', {
                        email: user?.email,
                        purpose: 'CHANGE_PASSWORD',
                        title: 'Confirm Password Change',
                        subtitle: `Enter the 6-digit code sent to ${user?.email}.`,
                        initialCooldownSeconds: Number(otpResult?.cooldownSeconds || 60),
                        nextAction: {
                            type: 'change_password',
                            newPassword
                        }
                    });
                    setNewPassword('');
                } else {
                    showModal({ type: 'success', title: 'Success', message: 'Profile updated successfully!' });
                    navigation.goBack();
                }
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
                                <Avatar
                                    uri={avatarUri || ''}
                                    name={name || user?.displayName || 'User'}
                                    size={100}
                                    showWellbeingRing
                                    wellbeingScore={userData?.wellbeingScore}
                                    wellbeingLabel={userData?.wellbeingLabel || userData?.wellbeingStatus}
                                />
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
                            label="New password (optional)"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholder="Enter new password to change it"
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
                            label="Country"
                            value={location}
                            options={COUNTRY_OPTIONS}
                            onSelect={setLocation}
                            icon={<Ionicons name="location-outline" size={20} color="#009688" />}
                        />

                        <View style={styles.bioSection}>
                            <Text style={styles.bioLabel}>Profile bio</Text>
                            <TextInput
                                style={styles.bioInput}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell people a bit about yourself..."
                                placeholderTextColor="#9E9E9E"
                                multiline
                                textAlignVertical="top"
                                maxLength={300}
                            />
                            <Text style={styles.bioCount}>{bio.length}/300</Text>
                        </View>
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
    bioSection: {
        marginTop: 2,
    },
    bioLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    bioInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 16,
        minHeight: 96,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1A1A1A',
        backgroundColor: '#FFFFFF',
    },
    bioCount: {
        marginTop: 6,
        textAlign: 'right',
        fontSize: 12,
        color: '#757575',
    },
});

export default PersonalInformationScreen;
