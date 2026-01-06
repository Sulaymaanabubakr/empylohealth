import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const ConfirmationModal = ({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Yes',
    cancelText = 'No',
    singleButton = false
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.contentContainer}>
                        {title && <Text style={styles.modalTitle}>{title}</Text>}
                        <Text style={[styles.modalText, !title && styles.textOnly]}>{message}</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        {singleButton ? (
                            <TouchableOpacity style={styles.fullButton} onPress={onConfirm}>
                                <Text style={styles.confirmText}>{confirmText}</Text>
                                {/* Arrow icon could be added here if needed */}
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.halfButton} onPress={onConfirm}>
                                    <Text style={styles.confirmText}>{confirmText}</Text>
                                </TouchableOpacity>
                                <View style={styles.divider} />
                                <TouchableOpacity style={styles.halfButton} onPress={onCancel}>
                                    <Text style={styles.cancelText}>{cancelText}</Text>
                                </TouchableOpacity>
                            </>
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Dimmed background
    },
    modalView: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
    },
    contentContainer: {
        paddingTop: 24,
        paddingBottom: 24,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    modalTitle: {
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    modalText: {
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
        color: '#1A1A1A',
    },
    textOnly: {
        fontWeight: '600',
        fontSize: 15,
        marginTop: 10,
        marginBottom: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        width: '100%',
        height: 50,
    },
    halfButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    divider: {
        width: 1,
        height: '100%',
        backgroundColor: '#E0E0E0',
    },
    confirmText: {
        color: '#000000', // Or bold black as per design
        fontWeight: '700',
        fontSize: 14,
    },
    cancelText: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 14,
    },
});

export default ConfirmationModal;
