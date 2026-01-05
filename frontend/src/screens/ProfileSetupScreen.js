import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, SafeAreaView, Platform, Dimensions } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
// import { Picker } from '@react-native-picker/picker'; // Removed unused mock import

const ProfileSetupScreen = ({ navigation, userType = 'personal' }) => {
    const isPersonal = userType === 'personal';

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>Profile Setup</Text>

                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <MaterialCommunityIcons name="account" size={60} color="#E0E0E0" />
                    </View>
                    <TouchableOpacity style={styles.editIcon}>
                        <Feather name="edit-2" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {isPersonal ? (
                    <>
                        <Input label="Name" placeholder="Enter your name" />
                        <Input
                            label="Date of Birth"
                            placeholder="mm.dd.yyyy"
                            icon={<MaterialCommunityIcons name="calendar-outline" size={20} color={COLORS.secondary} />}
                        />

                        <View style={styles.dropdownContainer}>
                            <Text style={styles.label}>Gender</Text>
                            <View style={styles.dropdown}>
                                <MaterialCommunityIcons name="gender-male-female" size={20} color={COLORS.secondary} style={styles.dropdownIcon} />
                                <Text style={styles.dropdownText}>Select</Text>
                                <Feather name="chevron-down" size={20} color="black" />
                            </View>
                        </View>

                        <View style={styles.dropdownContainer}>
                            <Text style={styles.label}>Location</Text>
                            <View style={styles.dropdown}>
                                <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.secondary} style={styles.dropdownIcon} />
                                <Text style={styles.dropdownText}>Select</Text>
                                <Feather name="chevron-down" size={20} color="black" />
                            </View>
                        </View>
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
