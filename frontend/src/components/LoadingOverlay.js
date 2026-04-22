import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/theme';

const LoadingOverlay = ({
    visible,
    title = 'Please wait',
    message = 'We are getting things ready.',
    transparent = true,
}) => {
    if (!visible) return null;

    return (
        <Modal
            animationType="fade"
            transparent={transparent}
            visible={visible}
            statusBarTranslucent
        >
            <View style={[styles.backdrop, !transparent && styles.backdropSolid]}>
                <View style={styles.card}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.title}>{title}</Text>
                    {!!message && <Text style={styles.message}>{message}</Text>}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(248, 251, 250, 0.82)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    backdropSolid: {
        backgroundColor: '#F8FBFA',
    },
    card: {
        width: '100%',
        maxWidth: 280,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 22,
        shadowColor: '#0F172A',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
    title: {
        marginTop: 14,
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    message: {
        marginTop: 8,
        fontSize: 13,
        lineHeight: 18,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default LoadingOverlay;
