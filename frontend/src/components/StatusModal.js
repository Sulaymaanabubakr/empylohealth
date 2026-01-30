import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const { width } = Dimensions.get('window');

const StatusModal = ({ visible, type, title, message, onClose, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    // Configuration based on type
    const getConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'checkmark-circle',
                    color: '#4CAF50', // Green
                    bg: '#E8F5E9',
                    btnBg: '#4CAF50',
                    showConfirm: false
                };
            case 'error':
                return {
                    icon: 'alert-circle',
                    color: '#F44336', // Red
                    bg: '#FFEBEE',
                    btnBg: '#F44336',
                    showConfirm: false
                };
            case 'confirmation':
                return {
                    icon: 'help-circle',
                    color: COLORS.primary, // Blue/Theme
                    bg: '#E3F2FD',
                    btnBg: COLORS.primary,
                    showConfirm: true
                };
            default: // info
                return {
                    icon: 'information-circle',
                    color: '#2196F3',
                    bg: '#E3F2FD',
                    btnBg: '#2196F3',
                    showConfirm: false
                };
        }
    };

    const config = getConfig();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={[styles.modalView, { borderTopWidth: 4, borderTopColor: config.color }]}>

                    {/* Icon Header */}
                    <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
                        <Ionicons name={config.icon} size={40} color={config.color} />
                    </View>

                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalText}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {config.showConfirm ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonCancel]}
                                    onPress={onClose}
                                >
                                    <Text style={styles.textStyleCancel}>{cancelText}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: config.color }]}
                                    onPress={() => {
                                        if (onConfirm) onConfirm();
                                        onClose();
                                    }}
                                >
                                    <Text style={styles.textStyle}>{confirmText}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: config.color, width: '100%' }]}
                                onPress={onClose}
                            >
                                <Text style={styles.textStyle}>Okay</Text>
                            </TouchableOpacity>
                        )}
                    </View>
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
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
    },
    modalView: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#1A1A1A',
    },
    modalText: {
        fontSize: 15,
        textAlign: 'center',
        color: '#666',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        borderRadius: 12,
        padding: 14,
        elevation: 2,
        flex: 1,
        alignItems: 'center',
    },
    buttonCancel: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    textStyleCancel: {
        color: '#757575',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default StatusModal;
