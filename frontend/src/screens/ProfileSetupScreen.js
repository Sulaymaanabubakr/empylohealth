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

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'your_cloud_name'; // Replace with your Cloudinary cloud name
const CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset'; // Replace with your upload preset

const ProfileSetupScreen = ({ navigation, userType = 'personal' }) => {
    const isPersonal = userType === 'personal';
    const [gender, setGender] = useState('');
    const [location, setLocation] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [avatarUri, setAvatarUri] = useState('');
    const [uploading, setUploading] = useState(false);

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

            // Upload to Cloudinary
            uploadToCloudinary(imageUri);
        }
    };

    const uploadToCloudinary = async (uri) => {
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', {
                uri,
                type: 'image/jpeg',
                name: 'avatar.jpg',
            });
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();

            if (data.secure_url) {
                console.log('Image uploaded to Cloudinary:', data.secure_url);
                // You can save data.secure_url to your backend here
            }
        } catch (error) {
            console.error('Cloudinary upload error:', error);
            Alert.alert('Upload failed', 'Could not upload image. Please try again.');
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
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <MaterialCommunityIcons name="account" size={60} color="#E0E0E0" />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editIcon} onPress={pickImage} disabled={uploading}>
                        <Feather name="edit-2" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    {uploading && <Text style={styles.uploadingText}>Uploading...</Text>}
                </View>

                {isPersonal ? (
                    <>
                        <Input label="Name" placeholder="Enter your name" />

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
                    </>
                ) : (
                    <>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: SPACING.md }}>
                                <Input label="Name" placeholder="First name" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Input label="" placeholder="Last name" />
                            </View>
                        </View>

                        {['Age range', 'Ethnicity', 'Sexuality', 'Disability', 'Marital status', 'Department', 'Job role'].map((item) => (
                            <View key={item} style={styles.dropdownContainer}>
                                <Text style={styles.label}>{item}</Text>
                                <View style={styles.dropdown}>
                                    <Text style={[styles.dropdownText, { marginLeft: 0 }]}>Select</Text>
                                    <Feather name="chevron-down" size={20} color="black" />
                                </View>
                            </View>
                        ))}
                    </>
                )}

                <Button
                    title="Save & Continue"
                    onPress={() => navigation.navigate('Assessment')}
                    style={styles.saveButton}
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
