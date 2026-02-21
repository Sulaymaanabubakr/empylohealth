import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, StatusBar, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';
import { circleService } from '../services/api/circleService';
import { mediaService } from '../services/api/mediaService';
import { useModal } from '../context/ModalContext';
import * as ImagePicker from 'expo-image-picker';
import ImageCropper from '../components/ImageCropper';

const CIRCLE_CATEGORIES = ['Connect', 'Culture', 'Enablement', 'Green Activities', 'Mental health', 'Physical health'];

const CreateCircleScreen = ({ navigation }) => {
    const { showModal } = useModal();
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Connect');
    const [accessType, setAccessType] = useState('Public'); // 'Public' or 'Private'
    const [location, setLocation] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    // Cropper State
    const [cropperVisible, setCropperVisible] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // Fix deprecation
            allowsEditing: false, // Use custom cropper
            quality: 1,
        });

        if (!result.canceled && result.assets[0]?.uri) {
            setTempImage(result.assets[0].uri);
            setCropperVisible(true);
        }
    };

    const handleCreate = async () => {
        if (!name || !description) {
            showModal({ type: 'error', title: 'Error', message: 'Please fill in all fields' });
            return;
        }

        setLoading(true);
        try {
            // NOTE: In a production app, upload 'image' to Firebase Storage here and get URL.
            // For now, passing the URI/Base64. If passing large base64 strings to callable functions, be careful of limits.
            // We'll pass the image URI/Data.
            const tags = Array.from(
                new Set(
                    String(tagsInput || '')
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                )
            ).slice(0, 12);
            const result = await circleService.createCircle(
                name,
                description,
                category,
                accessType.toLowerCase(),
                image,
                'visible',
                location,
                tags
            );

            if (result?.circleId) {
                const newCircle = await circleService.getCircleById(result.circleId);
                if (newCircle) {
                    navigation.replace('CircleDetail', { circle: newCircle });
                    return;
                }
            }

            showModal({
                type: 'success',
                title: 'Success',
                message: 'Circle created successfully!',
                onConfirm: () => navigation.goBack()
            });
        } catch (error) {
            console.error(error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to create circle. ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create New Circle</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                    {/* Circle Icon Picker */}
                    <View style={styles.iconContainer}>
                        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                            <View style={[styles.iconPlaceholder, image && styles.iconImageContainer]}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.iconImage} />
                                ) : (
                                    <Ionicons name="camera-outline" size={32} color="#757575" />
                                )}
                            </View>
                            <View style={styles.editIconBadge}>
                                <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.helperText}>Add Profile Picture</Text>
                    </View>

                    <ImageCropper
                        visible={cropperVisible}
                        imageUri={tempImage}
                        onClose={() => setCropperVisible(false)}
                        onCrop={async (uri, cropData) => {
                            setCropperVisible(false);
                            setLoading(true);
                            try {
                                // Upload to Cloudinary
                                const uploadedUrl = await mediaService.uploadAsset(uri, 'circles');

                                // Apply transformations if needed (e.g. standard circle thumb)
                                // Cloudinary URL structure replacement for optimization
                                // Insert /c_fill,w_200,h_200,g_auto/ for optimized thumbnails
                                const optimizedUrl = uploadedUrl.replace('/upload/', '/upload/c_fill,w_400,h_400,g_auto/');

                                setImage(optimizedUrl);
                            } catch (error) {
                                showModal({ type: 'error', title: 'Upload Failed', message: 'Could not upload image.' });
                            } finally {
                                setLoading(false);
                            }
                        }}
                    />

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        <Text style={styles.label}>Circle Name</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Anxiety Support, Morning Yoga..."
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor="#9E9E9E"
                            />
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Access Level</Text>
                        <View style={styles.accessContainer}>
                            <TouchableOpacity
                                style={[styles.accessButton, accessType === 'Public' && styles.accessButtonActive]}
                                onPress={() => setAccessType('Public')}
                            >
                                <Ionicons name="globe-outline" size={20} color={accessType === 'Public' ? COLORS.primary : '#757575'} />
                                <Text style={[styles.accessText, accessType === 'Public' && styles.accessTextActive]}>Public</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.accessButton, accessType === 'Private' && styles.accessButtonActive]}
                                onPress={() => setAccessType('Private')}
                            >
                                <Ionicons name="lock-closed-outline" size={20} color={accessType === 'Private' ? COLORS.primary : '#757575'} />
                                <Text style={[styles.accessText, accessType === 'Private' && styles.accessTextActive]}>Private</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.helperTextSmall}>
                            {accessType === 'Public'
                                ? "Anyone can find and join this circle."
                                : "Only invited members can join this circle."}
                        </Text>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Category</Text>
                        <View style={styles.categoryWrap}>
                            {CIRCLE_CATEGORIES.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                                    onPress={() => setCategory(item)}
                                >
                                    <Text style={[styles.categoryChipText, category === item && styles.categoryChipTextActive]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Description</Text>
                        <View style={styles.textAreaContainer}>
                            <TextInput
                                style={styles.textArea}
                                placeholder="What is this circle about?"
                                value={description}
                                onChangeText={setDescription}
                                placeholderTextColor="#9E9E9E"
                                multiline
                                maxLength={1000}
                            />
                            <Text style={styles.charCount}>{description.length}/1000</Text>
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Location (optional)</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. London, UK"
                                value={location}
                                onChangeText={setLocation}
                                placeholderTextColor="#9E9E9E"
                            />
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Tags (optional)</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. anxiety, stress, growth"
                                value={tagsInput}
                                onChangeText={setTagsInput}
                                placeholderTextColor="#9E9E9E"
                            />
                        </View>
                        <Text style={styles.helperTextSmall}>Separate tags with commas.</Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
                <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Circle</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    iconContainer: {
        alignSelf: 'center',
        marginBottom: 32,
        alignItems: 'center',
    },
    iconPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E0F2F1',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    iconImageContainer: {
        backgroundColor: '#FFF',
        overflow: 'hidden',
    },
    iconImage: {
        width: '100%',
        height: '100%',
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 24,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    helperText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    formSection: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    input: {
        fontSize: 16,
        color: '#1A1A1A',
    },
    accessContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    accessButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        gap: 8,
    },
    accessButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: '#E0F2F1',
    },
    accessText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#757575',
    },
    accessTextActive: {
        color: COLORS.primary,
    },
    helperTextSmall: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 8,
        marginLeft: 4,
    },
    categoryWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    categoryChip: {
        borderWidth: 1,
        borderColor: '#D0D5DD',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF'
    },
    categoryChipActive: {
        borderColor: COLORS.primary,
        backgroundColor: '#E6FAF8'
    },
    categoryChipText: {
        color: '#344054',
        fontWeight: '600',
        fontSize: 13
    },
    categoryChipTextActive: {
        color: COLORS.primary
    },
    textAreaContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        height: 140,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    textArea: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
        textAlignVertical: 'top',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 11,
        color: '#BDBDBD',
        marginTop: 8,
    },
    footer: {
        padding: 24,
        paddingBottom: 20,
        backgroundColor: '#F8F9FA',
    },
    createButton: {
        backgroundColor: COLORS.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 32,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18,
    },
});

export default CreateCircleScreen;
