import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../theme/theme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import EmojiFace from '../components/EmojiFace';
import CustomSlider from '../components/CustomSlider';

const AssessmentScreen = ({ navigation }) => {
    // 0 = Default (Gray), 1 = Nope, 2 = Not sure, 3 = A little bit, 4 = Kind of, 5 = Absolutely
    const [sliderValue, setSliderValue] = useState(0);

    const labels = {
        0: '',
        1: 'Nope',
        2: 'Not sure',
        3: 'A little bit',
        4: 'Kind of',
        5: 'Absolutely'
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
                        <EmojiFace type={sliderValue} size={180} />
                    </View>

                    <View style={styles.sliderContainer}>
                        <CustomSlider
                            value={sliderValue}
                            onValueChange={setSliderValue}
                            steps={5}
                        />
                    </View>

                    <Button
                        title="Continue"
                        onPress={() => navigation.navigate('NineIndex')}
                        style={styles.continueButton}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#C8E6E2',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.md,
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        padding: 0,
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.black,
        textAlign: 'center',
        flex: 1,
    },
    badge: {
        backgroundColor: 'rgba(0, 169, 157, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.lg,
    },
    question: {
        ...TYPOGRAPHY.h1,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        color: COLORS.black,
        lineHeight: 36,
    },
    assessmentCard: {
        width: '100%',
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    emojiLabel: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: SPACING.lg,
        color: COLORS.black,
        height: 27,
    },
    emojiContainer: {
        width: 180,
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    sliderContainer: {
        width: '100%',
        marginBottom: SPACING.xxl,
        paddingHorizontal: SPACING.lg,
    },
    continueButton: {
        width: '100%',
        marginTop: SPACING.xl,
    },
});

export default AssessmentScreen;
