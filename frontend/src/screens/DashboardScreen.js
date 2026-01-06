import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Image, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../theme/theme';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AssessmentModal from '../components/AssessmentModal';

const { width } = Dimensions.get('window');

const CircularProgress = ({ score, label }) => {
    const size = 120;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = score / 100;
    const strokeDashoffset = circumference - progress * circumference;

    return (
        <View style={styles.circularProgressContainer}>
            <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <Svg width={size} height={size}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#00E5FF" stopOpacity="1" />
                            <Stop offset="1" stopColor="#2979FF" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Circle
                        stroke="#E0F7FA" // Very light cyan track
                        fill="white"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeOpacity={1}
                    />
                    <Circle
                        stroke="url(#grad)" // Gradient stroke
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </Svg>
            </View>
            <View style={styles.scoreTextContainer}>
                <Text style={styles.scoreNumber}>{score}</Text>
                <Text style={styles.scoreLabel}>{label}</Text>
            </View>
        </View>
    );
};

const DashboardScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [showAssessment, setShowAssessment] = useState(false);

    useEffect(() => {
        checkDailyAssessment();
    }, []);

    const checkDailyAssessment = async () => {
        try {
            const lastDate = await AsyncStorage.getItem('lastAssessmentDate');
            const today = new Date().toDateString();

            if (lastDate !== today) {
                setTimeout(() => setShowAssessment(true), 1500);
            }
        } catch (error) {
            console.error('Error checking assessment date:', error);
        }
    };

    const handleTakeAssessment = async () => {
        try {
            const today = new Date().toDateString();
            await AsyncStorage.setItem('lastAssessmentDate', today);
            setShowAssessment(false);
            alert('Starting Assessment...');
        } catch (error) {
            console.error('Error saving assessment date:', error);
        }
    };

    const handleLater = () => {
        setShowAssessment(false);
    };

    const currentDate = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    const timelineData = [
        { name: 'Ade', status: 'red', position: 0.1 },
        { name: 'Mary', status: 'yellow', position: 0.25 },
        { name: 'Chioma', status: 'yellow', position: 0.5 },
        { name: 'Jane', status: 'green', position: 0.8 },
        { name: 'Mike', status: 'green', position: 0.95 },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <View style={styles.calendarIconContainer}>
                        <Ionicons name="calendar" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.dateText}>{currentDate}</Text>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Ionicons name="notifications" size={24} color="#333" />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
            >
                {/* User Greeting */}
                <View style={styles.greetingContainer}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80' }}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineBadge} />
                    </View>
                    <View style={styles.greetingText}>
                        <Text style={styles.greeting}>Hi, Jane!</Text>
                        <Text style={styles.subGreeting}>How're you feeling today?</Text>
                    </View>
                </View>

                {/* Wellbeing Score Card */}
                <View style={styles.wellbeingCard}>
                    <View style={styles.wellbeingContent}>
                        <Text style={styles.wellbeingTitle}>Wellbeing Score</Text>
                        <Text style={styles.wellbeingDescription}>
                            Your score is looking great! Keep up the good work.
                        </Text>
                        <TouchableOpacity style={styles.checkDetailsButton}>
                            <Text style={styles.checkDetailsText}>Check Details</Text>
                            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <CircularProgress score={79} label="Thriving" />
                </View>

                {/* Circles Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Circles</Text>
                    <TouchableOpacity style={styles.seeAllButton}>
                        <Text style={styles.seeAllText}>See All</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFA726" />
                    </TouchableOpacity>
                </View>

                <View style={styles.circleCard}>
                    <View style={styles.circleHeader}>
                        <View>
                            <Text style={styles.circleTitle}>Design Team</Text>
                            <Text style={styles.circleMembers}>5 Members • High Activity</Text>
                        </View>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreBadgeText}>57.5</Text>
                        </View>
                    </View>

                    <Text style={styles.circleLabel}>Visual Timeline</Text>

                    {/* Visual Timeline */}
                    <View style={styles.timelineContainer}>
                        <View style={styles.timelineLine}>
                            <ExpoLinearGradient
                                colors={['#FF5252', '#FFD740', '#69F0AE']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ flex: 1 }}
                            />
                        </View>

                        {timelineData.map((person, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.timelinePerson,
                                    { left: `${person.position * 100}%`, transform: [{ translateX: -18 }] }
                                ]}
                            >
                                <View style={[styles.avatarBorder, { borderColor: person.status === 'red' ? '#FF5252' : person.status === 'yellow' ? '#FFD740' : '#69F0AE' }]}>
                                    <Image
                                        source={{ uri: `https://i.pravatar.cc/150?u=${person.name}` }}
                                        style={styles.timelineAvatar}
                                    />
                                </View>
                                <Text style={styles.timelineName}>{person.name}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.viewCircleButton}>
                        <Text style={styles.viewCircleButtonText}>View Circle Analysis</Text>
                    </TouchableOpacity>
                </View>

                {/* Key Challenges */}
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Key Challenges</Text>

                <View style={styles.challengeRow}>
                    <View style={[styles.challengeCard, { marginRight: 10, flex: 1 }]}>
                        <View style={[styles.challengeIcon, { backgroundColor: '#FFF3E0' }]}>
                            <MaterialCommunityIcons name="weather-night" size={28} color="#FF9800" />
                        </View>
                        <Text style={styles.challengeTitle}>Sleep</Text>
                        <Text style={styles.challengeLevel}>Quality: Low</Text>
                    </View>

                    <View style={[styles.challengeCard, { marginLeft: 10, flex: 1 }]}>
                        <View style={[styles.challengeIcon, { backgroundColor: '#E1F5FE' }]}>
                            <MaterialCommunityIcons name="emoticon-happy-outline" size={28} color="#039BE5" />
                        </View>
                        <Text style={styles.challengeTitle}>Mood</Text>
                        <Text style={styles.challengeLevel}>Level: Low</Text>
                    </View>
                </View>

                <View style={[styles.challengeCard, { marginBottom: 30, flexDirection: 'row', alignItems: 'center', paddingVertical: 15, justifyContent: 'center' }]}>
                    <View style={[styles.challengeIcon, { backgroundColor: '#F3E5F5', marginRight: 15, marginBottom: 0 }]}>
                        <MaterialCommunityIcons name="head-outline" size={28} color="#8E24AA" />
                    </View>
                    <View>
                        <Text style={[styles.challengeTitle, { textAlign: 'left', marginBottom: 0 }]}>Stress Level</Text>
                        <Text style={[styles.challengeLevel, { textAlign: 'left' }]}>Currently Low</Text>
                    </View>
                </View>

            </ScrollView>

            <AssessmentModal
                visible={showAssessment}
                onClose={handleLater}
                onTakeNow={handleTakeAssessment}
            />

            {/* Bottom Navigation */}
            <View style={[styles.bottomNavContainer, { paddingBottom: insets.bottom }]}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem}>
                        <View style={[styles.activeNavIcon, { backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="home" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.navLabel, { color: COLORS.primary, fontWeight: '700' }]}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Explore')}>
                        <Feather name="compass" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Explore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ChatList')}>
                        <Ionicons name="chatbubble-outline" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-outline" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFCFC',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 0,
        marginTop: -24, // Increased negative margin greatly
        paddingBottom: SPACING.md,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    calendarIconContainer: {
        marginRight: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#424242',
        fontWeight: '600',
    },
    notificationButton: {
        position: 'relative',
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 50,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF5252',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 110,
        paddingTop: 10,
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: SPACING.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00E676',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    greetingText: {
        flex: 1,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: '#212121',
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 16,
        color: '#757575',
        fontWeight: '500',
    },
    wellbeingCard: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: "#FFAB40", // Orange shadow
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, // Stronger opacity
        shadowRadius: 20, // Softer dispersion
        elevation: 15,
        borderWidth: 1,
        borderColor: '#FFF8E1',
    },
    wellbeingContent: {
        flex: 1,
        paddingRight: SPACING.md,
    },
    wellbeingTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        color: '#212121',
    },
    wellbeingDescription: {
        fontSize: 14,
        color: '#616161',
        lineHeight: 20,
        marginBottom: 12,
    },
    checkDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2F1',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    checkDetailsText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
        marginRight: 4,
    },
    circularProgressContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 120,
        height: 120,
    },
    scoreTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreNumber: {
        fontSize: 40,
        fontWeight: '900',
        color: '#212121',
    },
    scoreLabel: {
        fontSize: 13,
        color: '#757575',
        marginTop: 0,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#212121',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 16,
        color: '#FFA726',
        fontWeight: '700',
        marginRight: 2,
    },
    circleCard: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 24,
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
    circleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    circleTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
        color: '#212121',
    },
    circleMembers: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
    },
    scoreBadge: {
        backgroundColor: '#E8F5E9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    scoreBadgeText: {
        color: '#2E7D32',
        fontWeight: '800',
        fontSize: 16,
    },
    circleLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        color: '#9E9E9E',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    timelineContainer: {
        height: 80,
        justifyContent: 'center',
        marginBottom: 24,
        width: '100%',
        position: 'relative',
        marginTop: 10,
    },
    timelineLine: {
        height: 14, // Thicker line
        borderRadius: 7,
        overflow: 'hidden',
        width: '100%',
        position: 'absolute',
        top: 13, // Vertically centered with avatars
    },
    timelinePerson: {
        position: 'absolute',
        alignItems: 'center',
        top: 0,
        width: 40,
    },
    avatarBorder: {
        borderWidth: 2,
        borderRadius: 20,
        padding: 2,
        backgroundColor: '#FFF',
        marginBottom: 6,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    timelineAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    timelineName: {
        fontSize: 12,
        color: '#616161',
        fontWeight: '700',
        width: 60,
        textAlign: 'center',
    },
    viewCircleButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    viewCircleButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    challengeRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    challengeCard: {
        backgroundColor: '#FFF',
        borderRadius: 28,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#FAFAFA',
        alignItems: 'center', // Center content horizontally
    },
    challengeIcon: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    challengeTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#212121',
        marginBottom: 4,
        textAlign: 'center', // Center text
    },
    challengeLevel: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
        textAlign: 'center', // Center text
    },
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: 'transparent',
        zIndex: 100, // Ensure it sits on top of ScrollView
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderRadius: 32,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
        justifyContent: 'space-around',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    activeNavIcon: {
        padding: 10,
        borderRadius: 20,
        marginBottom: 4,
    },
    navLabel: {
        fontSize: 11,
        color: '#BDBDBD',
        fontWeight: '600',
    },
});

export default DashboardScreen;
