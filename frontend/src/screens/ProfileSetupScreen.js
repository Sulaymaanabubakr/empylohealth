import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Image, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Dropdown from '../components/Dropdown';
import DatePicker from '../components/DatePicker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/api/userService';
import { authService } from '../services/auth/authService';
import { mediaService } from '../services/api/mediaService';
import { COUNTRY_OPTIONS } from '../constants/countries';

const { width } = Dimensions.get('window');

const ProfileSetupScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [name, setName] = useState(user?.displayName || '');
    const [gender, setGender] = useState('');
    const [location, setLocation] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [avatarUri, setAvatarUri] = useState(user?.photoURL || '');
    const [uploading, setUploading] = useState(false);

    const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Permission needed to upload an image', 'warning');
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
        }
    };

    const handleSave = async () => {
        if (!user?.uid) {
            showToast('User not found. Please sign in again.', 'error');
            return;
        }
        if (!name) {
            showToast('Please enter your name', 'warning');
            return;
        }

        setUploading(true);
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
            let photoURL = avatarUri;
            if (avatarUri && avatarUri !== user.photoURL) {
                photoURL = await mediaService.uploadAsset(avatarUri, 'avatars');
            }

            const updateData = {
                name,
                dob: dateOfBirth,
                gender,
                location,
                timezone,
                photoURL,
                role: 'personal',
                onboardingCompleted: true,
                updatedAt: new Date()
            };

            await Promise.all([
                userService.updateUserDocument(user.uid, updateData),
                authService.updateAuthProfile(name, photoURL)
            ]);

            showToast('Profile saved successfully!', 'success');
            // Navigation is now controlled by bootstrap route decision in AuthContext.
        } catch (error) {
            console.error('Profile setup failed', error);
            showToast('Unable to save profile. Please try again.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Minimalist Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('SignIn')}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile Setup</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero section with better placement */}
                <View style={styles.heroSection}>
                    <Text style={styles.introTitle}>Complete Your Profile</Text>
                </View>

                {/* Refined Avatar Picker */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarContainer}
                        onPress={pickImage}
                        activeOpacity={0.8}
                    >
                        <View style={styles.avatarBorder}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={50} color={COLORS.primary} />
                                </View>
                            )}
                        </View>
                        <LinearGradient
                            colors={[COLORS.secondary, '#FFB347']}
                            style={styles.cameraIconContainer}
                        >
                            <Ionicons name="camera" size={18} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                    <Text style={styles.avatarHint}>Add a profile photo</Text>
                </View>

                {/* Form Card */}
                <View style={styles.formContainer}>
                    <Input
                        label="Full Name"
                        placeholder="Your full name"
                        value={name}
                        onChangeText={setName}
                        icon={<MaterialCommunityIcons name="account-outline" size={20} color={COLORS.primary} />}
                    />

                    <DatePicker
                        label="Date of Birth"
                        value={dateOfBirth}
                        onSelect={setDateOfBirth}
                        placeholder="Select your birth date"
                        icon={<MaterialCommunityIcons name="calendar-heart" size={20} color={COLORS.primary} />}
                    />

                    <Dropdown
                        label="Gender"
                        value={gender}
                        options={genderOptions}
                        onSelect={setGender}
                        icon={<MaterialCommunityIcons name="gender-male-female" size={20} color={COLORS.primary} />}
                    />

                    <Dropdown
                        label="Country"
                        value={location}
                        options={COUNTRY_OPTIONS}
                        onSelect={setLocation}
                        icon={<MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.primary} />}
                    />

                    <Button
                        title={uploading ? 'Finalizing...' : 'Save & Continue'}
                        onPress={handleSave}
                        style={styles.saveButton}
                        disabled={uploading}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FB', // Softer, non-stark background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
        color: '#1A1A1A',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    contentScroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
    },
    heroSection: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    introTitle: {
        fontSize: 28,
        color: '#1A1A1A',
        fontFamily: 'SpaceGrotesk_700Bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    avatarBorder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'white',
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 55,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 55,
        backgroundColor: '#F0F9F8',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0F2F1',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#F7F9FB', // Matches container bg
    },
    avatarHint: {
        marginTop: 14,
        fontSize: 14,
        color: COLORS.primary,
        fontFamily: 'DMSans_500Medium',
        fontWeight: '600',
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 30,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
        marginBottom: 30,
    },
    saveButton: {
        marginTop: 15,
        height: 56,
        borderRadius: 16,
    },
});

export default ProfileSetupScreen;
