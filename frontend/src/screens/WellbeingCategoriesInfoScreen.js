import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const CATEGORIES = [
    {
        title: 'Thriving',
        body: 'You may feel connected to others, emotionally steady, and able to manage life’s challenges. Supportive relationships and a sense of belonging often help protect wellbeing and reduce feelings of loneliness here.'
    },
    {
        title: 'Steady',
        body: 'Things likely feel mostly stable. You’re staying connected and coping with everyday pressures, even if some days feel quieter or more tiring than others, which is a normal part of wellbeing.'
    },
    {
        title: 'Managing',
        body: 'You might be getting through things but with extra effort. Some people notice they pull back socially or feel less understood during this stage, so small moments of connection can make a real difference.'
    },
    {
        title: 'Low',
        body: 'Energy or mood may feel heavier right now, and loneliness can feel more noticeable. It’s common to feel more distant from others during stressful periods, even though support and gentle check-ins can help ease the weight.'
    },
    {
        title: 'Needs Support',
        body: 'You may be feeling overwhelmed or disconnected, and reaching out might feel difficult, but support from trusted people or professionals can be especially helpful at this point. You don’t have to handle everything alone.'
    }
];

export default function WellbeingCategoriesInfoScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Empylo Five Categories</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <LinearGradient
                    colors={['#0DAFA3', '#0C7B9B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    <Text style={styles.heroTitle}>What the Empylo Five Wellbeing Categories Mean</Text>
                    <Text style={styles.heroBody}>
                        These categories help explain how a wellbeing score range may feel in day-to-day life.
                    </Text>
                </LinearGradient>

                {CATEGORIES.map((item) => (
                    <View key={item.title} style={styles.card}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardBody}>{item.body}</Text>
                    </View>
                ))}
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
        borderRadius: 16,
        padding: 18,
        marginBottom: 14
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 6
    },
    heroBody: {
        fontSize: 13,
        lineHeight: 18,
        color: 'rgba(255,255,255,0.93)'
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5EDF4'
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 6
    },
    cardBody: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 20
    }
});
