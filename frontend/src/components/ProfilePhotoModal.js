import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const ProfilePhotoModal = ({ visible, onClose, currentImage, onUseAvatar, onTakePhoto, onChoosePhoto, onDeletePhoto }) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <TouchableOpacity style={styles.overlay} onPress={onClose} />
                <View style={styles.modalView}>
                    <View style={styles.header}>
                        <View style={styles.imageContainer}>
                            {currentImage ? (
                                <Image source={{ uri: currentImage }} style={styles.profileImage} />
                            ) : (
                                <View style={[styles.profileImage, { backgroundColor: '#E0E0E0' }]} />
                            )}
                        </View>
                        <Text style={styles.title}>Edit Profile Picture</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close-circle" size={24} color="#BDBDBD" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity style={styles.optionItem} onPress={onUseAvatar}>
                            <Text style={styles.optionText}>Use Avatar</Text>
                            <MaterialCommunityIcons name="face-man-profile" size={22} color="#424242" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.optionItem} onPress={onTakePhoto}>
                            <Text style={styles.optionText}>Take Photo</Text>
                            <Ionicons name="camera-outline" size={22} color="#424242" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.optionItem} onPress={onChoosePhoto}>
                            <Text style={styles.optionText}>Choose Photo</Text>
                            <Ionicons name="image-outline" size={22} color="#424242" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={[styles.optionItem, styles.lastItem]} onPress={onDeletePhoto}>
                            <Text style={styles.optionText}>Delete Photo</Text>
                            <Ionicons name="trash-outline" size={22} color="#FF5252" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    modalView: {
        backgroundColor: '#F5F5F5', // Light gray background
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    imageContainer: {
        marginRight: 16,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    optionsContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    optionText: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginHorizontal: 0,
    },
    lastItem: {
        // Any specific style for delete?
    }
});

export default ProfilePhotoModal;
