import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const LearningSessionScreen = ({ navigation, route }) => {
    const session = route.params?.session || route.params?.activity || null;
    const insets = useSafeAreaInsets();
    const title = session?.title || session?.name || 'Learning session';
    const paragraphs = Array.isArray(session?.paragraphs)
        ? session.paragraphs
        : (session?.content ? [session.content] : []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4DB6AC" />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {paragraphs.length === 0 ? (
                    <Text style={styles.paragraph}>Content is not available yet.</Text>
                ) : (
                    paragraphs.map((text, index) => (
                        <Text key={`${index}-${title}`} style={styles.paragraph}>
                            {text}
                        </Text>
                    ))
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                <TouchableOpacity style={styles.completeButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.completeButtonText}>Complete!</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.assessmentLink} onPress={() => navigation.navigate('Assessment')}>
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
