import React, { useState, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { COLORS, SPACING, RADIUS } from '../theme/theme';
import { Feather } from '@expo/vector-icons';

    label?: string;
    value?: string;
    onSelect: (date) => void;
    icon?: ReactNode;
    placeholder?: string;
}

const DatePicker = ({ label, value, onSelect, icon, placeholder = 'Select date' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showMonthPicker, setShowMonthPicker] = useState(false);

    // Generate year range (1940 to current year)
    const years = Array.from({ length: new Date().getFullYear() - 1939 }, (_, i) => 1940 + i).reverse();
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleDateSelect = (day) => {
        const formattedDate = `${String(day.month).padStart(2, '0')}.${String(day.day).padStart(2, '0')}.${day.year}`;
        setSelectedDate(day.dateString);
        onSelect(formattedDate);
        setIsOpen(false);
    };

    const handleYearSelect = (year) => {
        setCurrentYear(year);
        setShowYearPicker(false);
    };

    const handleMonthSelect = (monthIndex) => {
        setCurrentMonth(monthIndex + 1);
        setShowMonthPicker(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={styles.input}
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                {icon && <View style={styles.iconContainer}>{icon}</View>}
                <Text style={[styles.inputText, value && { color: COLORS.text }]}>
                    {value || placeholder}
                </Text>
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
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label || 'Select Date'}</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)}>
                                <Feather name="x" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Year and Month Selectors */}
                        <View style={styles.pickerRow}>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowMonthPicker(true)}
                            >
                                <Text style={styles.pickerButtonText}>{months[currentMonth - 1]}</Text>
                                <Feather name="chevron-down" size={16} color={COLORS.primary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowYearPicker(true)}
                            >
                                <Text style={styles.pickerButtonText}>{currentYear}</Text>
                                <Feather name="chevron-down" size={16} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <Calendar
                            key={`${currentYear}-${currentMonth}`}
                            current={`${currentYear}-${String(currentMonth).padStart(2, '0')}-01`}
                            onDayPress={handleDateSelect}
                            markedDates={{
                                [selectedDate]: { selected: true, selectedColor: COLORS.primary }
                            }}
                            hideExtraDays={true}
                            disableMonthChange={true}
                            theme={{
                                backgroundColor: '#ffffff',
                                calendarBackground: '#ffffff',
                                textSectionTitleColor: COLORS.text,
                                selectedDayBackgroundColor: COLORS.primary,
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: COLORS.primary,
                                dayTextColor: COLORS.text,
                                textDisabledColor: '#d9e1e8',
                                arrowColor: COLORS.primary,
                                monthTextColor: COLORS.text,
                                textDayFontSize: 16,
                                textMonthFontSize: 18,
                                textDayHeaderFontSize: 14
                            }}
                        />
                    </View>
                </TouchableOpacity>

                {/* Year Picker Modal */}
                <Modal
                    visible={showYearPicker}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.pickerModal}>
                        <View style={styles.pickerContent}>
                            <View style={styles.pickerHeader}>
                                <Text style={styles.pickerTitle}>Select Year</Text>
                                <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                                    <Feather name="x" size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                {years.map(year => (
                                    <TouchableOpacity
                                        key={year}
                                        style={[styles.pickerItem, year === currentYear && styles.pickerItemSelected]}
                                        onPress={() => handleYearSelect(year)}
                                    >
                                        <Text style={[styles.pickerItemText, year === currentYear && styles.pickerItemTextSelected]}>
                                            {year}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Month Picker Modal */}
                <Modal
                    visible={showMonthPicker}
                    transparent={true}
                    animationType="slide"
                >
                    <View style={styles.pickerModal}>
                        <View style={styles.pickerContent}>
                            <View style={styles.pickerHeader}>
                                <Text style={styles.pickerTitle}>Select Month</Text>
                                <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                                    <Feather name="x" size={24} color={COLORS.text} />
                                </TouchableOpacity>
                            </View>
                            <ScrollView>
                                {months.map((month, index) => (
                                    <TouchableOpacity
                                        key={month}
                                        style={[styles.pickerItem, (index + 1) === currentMonth && styles.pickerItemSelected]}
                                        onPress={() => handleMonthSelect(index)}
                                    >
                                        <Text style={[styles.pickerItemText, (index + 1) === currentMonth && styles.pickerItemTextSelected]}>
                                            {month}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
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
    input: {
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
    inputText: {
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
    pickerRow: {
        flexDirection: 'row',
        padding: SPACING.md,
        gap: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    pickerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F5F5',
        padding: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: RADIUS.md,
    },
    pickerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    pickerModal: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
        maxHeight: '70%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
    pickerItem: {
        padding: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    pickerItemSelected: {
        backgroundColor: '#E0F2F1',
    },
    pickerItemText: {
        fontSize: 16,
        color: COLORS.text,
    },
    pickerItemTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
});

export default DatePicker;
