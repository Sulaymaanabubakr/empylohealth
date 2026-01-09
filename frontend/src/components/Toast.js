import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const Toast = ({ message, type = 'info', visible, onHide }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after 3 seconds
            const timer = setTimeout(() => {
                hideToast();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -20,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (visible && onHide) {
                onHide();
            }
        });
    };

    if (!visible) return null;

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return '#F44336';
            case 'warning': return '#FF9800';
            default: return COLORS.primary;
        }
    };

    const getIconName = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'warning';
            default: return 'information-circle';
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor: getBackgroundColor(),
                },
            ]}
        >
            <View style={styles.content}>
                <Ionicons name={getIconName()} size={24} color={COLORS.white} />
                <Text style={styles.message}>{message}</Text>
            </View>
            <TouchableOpacity onPress={hideToast}>
                <Ionicons name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60, // Adjust based on status bar height or safe area
        left: SPACING.md,
        right: SPACING.md,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    message: {
        ...TYPOGRAPHY.body2,
        color: COLORS.white,
        marginLeft: SPACING.sm,
        flex: 1,
    },
});

export default Toast;
