import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import EmojiFace from '../components/EmojiFace';
import VisibleSlider from '../components/VisibleSlider';
import { assessmentService } from '../services/api/assessmentService';

const AssessmentScreen = ({ navigation }) => {
    // 0 = Default (Gray), 1 = Nope, 2 = Not sure, 3 = A little bit, 4 = Kind of, 5 = Absolutely
    const [sliderValue, setSliderValue] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const labels = {
        0: '',
        1: 'Nope',
        2: 'Not sure',
        3: 'A little bit',
        4: 'Kind of',
        5: 'Absolutely'
    };

    const handleContinue = async () => {
        setIsSubmitting(true);
        try {
            const score = Math.round((sliderValue / 5) * 100);
            const mood = labels[sliderValue] || '';
            await assessmentService.submitAssessment('daily', score, {}, mood);
            navigation.navigate('NineIndex');
        } catch (error) {
            console.error('Assessment submission failed', error);
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
                <Text style={styles.headerTitle}>Assessment</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>1 OF 2</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.question}>Do you feel loved{"\n"}today?</Text>

                <View style={styles.assessmentCard}>
                    <Text style={styles.emojiLabel}>{labels[sliderValue]}</Text>

                    <View style={styles.emojiContainer}>
                        <EmojiFace type={sliderValue} size={200} />
                    </View>

                    <View style={styles.sliderContainer}>
                        <VisibleSlider
                            value={sliderValue}
                            onValueChange={setSliderValue}
                            steps={5}
                        />
                    </View>

                    <Button
                        title={isSubmitting ? "Saving..." : "Continue"}
                        onPress={handleContinue}
                        style={styles.continueButton}
                        disabled={isSubmitting}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // Clean white background for vibrancy
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.lg,
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 22,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800', // Bolder font
        color: '#1A1A1A',
        textAlign: 'center',
        flex: 1,
    },
    badge: {
        backgroundColor: '#E0F2F1', // Light teal background
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#B2DFDB',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '800', // Bolder font
        color: '#00695C', // Darker teal for contrast
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.sm,
    },
    question: {
        fontSize: 32, // Larger font size
        fontWeight: '900', // Extra bold
        textAlign: 'center',
        marginBottom: 40,
        color: '#212121', // Darker black
        lineHeight: 40,
        letterSpacing: -0.5,
    },
    assessmentCard: {
        width: '100%',
        alignItems: 'center',
        flex: 1,
    },
    emojiLabel: {
        fontSize: 24, // Larger label
        fontWeight: '800',
        marginBottom: 30,
        color: COLORS.primary,
        height: 32,
        textAlign: 'center',
    },
    emojiContainer: {
        width: 220,
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 60,
        // Add a subtle glow/shadow behind the emoji
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 110,
    },
    sliderContainer: {
        width: '100%',
        marginBottom: 40,
        paddingHorizontal: SPACING.sm,
    },
    continueButton: {
        width: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 30, // Pill shape
        paddingVertical: 18,
        shadowColor: COLORS.primary, // Colored shadow
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
});

export default AssessmentScreen;
