import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Linking } from 'react-native';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SOCIAL_LINKS = {
    facebook: 'https://facebook.com/empylo',
    instagram: 'https://instagram.com/empylo',
    tiktok: 'https://tiktok.com/@empylo',
    x: 'https://x.com/empylo'
};

export default function AboutCirclesScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About Circles Health App</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <LinearGradient
                    colors={['#12B8AB', '#0D8AA5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <Text style={styles.heroTitle}>Built for Better Wellbeing Communities</Text>
                    <Text style={styles.heroBody}>
                        Circles Health App by Empylo combines wellbeing insight, trusted communication, and community support into one practical platform for daily life.
                    </Text>
                </LinearGradient>

                <View style={styles.article}>
                    <Text style={styles.sectionTitle}>Our Vision</Text>
                    <Text style={styles.sectionText}>
                        We believe mental and emotional wellbeing improves faster when people are supported by both structured self-reflection and healthy relationships.
                        Circles Health App was designed to make that support accessible, measurable, and safe.
                    </Text>

                    <Text style={styles.sectionTitle}>Who the App Serves</Text>
                    <Text style={styles.sectionText}>
                        The app supports individuals, peer groups, community leaders, and wellbeing-focused organizations that need one system for check-ins,
                        support conversations, and shared learning.
                    </Text>

                    <Text style={styles.sectionTitle}>Core Experiences</Text>
                    <Text style={styles.listItem}>• Daily check-ins and weekly assessments to monitor wellbeing trends.</Text>
                    <Text style={styles.listItem}>• Circles for focused communities with moderated interaction.</Text>
                    <Text style={styles.listItem}>• 1-on-1 and group chat with actionable notifications.</Text>
                    <Text style={styles.listItem}>• Huddles for live voice/video support and scheduled sessions.</Text>
                    <Text style={styles.listItem}>• Affirmations and educational resources for habit-building.</Text>

                    <Text style={styles.sectionTitle}>Wellbeing Framework</Text>
                    <Text style={styles.sectionText}>
                        Scoring and guidance in Circles Health App follow a structured wellbeing model. Weekly trends drive the primary score, while daily signals
                        help keep context fresh so users can respond early to changes.
                    </Text>

                    <Text style={styles.sectionTitle}>Safety, Trust, and Control</Text>
                    <Text style={styles.sectionText}>
                        We include reporting, moderation, and user blocking to protect community spaces. Users also control key settings such as notifications,
                        privacy options, and account deletion from within the app.
                    </Text>

                    <Text style={styles.sectionTitle}>Product Direction</Text>
                    <Text style={styles.sectionText}>
                        Our roadmap continues to focus on practical wellbeing outcomes: faster support access, stronger moderation tooling, better participation insights,
                        and a smoother cross-platform experience for users and admins.
                    </Text>
                </View>

                <View style={styles.socialSection}>
                    <Text style={styles.socialTitle}>Follow Us</Text>
                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL(SOCIAL_LINKS.facebook)}>
                            <FontAwesome6 name="facebook-f" size={18} color="#1877F2" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL(SOCIAL_LINKS.instagram)}>
                            <FontAwesome6 name="instagram" size={18} color="#E1306C" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL(SOCIAL_LINKS.tiktok)}>
                            <FontAwesome6 name="tiktok" size={18} color="#111111" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialBtn} onPress={() => Linking.openURL(SOCIAL_LINKS.x)}>
                            <FontAwesome6 name="x-twitter" size={18} color="#111111" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 20
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    content: { padding: 20, paddingBottom: 34 },
    hero: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 14
    },
    heroTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6
    },
    heroBody: {
        fontSize: 13,
        lineHeight: 18,
        color: 'rgba(255,255,255,0.93)'
    },
    article: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8EDF4'
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
        marginTop: 8
    },
    sectionText: {
        fontSize: 13,
        color: '#5F6C80',
        lineHeight: 19
    },
    listItem: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 19
    },
    socialSection: {
        marginTop: 8,
        alignItems: 'center'
    },
    socialTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#364152',
        marginBottom: 12
    },
    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12
    },
    socialBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center'
    }
});
