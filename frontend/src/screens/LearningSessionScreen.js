import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const LearningSessionScreen = ({ navigation, route }) => {
    const { session } = route.params || { session: { title: 'Session Title' } };
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4DB6AC" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{session.title}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.paragraph}>
                    Effective workplace relationships are the cornerstone of a healthy and productive organizational culture. Building strong connections with colleagues fosters trust, enhances collaboration, and creates a supportive environment where everyone can thrive. It starts with open communication and mutual respect.
                </Text>

                <Text style={styles.paragraph}>
                    Understanding professional boundaries is crucial. While it's important to be friendly and approachable, maintaining a level of professionalism ensures that interactions remain respectful and focused on shared goals. This balance helps in preventing conflicts and misunderstandings that can arise in a diverse work environment.
                </Text>

                <Text style={styles.paragraph}>
                    Active listening is a key skill in nurturing these relationships. By genuinely paying attention to the ideas and concerns of others, you demonstrate that you value their input. This not only boosts morale but also leads to better problem-solving and innovation within the team.
                </Text>

                <Text style={styles.paragraph}>
                    Finally, remember that conflict is natural but how you handle it matters. approaching disagreements with empathy and a solution-oriented mindset can turn potential friction into opportunities for growth and deeper understanding. Prioritize clarity and kindness in all your interactions.
                </Text>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity style={styles.completeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.completeButtonText}>Complete!</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.assessmentLink}>
                    <Text style={styles.assessmentLinkText}>Take assessment</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        backgroundColor: '#4DB6AC', // Teal
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 60, // approximate safe area + margin
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginTop: 40, // Space for back button
        paddingHorizontal: 40,
    },
    content: {
        padding: 24,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        color: '#424242',
        marginBottom: 20,
        textAlign: 'justify',
    },
    footer: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    completeButton: {
        backgroundColor: '#4DB6AC',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#4DB6AC",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    assessmentLink: {
        padding: 8,
    },
    assessmentLinkText: {
        color: '#757575',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default LearningSessionScreen;
