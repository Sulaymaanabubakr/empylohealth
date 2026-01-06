import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PROFILE_DATA } from '../data/mockData';
import { COLORS } from '../theme/theme';
import ConfirmationModal from '../components/ConfirmationModal';
import ProfilePhotoModal from '../components/ProfilePhotoModal';
import { useAuth } from '../context/AuthContext';
import { circleService } from '../services/api/circleService';

const PersonalProfileScreen = ({ navigation }) => {
    // Modal States
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('My circles');
    const [isLogoutVisible, setIsLogoutVisible] = useState(false);
    const [isEditPhotoVisible, setIsEditPhotoVisible] = useState(false);
    const [myCircles, setMyCircles] = useState([]);

    React.useEffect(() => {
        if (user?.uid) {
            const unsubscribe = circleService.subscribeToMyCircles(user.uid, (circles) => {
                setMyCircles(circles);
            });
            return () => unsubscribe();
        }
    }, [user]);

    // For other future confirmations like "Delete Account" or "Reset Notifications"
    // we can reuse the same modal or different states. For now implementing Logout.

    const handleLogout = () => {
        setIsLogoutVisible(false);
        // Navigate to SignIn or perform logout logic
        navigation.navigate('SignIn');
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: PROFILE_DATA.user.avatar }} style={styles.avatar} />
                </View>
                <Text style={styles.name}>{PROFILE_DATA.user.name}</Text>
                <Text style={styles.email}>{PROFILE_DATA.user.email}</Text>
                <Text style={[styles.roleBadge, { color: '#FFA000' }]}>
                    {PROFILE_DATA.user.role}
                </Text>
            </View>

            <TouchableOpacity style={styles.qrButton}>
                <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFA000" />
            </TouchableOpacity>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            {['My circles', 'Account'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderMyCircles = () => (
        <View style={styles.contentSection}>
            <TouchableOpacity
                style={styles.joinButton}
                onPress={() => navigation.navigate('CreateCircle')}
            >
                <Ionicons name="add" size={20} color="#FFA000" />
                <Text style={styles.joinButtonText}>Create new Circle</Text>
            </TouchableOpacity>

            {myCircles.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#757575', marginTop: 20 }}>
                    You haven't joined any circles yet.
                </Text>
            ) : (
                myCircles.map((circle) => (
                    <View key={circle.id} style={styles.circleCard}>
                        <View style={styles.circleHeader}>
                            <View>
                                <Text style={styles.circleTitle}>{circle.name}</Text>
                                <Text style={styles.circleSubtitle}>Category: {circle.category}</Text>
                                <Text style={styles.circleMembers}>Members: {circle.members?.length || 0}</Text>
                            </View>
                        </View>

                        {/* 
                           Visual timeline/avatars removed for now as we don't have member details synced 
                           in the circle object yet (fetching them would require more sub-queries).
                           Keeping it simple for Phase 2.
                        */}

                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => navigation.navigate('CircleDetail', { circle })}
                        >
                            <Text style={styles.viewButtonText}>View Circle</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </View>
    );

    const renderAccount = () => {
        const settings = [
            { icon: 'notifications-outline', label: 'Notifications', type: 'ionic' },
            { icon: 'person-outline', label: 'Personal Information', type: 'ionic' },
            { icon: 'lock-closed-outline', label: 'Security', type: 'ionic' },
            { icon: 'repeat', label: 'Subscription Plan', type: 'ionic' },
            { icon: 'help-circle-outline', label: 'My Circles FAQ', type: 'ionic' },
            { icon: 'heart-outline', label: 'Tell a friend', type: 'ionic' },
        ];

        return (
            <View style={styles.contentSection}>
                <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={() => setIsEditPhotoVisible(true)}
                >
                    <MaterialCommunityIcons name="image-edit-outline" size={24} color="#009688" />
                    <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                </TouchableOpacity>

                <View style={styles.settingsContainer}>
                    {settings.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.settingItem}
                            onPress={() => {
                                if (item.label === 'Subscription Plan') {
                                    navigation.navigate('Subscription');
                                } else if (item.label === 'Notifications') {
                                    navigation.navigate('NotificationsSettings');
                                } else if (item.label === 'Personal Information') {
                                    navigation.navigate('PersonalInformation');
                                } else if (item.label === 'Security') {
                                    navigation.navigate('Security');
                                } else if (item.label === 'Tell a friend') {
                                    navigation.navigate('TellAFriend');
                                } else if (item.label === 'My Circles FAQ') {
                                    navigation.navigate('FAQ');
                                }
                            }}
                        >
                            <View style={styles.settingLeft}>
                                <Ionicons name={item.icon} size={22} color="#FFA000" />
                                <Text style={styles.settingLabel}>{item.label}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#757575" />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => setIsLogoutVisible(true)}
                >
                    <MaterialCommunityIcons name="logout" size={24} color="#FF5252" />
                    <Text style={styles.logoutText}>Log out</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderHeader()}
                {renderTabs()}
                {activeTab === 'My circles' && renderMyCircles()}
                {activeTab === 'Account' && renderAccount()}
            </ScrollView>

            {/* Bottom Nav Placeholder */}
            {/* ... (Existing Bottom Nav code) ... */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
                        <Ionicons name="home-outline" size={24} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Explore')}>
                        <Feather name="compass" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Explore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ChatList')}>
                        <Ionicons name="chatbubble-outline" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <View style={[styles.activeNavIcon, { backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="person" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.navLabel, { color: COLORS.primary, fontWeight: '700' }]}>Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modals */}
            <ConfirmationModal
                visible={isLogoutVisible}
                message="Are you sure you want to Log out?"
                onConfirm={handleLogout}
                onCancel={() => setIsLogoutVisible(false)}
            />

            <ProfilePhotoModal
                visible={isEditPhotoVisible}
                onClose={() => setIsEditPhotoVisible(false)}
                currentImage={PROFILE_DATA.user.avatar}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
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
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
    },
    qrButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        borderRadius: 20,
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    avatarContainer: {
        marginBottom: 10,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    email: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 4,
    },
    roleBadge: {
        fontWeight: '600',
        fontSize: 12,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0',
        borderRadius: 25,
        marginHorizontal: 20,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#1A1A1A',
    },
    contentSection: {
        paddingHorizontal: 20,
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFF8E1',
    },
    joinButtonText: {
        color: '#FFA000',
        fontWeight: '600',
        marginLeft: 8,
    },
    circleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    circleHeader: {
        marginBottom: 16,
    },
    circleTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    circleSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    circleMembers: {
        fontSize: 12,
        color: '#757575',
    },
    timelineContainer: {
        height: 60,
        position: 'relative',
        justifyContent: 'center',
        marginBottom: 16,
    },
    timelineLine: {
        height: 8,
        width: '100%',
        position: 'absolute',
    },
    timelineAvatarWrapper: {
        position: 'absolute',
        alignItems: 'center',
        top: -12,
    },
    timelineAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FFF',
        marginBottom: 4,
    },
    memberName: {
        fontSize: 10,
        color: '#424242',
    },
    viewButton: {
        backgroundColor: '#009688',
        borderRadius: 20,
        paddingVertical: 10,
        alignItems: 'center',
        width: 120,
        alignSelf: 'center',
    },
    viewButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 24,
        backgroundColor: 'transparent',
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
    // Account Styles
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2F1',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    changePhotoText: {
        color: '#009688',
        fontWeight: '600',
        marginLeft: 12,
        fontSize: 14,
    },
    settingsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 24,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    settingLabel: {
        fontSize: 14,
        color: '#424242',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
    },
    logoutText: {
        color: '#F44336',
        fontWeight: '600',
        marginLeft: 12,
        fontSize: 14,
    },
});

export default PersonalProfileScreen;
