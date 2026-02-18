import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const educationTracks = [
    {
        icon: 'compass-outline',
        title: 'How Circles works',
        body: 'Circles helps people support each other through communities, direct chats, huddles, wellbeing check-ins, and guided growth content.',
        tag: 'Start here'
    },
    {
        icon: 'analytics-outline',
        title: 'Wellbeing score basics',
        body: 'Your wellbeing score is driven primarily by your weekly assessment trend, with daily check-ins used as supporting signal to keep your status current.',
        tag: 'Scoring'
    },
    {
        icon: 'chatbubble-ellipses-outline',
        title: 'Chats and huddles',
        body: 'Use chat for ongoing support and huddles for real-time voice/video connection. Scheduled huddles notify members before start time.',
        tag: 'Realtime'
    },
    {
        icon: 'shield-checkmark-outline',
        title: 'Safety controls',
        body: 'You can report messages/users, block direct contacts, mute chats, and use moderator/admin actions to keep communities safe.',
        tag: 'Safety'
    },
    {
        icon: 'notifications-outline',
        title: 'Notifications and routing',
        body: 'Message, affirmation, and huddle notifications are designed to open the relevant screen directly so users can act without losing context.',
        tag: 'Alerts'
    }
];

export default function CommunityEducationScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Community Education</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <LinearGradient
                    colors={['#0DAFA3', '#0C7B9B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <View style={styles.heroIconWrap}>
                        <Ionicons name="school-outline" size={20} color="#0D7D75" />
                    </View>
                    <Text style={styles.heroTitle}>Learn Circles Faster</Text>
                    <Text style={styles.heroBody}>
                        Understand the core flows, wellbeing model, and safety actions so your community gets real value from day one.
                    </Text>
                </LinearGradient>

                <Text style={styles.sectionHeader}>Learning Tracks</Text>
                {educationTracks.map((track, index) => (
                    <View key={track.title} style={styles.trackCard}>
                        <View style={styles.trackRow}>
                            <View style={styles.trackIndex}>
                                <Text style={styles.trackIndexText}>{index + 1}</Text>
                            </View>
                            <View style={styles.trackIcon}>
                                <Ionicons name={track.icon} size={18} color="#0D8A80" />
                            </View>
                            <View style={styles.trackTextWrap}>
                                <View style={styles.trackTitleRow}>
                                    <Text style={styles.trackTitle}>{track.title}</Text>
                                    <View style={styles.trackTag}>
                                        <Text style={styles.trackTagText}>{track.tag}</Text>
                                    </View>
                                </View>
                                <Text style={styles.trackBody}>{track.body}</Text>
                            </View>
                        </View>
                    </View>
                ))}

                <LinearGradient
                    colors={['#FFFFFF', '#ECF7F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.helpCard}
                >
                    <Text style={styles.helpTitle}>Need more help?</Text>
                    <Text style={styles.helpBody}>
                        Visit FAQ for common questions or open Community Guidelines for behavior standards and enforcement process.
                    </Text>
                    <View style={styles.ctaRow}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('FAQ')}>
                            <Text style={styles.secondaryBtnText}>Open FAQ</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('CommunityGuidelines')}>
                            <Text style={styles.primaryBtnText}>Guidelines</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
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
    content: { padding: 20, paddingBottom: 36 },
    hero: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 18
    },
    heroIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#E3FFFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4
    },
    heroBody: {
        color: 'rgba(255,255,255,0.92)',
        fontSize: 13,
        lineHeight: 18
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4B5563',
        marginBottom: 10,
        marginLeft: 2
    },
    trackCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5EDF4'
    },
    trackRow: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    trackIndex: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
        marginRight: 8
    },
    trackIndexText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#3B82F6'
    },
    trackIcon: {
        width: 30,
        height: 30,
        borderRadius: 10,
        backgroundColor: '#EAF8F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    trackTextWrap: {
        flex: 1
    },
    trackTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    trackTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1F2937'
    },
    trackTag: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 2
    },
    trackTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280'
    },
    trackBody: {
        fontSize: 13,
        color: '#5F6C80',
        lineHeight: 18
    },
    helpCard: {
        borderRadius: 16,
        padding: 14,
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#DCEDEA'
    },
    helpTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 4 },
    helpBody: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
    ctaRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: '#00A99D',
        borderRadius: 10,
        alignItems: 'center',
        paddingVertical: 10
    },
    primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
    secondaryBtn: {
        flex: 1,
        backgroundColor: '#E6F4F3',
        borderRadius: 10,
        alignItems: 'center',
        paddingVertical: 10
    },
    secondaryBtnText: { color: '#0E7C74', fontWeight: '700', fontSize: 13 }
});
