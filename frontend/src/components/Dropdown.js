import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme/theme';
import { Feather } from '@expo/vector-icons';



const normalizeOption = (option) => {
    if (typeof option === 'string') {
        return { label: option, value: option };
    }
    if (option && typeof option === 'object') {
        return {
            label: option.label || option.value || '',
            value: option.value || option.label || ''
        };
    }
    return { label: '', value: '' };
};

const Dropdown = ({ label, value, options = [], onSelect, icon, placeholder = 'Select' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const normalizedOptions = useMemo(
        () => options.map(normalizeOption).filter((item) => item.value),
        [options]
    );
    const filteredOptions = useMemo(() => {
        const query = String(searchQuery || '').trim().toLowerCase();
        if (!query) return normalizedOptions;
        return normalizedOptions.filter((item) => {
            const haystack = `${item.label} ${item.value}`.toLowerCase();
            return haystack.includes(query);
        });
    }, [normalizedOptions, searchQuery]);
    const selectedOption = useMemo(
        () => normalizedOptions.find((item) => item.value === value || item.label === value) || null,
        [normalizedOptions, value]
    );

    const handleSelect = (option) => {
        onSelect(option.value);
        setSearchQuery('');
        setIsOpen(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                    setSearchQuery('');
                    setIsOpen(true);
                }}
                activeOpacity={0.7}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={[styles.dropdownText, value && { color: COLORS.text }]}>
                    {selectedOption?.label || value || placeholder}
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

                        <View style={styles.searchWrap}>
                            <Feather name="search" size={18} color="#94A3B8" />
                            <TextInput
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder={`Search ${String(label || 'options').toLowerCase()}...`}
                                placeholderTextColor="#94A3B8"
                                style={styles.searchInput}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <FlatList
                            style={styles.optionsList}
                            data={filteredOptions}
                            keyExtractor={(option, index) => `${option.value}-${index}`}
                            initialNumToRender={16}
                            maxToRenderPerBatch={20}
                            windowSize={8}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item: option }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.optionItem,
                                        selectedOption?.value === option.value && styles.optionItemSelected
                                    ]}
                                    onPress={() => handleSelect(option)}
                                >
                                    <View style={styles.optionTextWrap}>
                                        <Text
                                            style={[
                                                styles.optionText,
                                                selectedOption?.value === option.value && styles.optionTextSelected
                                            ]}
                                            numberOfLines={2}
                                        >
                                            {option.label}
                                        </Text>
                                    </View>
                                    {selectedOption?.value === option.value && (
                                        <Feather name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
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
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.md,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.text,
        paddingVertical: 0,
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
    optionTextWrap: {
        flex: 1,
        paddingRight: SPACING.sm,
    },
    optionItemSelected: {
        backgroundColor: '#E0F2F1',
    },
    optionText: {
        fontSize: 16,
        color: COLORS.text,
        flexShrink: 1,
    },
    optionTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
});

export default Dropdown;
