import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';
import { circleService } from '../services/api/circleService';

const CreateCircleScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Support Group');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name || !description) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            await circleService.createCircle(name, description, category);
            Alert.alert("Success", "Circle created successfully!");
            navigation.goBack();
        } catch (error) {
            Alert.alert("Error", "Failed to create circle. " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.titleContainer}>
                    <Text style={styles.screenTitle}>New Circle</Text>
                </View>

                {/* Circle Icon Placeholder */}
                <View style={styles.iconContainer}>
                    <View style={styles.iconPlaceholder}>
                        <Ionicons name="people" size={40} color="#1A1A1A" />
                    </View>
                    <TouchableOpacity style={styles.editIconBadge}>
                        <MaterialCommunityIcons name="image-edit-outline" size={16} color="#424242" />
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Circle name"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#9E9E9E"
                    />
                    <MaterialCommunityIcons name="pencil-outline" size={20} color="#757575" style={styles.inputIcon} />
                </View>

                <View style={styles.textAreaContainer}>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Circle description..."
                        value={description}
                        onChangeText={setDescription}
                        placeholderTextColor="#9E9E9E"
                        multiline
                        maxLength={1000}
                    />
                    <Text style={styles.charCount}>{description.length}/1000</Text>
                </View>

            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.createButton} onPress={handleCreate} disabled={loading}>
                    <Text style={styles.createButtonText}>{loading ? "Creating..." : "Create Circle"}</Text>
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
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
    },
    titleContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    iconContainer: {
        alignSelf: 'center',
        marginBottom: 30,
        position: 'relative',
    },
    iconPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E0F2F1', // Light teal
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F8F9FA',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 50,
        marginBottom: 16,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
    },
    inputIcon: {
        marginLeft: 8,
    },
    textAreaContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        height: 120,
        marginBottom: 24,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    textArea: {
        flex: 1,
        fontSize: 14,
        color: '#1A1A1A',
        textAlignVertical: 'top',
    },
    charCount: {
        textAlign: 'right',
        fontSize: 10,
        color: '#9E9E9E',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 12,
    },
    actionButtonOutline: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 30,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0F2F1', // Very light border maybe? or none if shadow enough
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    actionButtonTextOutline: {
        color: '#009688', // Teal text
        fontWeight: '600',
        marginLeft: 12,
        fontSize: 14,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
    },
    createButton: {
        backgroundColor: '#4DB6AC', // Matching previous Teal
        width: '100%',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: "#4DB6AC",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default CreateCircleScreen;
