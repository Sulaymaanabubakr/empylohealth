import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import QRCode from 'react-native-qrcode-svg';
import { buildInviteLink, buildInviteShareText } from '../utils/deepLinks';
import * as Clipboard from 'expo-clipboard';

const TellAFriendScreen = ({ navigation }) => {
    const { user, userData } = useAuth();
    const { showToast } = useToast();
    const avatarUri = userData?.photoURL || user?.photoURL || '';
    const inviteLink = buildInviteLink(user?.uid || '');

    const handleShare = async () => {
        try {
            await Share.share({
                message: buildInviteShareText(user?.uid || ''),
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleCopyLink = async () => {
        try {
            await Clipboard.setStringAsync(inviteLink);
            showToast('Invite link copied', 'success');
        } catch (error) {
            showToast('Could not copy link right now', 'error');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tell a friend</Text>
                <View style={{ width: 40 }} />
            </SafeAreaView>

            <View style={styles.content}>

                {/* QR Card */}
                <View style={styles.qrCard}>
                    <View style={styles.avatarContainer}>
                        <Avatar
                            uri={avatarUri || ''}
                            name={userData?.name || user?.displayName || 'User'}
                            size={60}
                            showWellbeingRing
                            wellbeingScore={userData?.wellbeingScore}
                            wellbeingLabel={userData?.wellbeingLabel || userData?.wellbeingStatus}
                        />
                    </View>

                    <View style={styles.qrPlaceholder}>
                        <QRCode
                            value={inviteLink}
                            size={170}
                            color="#0F172A"
                            backgroundColor="#FFFFFF"
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <Text style={styles.actionButtonText}>Share QR Code</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.outlineButton} onPress={handleShare}>
                    <Ionicons name="share-outline" size={20} color="#009688" style={{ marginRight: 8 }} />
                    <Text style={styles.outlineButtonText}>Share Invite Link</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.outlineButton} onPress={handleCopyLink}>
                    <Ionicons name="copy-outline" size={20} color="#009688" style={{ marginRight: 8 }} />
                    <Text style={styles.outlineButtonText}>Copy Invite Link</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0F2F1', // Light teal background as per design
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        opacity: 0, // Hidden in design, centered title usually
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    qrCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        width: '80%',
        aspectRatio: 0.8,
        justifyContent: 'center',
        marginBottom: 40,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        position: 'relative',
    },
    avatarContainer: {
        position: 'absolute',
        top: -30,
        alignSelf: 'center',
        padding: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 40,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    qrPlaceholder: {
        marginTop: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButton: {
        backgroundColor: '#4DB6AC',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 24,
        width: '70%',
        alignItems: 'center',
        marginBottom: 24,
        elevation: 2,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    outlineButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 24,
        width: '100%',
        justifyContent: 'center',
        marginBottom: 16,
        elevation: 1,
    },
    outlineButtonText: {
        color: '#009688',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default TellAFriendScreen;
