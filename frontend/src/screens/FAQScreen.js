import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';



const FAQScreen = ({ navigation }) => {

    const faqs = [
        {
            id: 1,
            question: "What is Empylo Circle?",
            answer: "Empylo Circle is a space for teams and individuals to connect, track their wellbeing, and participate in group activities."
        },
        {
            id: 2,
            question: "Can I create a group?",
            answer: "Yes! If you are a Personal User, you can create circles from your profile page."
        },
        {
            id: 3,
            question: "Can users personalize the app?",
            answer: "Absolutely. You can customize your notification settings, profile picture, and security preferences."
        },
        {
            id: 4,
            question: "Is My Circles app free to use?",
            answer: "Usage is free for basic features."
        },
        {
            id: 5,
            question: "Is my data safe?",
            answer: "Yes, we use end-to-end encryption for security notification alerts and follow strict data privacy guidelines."
        },
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
                    This FAQ provides answers to basic questions about My Circles
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
