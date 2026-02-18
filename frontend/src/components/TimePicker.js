import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../theme/theme';

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'];

const parseTime24 = (value) => {
    const [hRaw, mRaw] = String(value || '').split(':');
    const hour24 = Number(hRaw);
    const minute = Number(mRaw);
    if (!Number.isFinite(hour24) || !Number.isFinite(minute)) return { hour24: 12, minute: 0 };
    return { hour24: Math.max(0, Math.min(23, hour24)), minute: Math.max(0, Math.min(59, minute)) };
};

const to12Hour = (hour24) => {
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour = hour24 % 12 || 12;
    return { hour, period };
};

const to24Hour = (hour12, period) => {
    if (period === 'AM') return hour12 % 12;
    return (hour12 % 12) + 12;
};

const formatDisplay = (hour12, minute, period) =>
    `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;

const TimePicker = ({ label, value, time24Value, onSelect, icon, placeholder = 'Select time' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showHourPicker, setShowHourPicker] = useState(false);
    const [showMinutePicker, setShowMinutePicker] = useState(false);
    const [showPeriodPicker, setShowPeriodPicker] = useState(false);

    const initial = parseTime24(time24Value);
    const initial12 = to12Hour(initial.hour24);
    const [selectedHour, setSelectedHour] = useState(initial12.hour);
    const [selectedMinute, setSelectedMinute] = useState(initial.minute);
    const [selectedPeriod, setSelectedPeriod] = useState(initial12.period);

    const open = () => {
        const now = parseTime24(time24Value);
        const now12 = to12Hour(now.hour24);
        setSelectedHour(now12.hour);
        setSelectedMinute(now.minute);
        setSelectedPeriod(now12.period);
        setIsOpen(true);
    };

    const confirm = () => {
        const hour24 = to24Hour(selectedHour, selectedPeriod);
        const time24 = `${String(hour24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`;
        onSelect?.(time24);
        setIsOpen(false);
    };

    return (
        <View style={styles.container}>
            {label ? <Text style={styles.label}>{label}</Text> : null}

            <TouchableOpacity style={styles.input} onPress={open} activeOpacity={0.8}>
                {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
                <Text style={[styles.inputText, value && { color: COLORS.text }]}>{value || placeholder}</Text>
                <Feather name="chevron-down" size={18} color="#7A8699" />
            </TouchableOpacity>

            <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsOpen(false)}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || 'Select Time'}</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pickerRow}>
                            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowHourPicker(true)}>
                                <Text style={styles.pickerButtonText}>{String(selectedHour).padStart(2, '0')}</Text>
                                <Feather name="chevron-down" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowMinutePicker(true)}>
                                <Text style={styles.pickerButtonText}>{String(selectedMinute).padStart(2, '0')}</Text>
                                <Feather name="chevron-down" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.pickerButton} onPress={() => setShowPeriodPicker(true)}>
                                <Text style={styles.pickerButtonText}>{selectedPeriod}</Text>
                                <Feather name="chevron-down" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.previewText}>{formatDisplay(selectedHour, selectedMinute, selectedPeriod)}</Text>

                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setIsOpen(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={confirm}>
                                <Text style={styles.confirmText}>Set Time</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={showHourPicker} transparent animationType="slide">
                <View style={styles.pickerModal}>
                    <View style={styles.pickerContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Select Hour</Text>
                            <TouchableOpacity onPress={() => setShowHourPicker(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {HOURS_12.map((hour) => (
                                <TouchableOpacity
                                    key={hour}
                                    style={[styles.pickerItem, hour === selectedHour && styles.pickerItemSelected]}
                                    onPress={() => {
                                        setSelectedHour(hour);
                                        setShowHourPicker(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, hour === selectedHour && styles.pickerItemTextSelected]}>
                                        {String(hour).padStart(2, '0')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showMinutePicker} transparent animationType="slide">
                <View style={styles.pickerModal}>
                    <View style={styles.pickerContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>Select Minute</Text>
                            <TouchableOpacity onPress={() => setShowMinutePicker(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {MINUTES.map((minute) => (
                                <TouchableOpacity
                                    key={minute}
                                    style={[styles.pickerItem, minute === selectedMinute && styles.pickerItemSelected]}
                                    onPress={() => {
                                        setSelectedMinute(minute);
                                        setShowMinutePicker(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, minute === selectedMinute && styles.pickerItemTextSelected]}>
                                        {String(minute).padStart(2, '0')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <Modal visible={showPeriodPicker} transparent animationType="slide">
                <View style={styles.pickerModal}>
                    <View style={styles.pickerContent}>
                        <View style={styles.pickerHeader}>
                            <Text style={styles.pickerTitle}>AM / PM</Text>
                            <TouchableOpacity onPress={() => setShowPeriodPicker(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {PERIODS.map((period) => (
                                <TouchableOpacity
                                    key={period}
                                    style={[styles.pickerItem, period === selectedPeriod && styles.pickerItemSelected]}
                                    onPress={() => {
                                        setSelectedPeriod(period);
                                        setShowPeriodPicker(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, period === selectedPeriod && styles.pickerItemTextSelected]}>
                                        {period}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: SPACING.md },
    label: { fontSize: 14, fontWeight: '600', marginBottom: SPACING.xs, color: COLORS.text },
    input: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.pill,
        paddingHorizontal: SPACING.md,
        height: 56,
        borderWidth: 1,
        borderColor: COLORS.lightGray
    },
    iconContainer: { marginRight: SPACING.sm },
    inputText: { flex: 1, color: '#999', fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '90%',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        maxHeight: '80%'
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    modalTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    pickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.lightGray,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        flex: 1,
        marginHorizontal: 4,
        justifyContent: 'center'
    },
    pickerButtonText: { fontSize: 16, color: COLORS.text, marginRight: 6, fontWeight: '500' },
    previewText: { textAlign: 'center', fontSize: 24, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.lg },
    actions: { flexDirection: 'row' },
    actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, paddingVertical: SPACING.md },
    cancelBtn: { backgroundColor: COLORS.lightGray, marginRight: 8 },
    confirmBtn: { backgroundColor: COLORS.primary, marginLeft: 8 },
    cancelText: { color: COLORS.text, fontWeight: '600' },
    confirmText: { color: '#FFF', fontWeight: '700' },
    pickerModal: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
    pickerContent: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '70%', padding: SPACING.lg },
    pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    pickerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    pickerItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.xs },
    pickerItemSelected: { backgroundColor: `${COLORS.primary}20` },
    pickerItemText: { fontSize: 16, color: COLORS.text, textAlign: 'center' },
    pickerItemTextSelected: { color: COLORS.primary, fontWeight: '600' }
});

export default TimePicker;
