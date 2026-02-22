import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';
import ConfirmationModal from '../components/ConfirmationModal';
import ProfilePhotoModal from '../components/ProfilePhotoModal';
import Avatar from '../components/Avatar';
import ImageCropper from '../components/ImageCropper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { circleService } from '../services/api/circleService';
import { authService } from '../services/auth/authService';
import { userService } from '../services/api/userService';
import { mediaService } from '../services/api/mediaService';
import { useModal } from '../context/ModalContext';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { getWellbeingRingColor } from '../utils/wellbeing';


const PersonalProfileScreen = ({ navigation }) => {
    // Modal States
    // Modal States
    const { user, userData } = useAuth();
    const { showToast } = useToast();
    const { showModal } = useModal();
    const [activeTab, setActiveTab] = useState('My circles');
    const [isLogoutVisible, setIsLogoutVisible] = useState(false);
    const [isEditPhotoVisible, setIsEditPhotoVisible] = useState(false);
    const [myCircles, setMyCircles] = useState([]);
    const [memberProfiles, setMemberProfiles] = useState({});
    const [uploading, setUploading] = useState(false);

    // Cropper State
    const [cropperVisible, setCropperVisible] = useState(false);
    const [tempImage, setTempImage] = useState(null);

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = circleService.subscribeToMyCircles(user.uid, (circles) => {
                setMyCircles(circles);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const calculateCircleRating = (circle) => {
        if (!circle) return '0.0';
        if (circle.score) return Number(circle.score).toFixed(1);
        let score = 4.2;
        const memberCount = circle.members?.length || 0;
        if (memberCount > 50) score += 0.4;
        else if (memberCount > 20) score += 0.3;
        const lastUpdate = circle.updatedAt?.toMillis?.() || circle.lastMessageAt?.toMillis?.() || 0;
        if (lastUpdate > 0) {
            const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
            if (hoursSinceUpdate < 24) score += 0.4;
        }
        return Math.min(score, 5.0).toFixed(1);
    };

    const getCircleMemberFirstName = (name = '') => {
        const parts = String(name || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        return parts.length > 0 ? parts[0] : 'Member';
    };
    const getMemberRingColor = (profile) => {
        return getWellbeingRingColor({
            wellbeingScore: profile?.wellbeingScore,
            wellbeingLabel: profile?.wellbeingLabel,
            wellbeingStatus: profile?.wellbeingStatus
        }) || '#D1D5DB';
    };

    const getProfileForMember = (memberId) => {
        if (!memberId) return null;
        if (memberId === user?.uid) {
            return {
                ...(memberProfiles[memberId] || {}),
                name: userData?.name || user?.displayName || memberProfiles[memberId]?.name || 'You',
                photoURL: userData?.photoURL || user?.photoURL || memberProfiles[memberId]?.photoURL || '',
                wellbeingScore: userData?.wellbeingScore ?? memberProfiles[memberId]?.wellbeingScore ?? null,
                wellbeingLabel: userData?.wellbeingLabel || userData?.wellbeingStatus || memberProfiles[memberId]?.wellbeingLabel || memberProfiles[memberId]?.wellbeingStatus || ''
            };
        }
        return memberProfiles[memberId] || null;
    };

    useEffect(() => {
        const loadMemberProfiles = async () => {
            const allMemberIds = [...new Set(
                (myCircles || [])
                    .flatMap((circle) => (Array.isArray(circle?.members) ? circle.members : []))
                    .filter(Boolean)
            )];
            if (!allMemberIds.length) {
                setMemberProfiles({});
                return;
            }
            const docs = {};
            await Promise.all(
                allMemberIds.slice(0, 80).map(async (memberId) => {
                    try {
                        const snap = await getDoc(doc(db, 'users', memberId));
                        if (snap.exists()) docs[memberId] = snap.data() || {};
                    } catch {
                        // ignore partial profile failures
                    }
                })
            );
            setMemberProfiles(docs);
        };
        loadMemberProfiles();
    }, [myCircles, user?.uid, userData?.wellbeingScore, userData?.wellbeingLabel, userData?.wellbeingStatus, userData?.photoURL, userData?.name, user?.photoURL, user?.displayName]);

    // For other future confirmations like "Delete Account" or "Reset Notifications"
    // we can reuse the same modal or different states. For now implementing Logout.

    const handleLogout = async () => {
        setIsLogoutVisible(false);
        try {
            await authService.logout();
            // Navigation is handled automatically by Navigation.js when user becomes null
        } catch (error) {
            console.error('Failed to sign out', error);
        }
    };

    const handleChoosePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showModal({ type: 'error', title: 'Permission Required', message: 'Please grant photo library access to upload a profile picture.' });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // Use custom cropper
                quality: 1,
            });

            if (!result.canceled && result.assets[0]?.uri) {
                setIsEditPhotoVisible(false);
                setTempImage(result.assets[0].uri);
                setTimeout(() => setCropperVisible(true), 500); // Small delay to allow modal to close smoothly
            }
        } catch (error) {
            console.error('Photo selection error:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to select photo.' });
        }
    };

    const handleTakePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showModal({ type: 'error', title: 'Permission Required', message: 'Please grant camera access to take a profile picture.' });
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets[0]?.uri) {
                setIsEditPhotoVisible(false);
                setTempImage(result.assets[0].uri);
                setTimeout(() => setCropperVisible(true), 500);
            }
        } catch (error) {
            console.error('Camera error:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to take photo.' });
        }
    };

    const handleDeletePhoto = async () => {
        try {
            setUploading(true);
            setIsEditPhotoVisible(false);
            await userService.updateUserDocument(user.uid, { photoURL: '' });
            setUploading(false);
            showModal({ type: 'success', title: 'Success', message: 'Profile photo removed.' });
        } catch (error) {
            setUploading(false);
            console.error('Delete photo error:', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to delete photo.' });
        }
    };

    const handleUseAvatar = () => {
        setIsEditPhotoVisible(false);
        showModal({ type: 'info', title: 'Avatar', message: 'Avatar functionality coming soon!' });
    };

    const safeAvatar = userData?.photoURL || user?.photoURL || '';
    const displayName = userData?.name || user?.displayName || 'User';
    const displayEmail = userData?.email || user?.email || '';
    const displayRole = userData?.role || 'personal';

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')}
                style={styles.backButton}
            >
                <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                    <Avatar
                        uri={safeAvatar || ''}
                        name={displayName}
                        size={80}
                        showWellbeingRing
                        wellbeingScore={userData?.wellbeingScore}
                        wellbeingLabel={userData?.wellbeingLabel || userData?.wellbeingStatus}
                    />
                </View>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{displayEmail}</Text>
            </View>

            <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate('TellAFriend')}>
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
                <View style={styles.circleCard}>
                    <Text style={{ textAlign: 'center', color: '#757575', padding: 20 }}>
                        You haven't joined any circles yet.
                        {'\n'}Go to Explore to find one!
                    </Text>
                </View>
            ) : (
                myCircles.map((circle) => (
                    <TouchableOpacity
                        key={circle.id}
                        style={styles.circleCard}
                        disabled={true}
                    >
                        <View style={styles.circleHeader}>
                            <View>
                                <Text style={styles.circleTitle}>{circle.name}</Text>
                                <Text style={styles.circleMembers}>{circle.members?.length || 0} Members • High Activity</Text>
                            </View>
                            <View style={styles.scoreBadge}>
                                <Ionicons name="star" size={12} color="#00C853" style={{ marginRight: 4 }} />
                                <Text style={styles.scoreBadgeText}>{calculateCircleRating(circle)}</Text>
                            </View>
                        </View>

                        {circle.members && circle.members.length > 0 && Object.keys(memberProfiles).length > 0 ? (
                            <View style={styles.memberStackContainer}>
                                <View style={styles.avatarStack}>
                                    {circle.members.slice(0, 5).map((memberId, index) => {
                                        const profile = getProfileForMember(memberId);
                                        if (!profile) return null;

                                        return (
                                            <View
                                                key={`${circle.id}_${memberId}`}
                                                style={[
                                                    styles.memberAvatarWithInitial,
                                                    {
                                                        zIndex: 10 - index,
                                                        marginLeft: index === 0 ? 0 : -8,
                                                    }
                                                ]}
                                            >
                                                <View
                                                    style={[
                                                        styles.memberAvatarContainer,
                                                        { borderColor: getMemberRingColor(profile) }
                                                    ]}
                                                >
                                                    <Avatar
                                                        uri={profile.photoURL}
                                                        name={profile.name}
                                                        size={40}
                                                    />
                                                </View>
                                                <Text
                                                    style={styles.memberInitialText}
                                                    numberOfLines={2}
                                                    adjustsFontSizeToFit
                                                    minimumFontScale={0.72}
                                                >
                                                    {getCircleMemberFirstName(profile.name)}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                    {circle.members.length > 5 && (
                                        <View style={[styles.moreMembersBadge, { zIndex: 0, marginLeft: -18 }]}>
                                            <Text style={styles.moreMembersText}>+{circle.members.length - 5}</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.stackInfoContainer}>
                                    <Text style={styles.stackInfoText}>
                                        <Text style={styles.highlightText}>{circle.members.length} members</Text> are active
                                    </Text>
                                    <View style={styles.activeIndicator} />
                                </View>
                            </View>
                        ) : (
                            <Text style={styles.timelineEmptyText}>
                                Join the conversation with your circle members.
                            </Text>
                        )}

                        <TouchableOpacity
                            style={styles.viewCircleButton}
                            onPress={() => navigation.navigate('CircleAnalysis', { circle })}
                        >
                            <Text style={styles.viewCircleButtonText}>View Circle Analysis</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))
            )}

        </View>
    );

    const renderAccount = () => {
        const settings = [
            { icon: 'notifications-outline', label: 'Notifications', type: 'ionic' },
            { icon: 'person-outline', label: 'Personal Information', type: 'ionic' },
            { icon: 'lock-closed-outline', label: 'Security', type: 'ionic' },
            { icon: 'information-circle-outline', label: 'About Circles Health App', type: 'ionic' },
            { icon: 'school-outline', label: 'Community Education', type: 'ionic' },
            { icon: 'shield-checkmark-outline', label: 'Community Guidelines', type: 'ionic' },
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
                                if (item.label === 'Notifications') {
                                    navigation.navigate('NotificationsSettings');
                                } else if (item.label === 'Personal Information') {
                                    navigation.navigate('PersonalInformation');
                                } else if (item.label === 'Security') {
                                    navigation.navigate('Security');
                                } else if (item.label === 'About Circles Health App') {
                                    navigation.navigate('AboutCircles');
                                } else if (item.label === 'Community Education') {
                                    navigation.navigate('CommunityEducation');
                                } else if (item.label === 'Community Guidelines') {
                                    navigation.navigate('CommunityGuidelines');
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



            {/* Modals */}
            <ImageCropper
                visible={cropperVisible}
                imageUri={tempImage}
                onClose={() => setCropperVisible(false)}
                onCrop={async (uri, cropData) => {
                    setCropperVisible(false);
                    setUploading(true);
                    try {
                        // Upload
                        const uploadedUrl = await mediaService.uploadAsset(uri, 'avatars');
                        // Optimization
                        const optimizedUrl = uploadedUrl.replace('/upload/', '/upload/c_thumb,g_face,w_400,h_400,z_0.7/');

                        // Update User
                        await userService.updateUserDocument(user.uid, { photoURL: optimizedUrl });
                        showModal({ type: 'success', title: 'Success', message: 'Profile photo updated!' });
                    } catch (error) {
                        console.error("Upload failed", error);
                        showModal({ type: 'error', title: 'Error', message: 'Failed to update profile photo.' });
                    } finally {
                        setUploading(false);
                    }
                }}
            />

            <ConfirmationModal
                visible={isLogoutVisible}
                message="Are you sure you want to Log out?"
                onConfirm={handleLogout}
                onCancel={() => setIsLogoutVisible(false)}
            />

            <ProfilePhotoModal
                visible={isEditPhotoVisible}
                onClose={() => setIsEditPhotoVisible(false)}
                currentImage={safeAvatar}
                onUseAvatar={handleUseAvatar}
                onTakePhoto={handleTakePhoto}
                onChoosePhoto={handleChoosePhoto}
                onDeletePhoto={handleDeletePhoto}
            />

            {uploading && (
                <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
            )}
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
        borderRadius: 28,
        padding: 24,
        marginBottom: 20,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        borderWidth: 1,
        borderColor: '#FAFAFA',
    },
    circleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
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
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    scoreBadgeText: {
        color: '#2E7D32',
        fontWeight: '800',
        fontSize: 14,
    },
    memberStackContainer: {
        marginBottom: 20,
        marginTop: 12,
        alignItems: 'center',
        width: '100%',
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    memberAvatarWithInitial: {
        width: 56,
        alignItems: 'center',
    },
    memberAvatarContainer: {
        width: 48,
        height: 48,
        borderWidth: 3,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    memberInitialText: {
        marginTop: 4,
        width: 56,
        fontSize: 9,
        lineHeight: 11,
        color: '#616161',
        fontWeight: '700',
        textAlign: 'center',
    },
    moreMembersBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    moreMembersText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#757575',
    },
    stackInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stackInfoText: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
        marginRight: 6,
    },
    highlightText: {
        color: '#212121',
        fontWeight: '700',
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00E676',
    },
    timelineEmptyText: {
        fontSize: 13,
        color: '#9E9E9E',
        fontWeight: '500',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    viewCircleButton: {
        backgroundColor: COLORS.primary,
        alignSelf: 'center',
        width: '100%',
        borderRadius: 20,
        paddingVertical: 12,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 4,
    },
    viewCircleButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
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
    // Grid Styles
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    gridCard: {
        width: '48%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    cardImageContainer: {
        height: 100,
        backgroundColor: '#F0F0F0',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardPlaceholder: {
        width: '100%',
        height: '100%',
    },
    cardTypeBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cardTypeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    cardContent: {
        padding: 12,
    },
    gridTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    gridSubtitle: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 8,
    },
    gridFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gridMembers: {
        fontSize: 11,
        color: '#9E9E9E',
        marginLeft: 4,
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
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    uploadingText: {
        color: '#FFF',
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PersonalProfileScreen;
