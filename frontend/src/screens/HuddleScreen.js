import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';
import { HUDDLE_PARTICIPANTS } from '../data/mockData';

const HuddleScreen = ({ navigation, route }) => {
    // Fallback to avoid crashes if params missing, though they should be there
    const { chat } = route.params || { chat: { name: 'Chat', isGroup: false, avatar: 'https://via.placeholder.com/150' } };
    const insets = useSafeAreaInsets();
    const [seconds, setSeconds] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(true);
    const [isHandRaised, setIsHandRaised] = useState(false);

    const isGroup = chat.isGroup;

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#D0F0EE" />

            <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                <View style={[styles.header, !isGroup && styles.headerCentered]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
                    </TouchableOpacity>

                    {/* Encryption Status */}
                    <View style={styles.encryptionContainer}>
                        <Feather name="lock" size={12} color="#009688" />
                        <Text style={styles.encryptionText}>End-to-end Encrypted</Text>
                    </View>

                    {/* Group Mode: Name and Timer in Header is typical, but let's check screenshot matches.
                        Screenshot 1 (Group): Header center has "Circle 1" and "2:30".
                        Screenshot 2 (1-on-1): Header ONLY has encryption. Avatar/Name/Timer are in body.
                    */}
                    {isGroup && (
                        <View style={styles.groupHeaderInfo}>
                            <Text style={styles.chatNameSmall}>{chat.name}</Text>
                            <Text style={styles.timerSmall}>{formatTime(seconds)}</Text>
                        </View>
                    )}

                    <View style={{ width: 28 }} />
                </View>
            </SafeAreaView>

            <View style={styles.contentContainer}>
                {isGroup ? (
                    /* Group Layout: Scattered Avatars */
                    <View style={styles.participantsContainer}>
                        {/* We use the HUDDLE_PARTICIPANTS mock for the group feel */}
                        <View style={[styles.avatarWrapper, { top: '18%', alignSelf: 'center' }]}>
                            <Image source={{ uri: HUDDLE_PARTICIPANTS[0].image }} style={styles.avatar} />
                        </View>
                        <View style={[styles.avatarWrapper, { top: '36%', left: '18%' }]}>
                            <Image source={{ uri: HUDDLE_PARTICIPANTS[1].image }} style={styles.avatar} />
                        </View>
                        <View style={[styles.avatarWrapper, { top: '36%', right: '18%' }]}>
                            <Image source={{ uri: HUDDLE_PARTICIPANTS[2].image }} style={styles.avatar} />
                        </View>
                        <View style={[styles.avatarWrapper, { top: '54%', left: '26%' }]}>
                            <Image source={{ uri: HUDDLE_PARTICIPANTS[3].image }} style={styles.avatar} />
                        </View>
                        <View style={[styles.avatarWrapper, { top: '54%', right: '26%' }]}>
                            <Image source={{ uri: HUDDLE_PARTICIPANTS[4].image }} style={styles.avatar} />
                        </View>
                    </View>
                ) : (
                    /* 1-on-1 Layout: Centered Single Avatar */
                    <View style={styles.singleParticipantContainer}>
                        <View style={styles.largeAvatarWrapper}>
                            <Image source={{ uri: chat.avatar }} style={styles.largeAvatar} />
                        </View>
                        <Text style={styles.singleName}>{chat.name}</Text>
                        <Text style={styles.singleTimer}>{formatTime(seconds)}</Text>
                    </View>
                )}
            </View>

            {/* Controls */}
            <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 40 }]}>
                <TouchableOpacity
                    style={[styles.controlButton, isMuted && styles.controlButtonActive]}
                    onPress={() => setIsMuted(!isMuted)}
                >
                    <Feather name={isMuted ? "mic-off" : "mic"} size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isSpeaker && styles.controlButtonActive]}
                    onPress={() => setIsSpeaker(!isSpeaker)}
                >
                    <Ionicons name={isSpeaker ? "volume-high" : "volume-mute"} size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, isHandRaised && styles.controlButtonActive]}
                    onPress={() => setIsHandRaised(!isHandRaised)}
                >
                    <Ionicons name="hand-right-outline" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.endCallButton]}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="call-end" size={32} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D0F0EE',
    },
    headerSafeArea: {
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        height: 60,
    },
    headerCentered: {
        // For 1-on-1, content is differently aligned
    },
    backButton: {
        padding: 4,
    },
    encryptionContainer: {
        position: 'absolute',
        top: 14,
        left: 0,
        right: 0,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        pointerEvents: 'none', // pass through touches implies it's just a label
    },
    encryptionText: {
        fontSize: 12,
        color: '#009688',
        marginLeft: 4,
        fontWeight: '500',
    },
    groupHeaderInfo: {
        alignItems: 'center',
        marginTop: 24, // Push down below encryption
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        pointerEvents: 'none',
    },
    chatNameSmall: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    timerSmall: {
        fontSize: 16,
        color: '#424242',
        fontWeight: '400',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    participantsContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    avatarWrapper: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    // 1-on-1 Styles
    singleParticipantContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 80, // Offset to be slightly above center or room for controls
    },
    largeAvatarWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        marginBottom: 24,
        // No border in screenshot? Or subtle? Let's verify.
        // Screenshot "1 on 1 call" has no visible heavy border, maybe standard.
    },
    largeAvatar: {
        width: '100%',
        height: '100%',
    },
    singleName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    singleTimer: {
        fontSize: 20,
        color: '#424242',
        fontWeight: '400', // Light/Regular
    },
    // Controls
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24, // Wider gap
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    controlButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(100, 216, 203, 0.4)', // Frosted Teal look
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)', // Helps on web, ignored on RN usually without BlurView
    },
    controlButtonActive: {
        backgroundColor: '#009688', // Solid teal
    },
    endCallButton: {
        backgroundColor: '#FF5252', // Red
    },
});

export default HuddleScreen;
