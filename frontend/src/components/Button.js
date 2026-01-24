import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../theme/theme';

const Button = ({ title, onPress, type = 'primary', loading = false, style, textStyle }) => {
    const isPrimary = type === 'primary';

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={loading}
            style={[
                styles.button,
                isPrimary ? styles.primaryButton : styles.secondaryButton,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? COLORS.white : COLORS.primary} />
            ) : (
                <Text style={[
                    styles.text,
                    isPrimary ? styles.primaryText : styles.secondaryText,
                    textStyle
                ]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.pill,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        height: 56,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButton: {
        backgroundColor: COLORS.primary,
    },
    secondaryButton: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
    },
    primaryText: {
        color: COLORS.white,
    },
    secondaryText: {
        color: COLORS.primary,
    },
});

export default Button;
