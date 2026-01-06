import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const { width } = Dimensions.get('window');

const PlanDetailModal = ({ visible, plan, onClose, onSubscribe }) => {
    if (!plan) return null;

    const benefits = [
        "Access to all learning modules",
        "Unlimited circle creations",
        "Advanced wellbeing analytics",
        "Priority support",
        "Exclusive monthly reports"
    ];

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
                        <View>
                            <Text style={styles.planName}>{plan.name}</Text>
                            <Text style={styles.planPrice}>
                                {plan.price}<Text style={styles.period}>/month</Text>
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close-circle" size={28} color="#E0E0E0" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.benefitsContainer}>
                        {benefits.map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                                <Ionicons name="checkmark-circle" size={20} color="#4DB6AC" />
                                <Text style={styles.benefitText}>{benefit}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity style={styles.subscribeButton} onPress={onSubscribe}>
                        <Text style={styles.subscribeText}>Subscribe</Text>
                        {/* Apple Pay / Google Pay shim could imply native sheet triggers */}
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
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    modalView: {
        width: width * 0.85,
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        paddingBottom: 16,
    },
    planName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1A1A',
        fontFamily: 'serif', // Trying to match the serif font in design "PRO $99"
    },
    period: {
        fontSize: 14,
        fontWeight: '400',
        color: '#757575',
    },
    closeButton: {
        marginTop: -4,
        marginRight: -4,
    },
    benefitsContainer: {
        marginBottom: 24,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    benefitText: {
        fontSize: 14,
        color: '#424242',
    },
    subscribeButton: {
        backgroundColor: '#4DB6AC', // Teal
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    subscribeText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PlanDetailModal;
