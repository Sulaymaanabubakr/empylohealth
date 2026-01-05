import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

const NineIndexScreen = () => {
    const questions = [
        "I've been feeling relaxed",
        "I've been feeling useful",
        "I've been had energy to spare",
        "I've been feeling interested in other people",
        "I've been thinking clearly"
    ];

    const options = ["Not at all", "Rarely", "Sometimes", "Most times", "Always"];

    const [answers, setAnswers] = useState({});

    const handleSelect = (qIndex, option) => {
        setAnswers({ ...answers, [qIndex]: option });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>In the past week...</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {questions.map((question, qIndex) => (
                    <View key={qIndex} style={styles.questionCard}>
                        <Text style={styles.questionText}>"{question}"</Text>
                        <View style={styles.optionsContainer}>
                            {options.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.optionButton,
                                        answers[qIndex] === option && styles.selectedOptionButton
                                    ]}
                                    onPress={() => handleSelect(qIndex, option)}
                                >
                                    <View style={[
                                        styles.radio,
                                        answers[qIndex] === option && styles.selectedRadio
                                    ]} />
                                    <Text style={[
                                        styles.optionText,
                                        answers[qIndex] === option && styles.selectedOptionText
                                    ]}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                <Button
                    title="Save"
                    onPress={() => { }}
                    style={styles.saveButton}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        marginRight: SPACING.md,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    questionCard: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    questionText: {
        ...TYPOGRAPHY.body,
        fontWeight: '600',
        fontStyle: 'italic',
        marginBottom: SPACING.md,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 4,
    },
    selectedOptionButton: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    radio: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1,
        borderColor: '#999',
        marginRight: 6,
    },
    selectedRadio: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.white,
    },
    optionText: {
        fontSize: 12,
        color: '#666',
    },
    selectedOptionText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    saveButton: {
        marginTop: SPACING.xl,
        marginBottom: SPACING.xxl,
    },
});

export default NineIndexScreen;
