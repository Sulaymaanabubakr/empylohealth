import { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';


const Input = ({ label, icon, secureTextEntry, ...props }) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPassword = secureTextEntry !== undefined;
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputContainer}>
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={COLORS.placeholder}
                    secureTextEntry={isPassword ? !isPasswordVisible : false}
                    {...props}
                />
                {isPassword && (
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons
                            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={COLORS.placeholder}
                        />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
        width: '100%',
    },
    label: {
        ...TYPOGRAPHY.caption,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        color: COLORS.text,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.pill,
        paddingHorizontal: SPACING.md,
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    eyeIcon: {
        padding: SPACING.xs,
    },
});

export default Input;
