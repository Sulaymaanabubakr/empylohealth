import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const { width } = Dimensions.get('window');

    visible: boolean;
    onClose: () => void;
    onTakeNow: () => void;
    type?: 'daily' | 'weekly';
}

const AssessmentModal = ({ visible, onClose, onTakeNow, type = 'daily' }) => {
    const isWeekly = type === 'weekly';
    const title = isWeekly ? "It's time for your Weekly Reflection" : "Ready for your Daily Check-in?";
    const subtitle = isWeekly ? "Takes about 2 minutes" : "Takes just 30 seconds";

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color="#1A1A1A" />
                    </TouchableOpacity>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>

                    {/* Illustration */}
                    <View style={styles.illustrationContainer}>
                        <Ionicons name={isWeekly ? "journal" : "create"} size={80} color="#E0F2F1" />
                        <View style={styles.checkBadge}>
                            <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                        </View>
                    </View>

                    <TouchableOpacity style={styles.primaryButton} onPress={onTakeNow}>
                        <Text style={styles.primaryButtonText}>Take now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 20,
        paddingTop: 40,
        paddingBottom: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1A1A1A',
        marginBottom: 24,
        lineHeight: 24,
    },
    illustrationContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        position: 'relative',
    },
    checkBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
    },
    primaryButton: {
        backgroundColor: '#4DB6AC', // Teal matching screenshot
        borderRadius: 25,
        paddingVertical: 14,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 2,
    },
    primaryButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    secondaryButton: {
        paddingVertical: 8,
    },
    secondaryButtonText: {
        color: '#757575',
        fontSize: 16,
        fontWeight: '500',
    },
});

export default AssessmentModal;
