import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Button from '../components/Button';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { assessmentService } from '../services/api/assessmentService';
import { weeklyAssessment } from '../services/assessments/weeklyAssessment';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NineIndexScreen = ({ navigation }) => {
    const normalizeQuestionText = (text = '') => {
        const value = String(text).trim();
        if (/i['’]?ve been had energy to spare/i.test(value)) {
            return "I've had energy to spare";
        }
        return value;
    };

    const defaultQuestions = [
        "I've been feeling relaxed",
        "I've been feeling useful",
        "I've had energy to spare",
        "I've been feeling interested in other people",
        "I've been thinking clearly"
    ];

    const [dbQuestions, setDbQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const data = await assessmentService.getQuestions();
            if (data && data.length > 0) {
                setDbQuestions(data);
            }
        } catch (error) {
            console.error("Failed to load questions", error);
        } finally {
            setIsLoading(false);
        }
    };

    const questions = (dbQuestions.length > 0 ? dbQuestions.map(q => q.text) : defaultQuestions)
        .map(normalizeQuestionText);

    const options = ["Not at all", "Rarely", "Sometimes", "Most times", "Always"];

    // Map each option to a different emoji
    const getEmojiIcon = (option) => {
        const emojiMap = {
            "Not at all": "emoticon-sad-outline",
            "Rarely": "emoticon-neutral-outline",
            "Sometimes": "emoticon-outline",
            "Most times": "emoticon-happy-outline",
            "Always": "emoticon-excited-outline"
        };
        return emojiMap[option] || "emoticon-outline";
    };

    const handleSelect = (qIndex, option) => {
        setAnswers({ ...answers, [qIndex]: option });
    };

    const allAnswered = questions.every((_, idx) => answers[idx]);

    const handleSave = async () => {
        if (!allAnswered || isSubmitting) return;
        setSaveSuccess(false);
        setIsSubmitting(true);
        try {
            const optionScore = {
                "Not at all": 0,
                "Rarely": 1,
                "Sometimes": 2,
                "Most times": 3,
                "Always": 4
            };
            const total = questions.reduce((sum, question, idx) => {
                const answer = answers[idx];
                return sum + (optionScore[answer] ?? 0);
            }, 0);
            const maxScore = questions.length * 4;
            const score = Math.round((total / maxScore) * 100);
            const answerMap = questions.reduce((acc, question, idx) => {
                acc[question] = answers[idx];
                return acc;
            }, {});

            await assessmentService.submitAssessment('questionnaire', score, answerMap, '');
            const now = new Date();
            await AsyncStorage.multiSet([
                ['lastWeeklyAssessmentDate', now.toISOString()],
                ['lastWeeklyAssessmentWeekKey', weeklyAssessment.getCurrentWeekKey(now)],
                ['lastDailyCheckInDate', now.toDateString()]
            ]);
            await AsyncStorage.removeItem('pendingWeeklyAssessment');
            setSaveSuccess(true);
            setTimeout(() => {
                navigation.navigate('MainTabs', { screen: 'Dashboard' });
            }, 500);
        } catch (error) {
            console.error('Questionnaire submission failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>In the past week...</Text>
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
                                    <MaterialCommunityIcons
                                        name={getEmojiIcon(option)}
                                        size={16}
                                        color={answers[qIndex] === option ? COLORS.white : '#666'}
                                        style={styles.smileyIcon}
                                    />
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
                    title={isSubmitting ? "Saving..." : (saveSuccess ? "Saved" : "Save")}
                    onPress={handleSave}
                    style={styles.saveButton}
                    disabled={!allAnswered || isSubmitting}
                />
                <Text style={styles.saveHint}>
                    {saveSuccess ? 'Assessment saved. Returning to dashboard...' : 'Tap Save to store your weekly assessment.'}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 10,
        height: 50,
        position: 'relative',
        justifyContent: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: SPACING.lg,
        zIndex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xxl,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    questionCard: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 2,
        borderColor: '#B2DFDB',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: SPACING.md,
        color: COLORS.text,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#333',
        backgroundColor: COLORS.white,
    },
    selectedOptionButton: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    smileyIcon: {
        marginRight: 6,
    },
    optionText: {
        fontSize: 14,
        color: COLORS.text,
    },
    selectedOptionText: {
        color: COLORS.white,
        fontWeight: '600',
    },
    saveButton: {
        marginTop: SPACING.xl,
    },
    saveHint: {
        marginTop: SPACING.sm,
        textAlign: 'center',
        color: '#607D8B',
        fontSize: 12,
        fontWeight: '600',
    },
});

export default NineIndexScreen;
