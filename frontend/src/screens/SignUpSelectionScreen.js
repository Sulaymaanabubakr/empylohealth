import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Button from '../components/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SignUpSelectionScreen = ({ navigation }) => {
    const [selectedType, setSelectedType] = useState(null);

    const UserTypeOption = ({ type, label, icon, isSelected, onSelect }) => (
        <TouchableOpacity
            style={[styles.option, isSelected && styles.selectedOption]}
            onPress={() => onSelect(type)}
        >
            <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                <MaterialCommunityIcons
                    name={icon}
                    size={40}
                    color={isSelected ? COLORS.white : COLORS.gray}
                />
            </View>
            <Text style={[styles.optionLabel, isSelected && styles.selectedOptionLabel]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../assets/images/header_shape.png')}
                    style={styles.headerShape}
                    resizeMode="stretch"
                />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Sign Up</Text>
                <Text style={styles.subtitle}>Please select user type to continue</Text>

                <View style={styles.optionsRow}>
                    <UserTypeOption
                        type="personal"
                        label="Personal User"
                        icon="account"
                        isSelected={selectedType === 'personal'}
                        onSelect={setSelectedType}
                    />
                    <UserTypeOption
                        type="client"
                        label="Client User"
                        icon="account-group"
                        isSelected={selectedType === 'client'}
                        onSelect={setSelectedType}
                    />
                </View>

                <Button
                    title="Continue"
                    onPress={() => navigation.navigate('SignUp', { type: selectedType })}
                    disabled={!selectedType}
                    style={styles.continueButton}
                />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                        <Text style={styles.linkText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerShape: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '100%',
    },
    logo: {
        width: 80,
        height: 80,
        tintColor: COLORS.white,
        marginTop: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        alignItems: 'center',
    },
    title: {
        ...TYPOGRAPHY.h1,
        marginBottom: SPACING.sm,
    },
    subtitle: {
        ...TYPOGRAPHY.caption,
        color: '#666',
        marginBottom: SPACING.xxl,
    },
    optionsRow: {
        flexDirection: 'column', // Based on screenshot it looks more like top/bottom or large icons
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: SPACING.xl,
    },
    option: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        marginBottom: SPACING.sm,
    },
    selectedIconContainer: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    optionLabel: {
        ...TYPOGRAPHY.caption,
        fontWeight: '600',
        color: COLORS.gray,
    },
    selectedOptionLabel: {
        color: COLORS.primary,
    },
    continueButton: {
        width: '100%',
        marginTop: SPACING.xxl,
    },
    footer: {
        flexDirection: 'row',
        marginTop: SPACING.xl,
    },
    footerText: {
        ...TYPOGRAPHY.caption,
        color: '#666',
    },
    linkText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.secondary,
        fontWeight: 'bold',
    },
});

export default SignUpSelectionScreen;
