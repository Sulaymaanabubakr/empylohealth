import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Dropdown from '../components/Dropdown';
import DatePicker from '../components/DatePicker';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api/userService';
import { mediaService } from '../services/api/mediaService';

const ProfileSetupScreen = ({ navigation }) => {
    // const isPersonal = userType === 'personal'; // REMOVED
    const { user } = useAuth();
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [location, setLocation] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [avatarUri, setAvatarUri] = useState('');
    const [uploading, setUploading] = useState(false);
    // const [firstName, setFirstName] = useState(''); // REMOVED
    // const [lastName, setLastName] = useState(''); // REMOVED

    // REMOVED client state variables (ageRange, ethnicity, etc.)

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
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions to upload an image.');
            return;
        }

        // Pick image
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const imageUri = result.assets[0].uri;
            setAvatarUri(imageUri);
        }
    };

    const handleSave = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not found. Please sign in again.');
            return;
        }
        setUploading(true);
        try {
            let photoURL = avatarUri || '';
            if (avatarUri) {
                photoURL = await mediaService.uploadAsset(avatarUri, 'avatars');
            }

            const displayName = name; // Always use 'name'
            const updateData = {
                name: displayName,
                dob: dateOfBirth,
                gender,
                location,
                photoURL,
                role: 'personal', // Always personal
                profileCompleted: true,
                demographics: null, // Always null for personal
                updatedAt: new Date()
            };

            await userService.updateUserDocument(user.uid, updateData);
            navigation.navigate('Assessment');
        } catch (error) {
            console.error('Profile setup failed', error);
            Alert.alert('Error', 'Unable to save profile. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Profile Setup</Text>

                <View style={styles.avatarContainer}>
                    <TouchableOpacity style={styles.avatar} onPress={pickImage} disabled={uploading}>
                        {avatarUri ? (
                            <View style={styles.avatarWrapper}>
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            </View>
                        ) : (
                            <View style={styles.avatarWrapper}>
                                <View style={[styles.avatarImage, { backgroundColor: '#E0E0E0' }]} />
                                <MaterialCommunityIcons name="account" size={60} color="#999" style={styles.defaultAvatarIcon} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editIcon} onPress={pickImage} disabled={uploading}>
                        <Feather name="edit-2" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}
                </View>

                <Input label="Name" placeholder="Enter your name" value={name} onChangeText={setName} />

                <DatePicker
                    label="Date of Birth"
                    value={dateOfBirth}
                    onSelect={setDateOfBirth}
                    placeholder="mm.dd.yyyy"
                    icon={<MaterialCommunityIcons name="calendar-outline" size={20} color={COLORS.secondary} />}
                />

                <Dropdown
                    label="Gender"
                    value={gender}
                    options={genderOptions}
                    onSelect={setGender}
                    icon={<MaterialCommunityIcons name="gender-male-female" size={20} color={COLORS.secondary} />}
                />

                <Dropdown
                    label="Location"
                    value={location}
                    options={locationOptions}
                    onSelect={setLocation}
                    icon={<MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.secondary} />}
                />

                <Button
                    title={uploading ? 'Saving...' : 'Save & Continue'}
                    onPress={handleSave}
                    style={styles.saveButton}
                    disabled={uploading}
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
        paddingBottom: SPACING.xl,
    },
    title: {
        ...TYPOGRAPHY.h2,
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: width * 0.35, // Rough adjustment
        backgroundColor: '#E0F2F1',
        borderRadius: 15,
        padding: 6,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    uploadingText: {
        marginTop: SPACING.xs,
        fontSize: 12,
        color: COLORS.primary,
    },
    label: {
        ...TYPOGRAPHY.caption,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        color: COLORS.text,
    },
    dropdownContainer: {
        marginBottom: SPACING.md,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.pill,
        paddingHorizontal: SPACING.md,
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    dropdownIcon: {
        marginRight: SPACING.sm,
    },
    dropdownText: {
        flex: 1,
        color: '#999',
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    saveButton: {
        marginTop: SPACING.xl,
    },
});

const { width } = Dimensions.get('window');

export default ProfileSetupScreen;
