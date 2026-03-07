import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const toDateFromTime24 = (value) => {
    const parsed = parseTime24(value);
    const date = new Date();
    date.setHours(parsed.hour24, parsed.minute, 0, 0);
    return date;
};

const TimePicker = ({ label, value, time24Value, onSelect, icon, placeholder = 'Select time' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const initial = parseTime24(time24Value);
    const initial12 = to12Hour(initial.hour24);
    const [selectedHour, setSelectedHour] = useState(initial12.hour);
    const [selectedMinute, setSelectedMinute] = useState(initial.minute);
    const [selectedPeriod, setSelectedPeriod] = useState(initial12.period);
    const [selectedIosDate, setSelectedIosDate] = useState(() => toDateFromTime24(time24Value));

    const open = () => {
        const now = parseTime24(time24Value);
        const now12 = to12Hour(now.hour24);
        setSelectedHour(now12.hour);
        setSelectedMinute(now.minute);
        setSelectedPeriod(now12.period);
        setSelectedIosDate(toDateFromTime24(time24Value));
        setIsOpen(true);
    };

    const confirm = () => {
        if (Platform.OS === 'ios') {
            const time24 = `${String(selectedIosDate.getHours()).padStart(2, '0')}:${String(selectedIosDate.getMinutes()).padStart(2, '0')}`;
            onSelect?.(time24);
            setIsOpen(false);
            return;
        }
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
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setIsOpen(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || 'Select Time'}</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {Platform.OS === 'ios' ? (
                            <View style={styles.iosPickerWrap}>
                                <DateTimePicker
                                    value={selectedIosDate}
                                    mode="time"
                                    display="spinner"
                                    onChange={(_, nextDate) => {
                                        if (nextDate) setSelectedIosDate(nextDate);
                                    }}
                                    textColor={COLORS.text}
                                />
                                <Text style={styles.previewText}>
                                    {selectedIosDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.pickerRow}>
                                    <View style={styles.inlinePickerColumn}>
                                        <Text style={styles.inlinePickerLabel}>Hour</Text>
                                        <ScrollView style={styles.inlinePickerList} nestedScrollEnabled>
                                            {HOURS_12.map((hour) => (
                                                <TouchableOpacity
                                                    key={hour}
                                                    style={[styles.pickerItem, hour === selectedHour && styles.pickerItemSelected]}
                                                    onPress={() => setSelectedHour(hour)}
                                                >
                                                    <Text style={[styles.pickerItemText, hour === selectedHour && styles.pickerItemTextSelected]}>
                                                        {String(hour).padStart(2, '0')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <View style={styles.inlinePickerColumn}>
                                        <Text style={styles.inlinePickerLabel}>Minute</Text>
                                        <ScrollView style={styles.inlinePickerList} nestedScrollEnabled>
                                            {MINUTES.map((minute) => (
                                                <TouchableOpacity
                                                    key={minute}
                                                    style={[styles.pickerItem, minute === selectedMinute && styles.pickerItemSelected]}
                                                    onPress={() => setSelectedMinute(minute)}
                                                >
                                                    <Text style={[styles.pickerItemText, minute === selectedMinute && styles.pickerItemTextSelected]}>
                                                        {String(minute).padStart(2, '0')}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <View style={styles.inlinePickerColumn}>
                                        <Text style={styles.inlinePickerLabel}>Period</Text>
                                        <View style={styles.periodList}>
                                            {PERIODS.map((period) => (
                                                <TouchableOpacity
                                                    key={period}
                                                    style={[styles.pickerItem, period === selectedPeriod && styles.pickerItemSelected]}
                                                    onPress={() => setSelectedPeriod(period)}
                                                >
                                                    <Text style={[styles.pickerItemText, period === selectedPeriod && styles.pickerItemTextSelected]}>
                                                        {period}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>

                                <Text style={styles.previewText}>{formatDisplay(selectedHour, selectedMinute, selectedPeriod)}</Text>
                            </>
                        )}

                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => setIsOpen(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={confirm}>
                                <Text style={styles.confirmText}>Set Time</Text>
                            </TouchableOpacity>
                        </View>
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
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalContent: {
        width: '90%',
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        maxHeight: '80%',
        zIndex: 1
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    modalTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
    pickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md, gap: 8 },
    iosPickerWrap: {
        marginBottom: SPACING.md,
        alignItems: 'center'
    },
    inlinePickerColumn: { flex: 1 },
    inlinePickerLabel: { fontSize: 12, color: '#7A8699', fontWeight: '600', marginBottom: 6, textAlign: 'center' },
    inlinePickerList: { maxHeight: 170, backgroundColor: COLORS.lightGray, borderRadius: RADIUS.md, padding: 4 },
    periodList: { backgroundColor: COLORS.lightGray, borderRadius: RADIUS.md, padding: 4 },
    previewText: { textAlign: 'center', fontSize: 24, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.lg },
    actions: { flexDirection: 'row' },
    actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.md, paddingVertical: SPACING.md },
    cancelBtn: { backgroundColor: COLORS.lightGray, marginRight: 8 },
    confirmBtn: { backgroundColor: COLORS.primary, marginLeft: 8 },
    cancelText: { color: COLORS.text, fontWeight: '600' },
    confirmText: { color: '#FFF', fontWeight: '700' },
    pickerItem: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.xs },
    pickerItemSelected: { backgroundColor: `${COLORS.primary}20` },
    pickerItemText: { fontSize: 16, color: COLORS.text, textAlign: 'center' },
    pickerItemTextSelected: { color: COLORS.primary, fontWeight: '600' }
});

export default TimePicker;
