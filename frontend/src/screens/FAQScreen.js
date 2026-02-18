import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';



const FAQScreen = ({ navigation }) => {

    const faqs = [
        {
            id: 1,
            question: "What is Circles Health App?",
            answer: "Circles Health App by Empylo is a wellbeing and community platform for check-ins, chats, huddles, assessments, and support circles."
        },
        {
            id: 2,
            question: "Can I create a circle?",
            answer: "Yes. Personal users can create circles from the Profile area and invite others to join."
        },
        {
            id: 3,
            question: "What is the difference between a public and private circle?",
            answer: "Public circles are discoverable by other users. Private circles require approval and are not shown in public search."
        },
        {
            id: 4,
            question: "How does my wellbeing score work?",
            answer: "Your score is primarily based on weekly assessment trend, while daily check-ins provide supporting signal for more current status."
        },
        {
            id: 5,
            question: "Can I edit my profile information?",
            answer: "Yes. You can update your name, photo, bio, and other profile details from Personal Information."
        },
        {
            id: 6,
            question: "How do huddles work?",
            answer: "Huddles are live calls. You can start one from chat/circle and members can join from in-app or notification prompts."
        },
        {
            id: 7,
            question: "Can I schedule a huddle?",
            answer: "Yes. Scheduled huddles appear in circle areas with countdown timing, and members can opt into reminders."
        },
        {
            id: 8,
            question: "How do notifications behave?",
            answer: "Message, affirmation, and huddle notifications are routed to the relevant screen so you can continue directly in context."
        },
        {
            id: 9,
            question: "Can I mute or delete chats?",
            answer: "Yes. Chat list swipe actions support mute and delete with confirmation prompts."
        },
        {
            id: 10,
            question: "How do I report harmful behavior?",
            answer: "You can report both messages and members. Reports are reviewed by admins/moderators who can warn, remove content, or ban members."
        },
        {
            id: 11,
            question: "Can I block another user?",
            answer: "Yes. You can block users from profile actions in chat contexts to prevent direct messaging."
        },
        {
            id: 12,
            question: "Is my data safe?",
            answer: "We protect data in transit using HTTPS/TLS and secure cloud storage controls. We also apply moderation and account security safeguards."
        },
        {
            id: 13,
            question: "How do I delete my account?",
            answer: "Go to Profile > Account > Security > Delete Account. This is permanent. Some records may be retained or anonymized for safety/legal obligations."
        },
        {
            id: 14,
            question: "Is Circles Health App free to use?",
            answer: "Core usage is available with basic access. Subscription plans may unlock additional benefits where configured."
        }
    ];

    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FAQs</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.description}>
                    This FAQ provides quick answers on circles, chats, huddles, scores, safety, and account controls.
                </Text>

                {faqs.map((faq) => (
                    <View key={faq.id} style={styles.faqCard}>
                        <TouchableOpacity
                            style={styles.faqHeader}
                            onPress={() => toggleExpand(faq.id)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.questionText}>{faq.question}</Text>
                            <View style={[
                                styles.iconContainer,
                                { backgroundColor: expandedId === faq.id ? '#009688' : '#B2DFDB' }
                            ]}>
                                <Ionicons
                                    name={expandedId === faq.id ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    color={expandedId === faq.id ? "#FFF" : "#004D40"}
                                />
                            </View>
                        </TouchableOpacity>

                        {expandedId === faq.id && (
                            <View style={styles.answerContainer}>
                                <Text style={styles.answerText}>{faq.answer}</Text>
                            </View>
                        )}
                    </View>
                ))}

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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    description: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    faqCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 4, // Inner padding to simulate the rounded container
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    questionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 16,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    answerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    answerText: {
        fontSize: 13,
        color: '#616161',
        lineHeight: 18,
    },
});

export default FAQScreen;
