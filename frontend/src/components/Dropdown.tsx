import React, { useState, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme/theme';
import { Feather } from '@expo/vector-icons';

interface DropdownProps {
    label?: string;
    value?: string;
    options: string[];
    onSelect: (value: string) => void;
    icon?: ReactNode;
    placeholder?: string;
}

const Dropdown: React.FC<DropdownProps> = ({ label, value, options, onSelect, icon, placeholder = 'Select' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (option: string) => {
        onSelect(option);
        setIsOpen(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={[styles.dropdownText, value && { color: COLORS.text }]}>
                    {value || placeholder}
                </Text>
                <Feather name="chevron-down" size={20} color="black" />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsOpen(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || 'Select an option'}</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.optionsList}>
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.optionItem,
                                        value === option && styles.optionItemSelected
                                    ]}
                                    onPress={() => handleSelect(option)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        value === option && styles.optionTextSelected
                                    ]}>
                                        {option}
                                    </Text>
                                    {value === option && (
                                        <Feather name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: SPACING.xs,
        color: COLORS.text,
    },
    dropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.pill,
        paddingHorizontal: SPACING.md,
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
    },
    iconContainer: {
        marginRight: SPACING.sm,
    },
    dropdownText: {
        flex: 1,
        color: '#999',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        width: '100%',
        maxHeight: '70%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    optionsList: {
        maxHeight: 400,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    optionItemSelected: {
        backgroundColor: '#E0F2F1',
    },
    optionText: {
        fontSize: 16,
        color: COLORS.text,
    },
    optionTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
});

export default Dropdown;
