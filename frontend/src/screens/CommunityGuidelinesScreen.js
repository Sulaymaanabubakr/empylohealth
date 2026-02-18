import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_LINKS } from '../constants/legalLinks';
import { LinearGradient } from 'expo-linear-gradient';

export default function CommunityGuidelinesScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Community Guidelines</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <LinearGradient
                    colors={['#0EA99A', '#12799B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <Text style={styles.heroTitle}>Community Guidelines</Text>
                    <Text style={styles.heroBody}>
                        These standards help keep Circles safe, respectful, and genuinely supportive. Every user, moderator, and admin is expected to follow them.
                    </Text>
                </LinearGradient>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>1. Core Conduct Expectations</Text>
                    <Text style={styles.paragraph}>
                        Engage with empathy, honesty, and restraint. Disagreement is allowed, but abuse is not. We expect members to contribute in ways that reduce harm
                        and strengthen trust in the community.
                    </Text>
                    <Text style={styles.listItem}>• Treat people with dignity regardless of background, identity, or belief.</Text>
                    <Text style={styles.listItem}>• Avoid personal attacks, intimidation, and hostile targeting.</Text>
                    <Text style={styles.listItem}>• Keep discussions constructive and relevant to wellbeing support.</Text>
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>2. Prohibited Content and Behavior</Text>
                    <Text style={styles.paragraph}>
                        The following categories are not allowed and may trigger immediate enforcement action depending on severity:
                    </Text>
                    <Text style={styles.listItem}>• Harassment, hate speech, threats, stalking, or repeated abuse.</Text>
                    <Text style={styles.listItem}>• Sexual exploitation, explicit content, or violent/extremist material.</Text>
                    <Text style={styles.listItem}>• Scams, impersonation, deception, and malicious links.</Text>
                    <Text style={styles.listItem}>• Spam, coordinated disruption, or manipulation of group interactions.</Text>
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>3. Privacy and Consent</Text>
                    <Text style={styles.paragraph}>
                        Members must protect private information. Do not expose personal details, sensitive health context, or private media without clear permission.
                    </Text>
                    <Text style={styles.listItem}>• No doxxing or sharing confidential details.</Text>
                    <Text style={styles.listItem}>• No unauthorized screenshots/leaks of private conversations.</Text>
                    <Text style={styles.listItem}>• Respect boundaries when contacting others inside or outside chats.</Text>
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>4. Reporting and Moderation Process</Text>
                    <Text style={styles.paragraph}>
                        Reports can be submitted for both messages and members. Moderators and admins review reports, check context, and apply the least severe action
                        that still protects the community.
                    </Text>
                    <Text style={styles.listItem}>• Possible outcomes: dismissal, warning, content removal, role restriction, or ban.</Text>
                    <Text style={styles.listItem}>• Repeated violations escalate faster than first-time low-severity incidents.</Text>
                    <Text style={styles.listItem}>• Severe safety risks may lead to immediate account/circle-level action.</Text>
                </View>

                <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>5. Healthy Community Practices</Text>
                    <Text style={styles.paragraph}>
                        Strong communities are active, respectful, and accountable. Share responsibly, listen actively, and encourage support that is practical and safe.
                    </Text>
                    <Text style={styles.listItem}>• Use huddles and chats for support, not pressure.</Text>
                    <Text style={styles.listItem}>• Encourage professional help for urgent or high-risk situations.</Text>
                    <Text style={styles.listItem}>• Model behavior you want others to follow.</Text>
                </View>

                <TouchableOpacity style={styles.fullPolicyButton} onPress={() => Linking.openURL(LEGAL_LINKS.communityGuidelines)}>
                    <Text style={styles.fullPolicyText}>Open Full Guidelines</Text>
                </TouchableOpacity>
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
    content: { padding: 20, paddingBottom: 30 },
    hero: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 12
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6
    },
    heroBody: {
        fontSize: 13,
        lineHeight: 18,
        color: 'rgba(255,255,255,0.93)'
    },
    sectionBlock: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E8EDF4'
    },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
    paragraph: { fontSize: 13, color: '#5F6C80', lineHeight: 18, marginBottom: 6 },
    listItem: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
    fullPolicyButton: {
        marginTop: 6,
        backgroundColor: '#00A99D',
        borderRadius: 12,
        alignItems: 'center',
        paddingVertical: 12
    },
    fullPolicyText: { color: '#FFFFFF', fontWeight: '700' }
});
