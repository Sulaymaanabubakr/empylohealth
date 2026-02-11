import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Keyboard, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { chatService } from '../services/api/chatService';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import Avatar from '../components/Avatar';

const ChatDetailScreen = ({ navigation, route }) => {
    const chat = route?.params?.chat;
    const { user, userData } = useAuth();
    const { showModal } = useModal();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);
    const insets = useSafeAreaInsets();
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [profileCache, setProfileCache] = useState({});
    const [circleRole, setCircleRole] = useState(null);
    const [activeHuddle, setActiveHuddle] = useState(null);

    // Keyboard Visibility management for bottom insets
    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const hideSubscription = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    if (!chat) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName}>Chat</Text>
                        <Text style={styles.headerStatus}>Unavailable</Text>
                    </View>
                </View>
                <View style={{ padding: 20 }}>
                    <Text>Chat details are unavailable.</Text>
                </View>
            </View>
        );
    }

    // Subscribe to messages
    useEffect(() => {
        if (chat.id) {
            const unsubscribe = chatService.subscribeToMessages(chat.id, (msgs) => {
                // Map backend format to UI format if needed, but service already does some cleanup
                const formatted = msgs.map(m => ({
                    id: m._id,
                    text: m.text,
                    time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: m.user._id === user?.uid,
                    ...m
                })).reverse(); // Reverse for FlatList if standard top-down or bottom-up
                // Actually, chatService desc, so newest first. 
                // If displaying standard list, might want reverse order. 
                // Simple reverse here to show oldest at top for basic list.
                setMessages(formatted);
            });
            return () => unsubscribe();
        }
    }, [chat.id, user]);

    useEffect(() => {
        if (!chat?.isGroup || !chat?.circleId || !user?.uid) {
            setCircleRole(null);
            setActiveHuddle(null);
            return undefined;
        }

        const unsubCircle = onSnapshot(doc(db, 'circles', chat.circleId), (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setActiveHuddle(data?.activeHuddle || null);
        });

        const unsubMember = onSnapshot(doc(db, 'circles', chat.circleId, 'members', user.uid), (snap) => {
            if (!snap.exists()) {
                setCircleRole(null);
                return;
            }
            const data = snap.data();
            setCircleRole(data?.role || null);
        });

        return () => {
            unsubCircle();
            unsubMember();
        };
    }, [chat?.circleId, chat?.isGroup, user?.uid]);

    const getOtherParticipantId = () => {
        if (!Array.isArray(chat?.participants) || !user?.uid) return null;
        return chat.participants.find((id) => id !== user.uid) || null;
    };

    const getUserProfile = async (uid) => {
        if (!uid) return null;
        if (profileCache[uid]) return profileCache[uid];

        if (uid === user?.uid) {
            const localProfile = {
                uid,
                name: userData?.name || user?.displayName || 'You',
                photoURL: userData?.photoURL || user?.photoURL || '',
                role: 'You',
                about: 'This is you'
            };
            setProfileCache((prev) => ({ ...prev, [uid]: localProfile }));
            return localProfile;
        }

        try {
            const snap = await getDoc(doc(db, 'users', uid));
            const data = snap.exists() ? snap.data() : {};
            const profile = {
                uid,
                name: data?.name || data?.displayName || 'Member',
                photoURL: data?.photoURL || '',
                role: chat?.isGroup ? 'Circle member' : 'Contact',
                about: data?.bio || data?.about || 'Hey there! I am using Empylo.'
            };
            setProfileCache((prev) => ({ ...prev, [uid]: profile }));
            return profile;
        } catch (error) {
            console.error('Failed to load user profile', error);
            return {
                uid,
                name: 'Member',
                photoURL: '',
                role: chat?.isGroup ? 'Circle member' : 'Contact',
                about: 'Profile unavailable'
            };
        }
    };

    const openProfileModal = async (uid) => {
        const profile = await getUserProfile(uid);
        if (!profile) return;
        setSelectedProfile(profile);
        setProfileModalVisible(true);
    };

    useEffect(() => {
        const senderIds = [...new Set(messages.map((m) => m?.user?._id).filter(Boolean))];
        senderIds.forEach((uid) => {
            if (!profileCache[uid]) {
                getUserProfile(uid).catch(() => { });
            }
        });
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const textToSend = inputText;
        setInputText(''); // Clear UI immediately

        try {
            await chatService.sendMessage(chat.id, textToSend);
            // Scroll to bottom
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        } catch (error) {
            console.error("Failed to send", error);
            // Optionally restore text or show error
        }
    };

    const hasActiveHuddle = Boolean(activeHuddle?.isActive !== false && activeHuddle?.roomUrl);
    const canStartHuddleInCircle = ['creator', 'admin', 'moderator'].includes(circleRole);
    const canShowCallButton = !chat?.isGroup || hasActiveHuddle || canStartHuddleInCircle;

    const handleCall = async () => {
        if (chat?.isGroup) {
            if (hasActiveHuddle) {
                navigation.navigate('Huddle', {
                    chat,
                    huddleId: activeHuddle?.huddleId,
                    mode: 'join',
                    callTapTs: Date.now()
                });
                return;
            }

            if (!canStartHuddleInCircle) {
                return;
            }
        }

        navigation.navigate('Huddle', {
            chat,
            mode: 'start',
            callTapTs: Date.now()
        });
    };

    const handleMessageLongPress = (message) => {
        if (!chat.circleId) return; // Only allow reporting in circles context for now

        showModal({
            type: 'confirmation',
            title: 'Report Message',
            message: 'Does this message violate community guidelines?',
            confirmText: 'Report',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    const { circleService } = require('../services/api/circleService');
                    await circleService.submitReport(
                        chat.circleId,
                        message.id,
                        'message',
                        'Inappropriate Content',
                        message.text
                    );
                    setTimeout(() => {
                        showModal({ type: 'success', title: 'Report Sent', message: "Exellence. Start packing, we've initiated a review." });
                    }, 500);
                } catch (error) {
                    setTimeout(() => {
                        showModal({ type: 'error', title: 'Error', message: 'Could not submit report.' });
                    }, 500);
                }
            }
        });
    };

    const renderMessage = ({ item }) => {
        const isMe = item.isMe;
        const senderId = item?.user?._id;
        const senderProfile = senderId ? profileCache[senderId] : null;
        const senderName = isMe
            ? 'You'
            : (senderProfile?.name || (chat?.isGroup ? 'Member' : chat?.name));
        const senderAvatar = isMe
            ? (userData?.photoURL || user?.photoURL || '')
            : (senderProfile?.photoURL || (chat?.isGroup ? '' : (chat.avatar || chat.photoURL || chat.image)));
        // Design: Incoming (Left) = Teal, Outgoing (Right) = Light
        return (
            <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                {!isMe && (
                    <TouchableOpacity onPress={() => openProfileModal(senderId)} activeOpacity={0.8} style={styles.avatarTap}>
                        <Avatar uri={senderAvatar} name={senderName} size={32} />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onLongPress={() => !isMe && handleMessageLongPress(item)}
                    activeOpacity={0.9} // Slight feedback but keep bubble look
                    style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
                >
                    {!isMe && chat?.isGroup && (
                        <Text style={styles.senderNameText}>{senderName}</Text>
                    )}
                    <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
                        {item.text}
                    </Text>
                    <View style={styles.messageFooter}>
                        {isMe && <Ionicons name="checkmark-done" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />}
                        <Text style={[styles.messageTime, isMe ? { color: '#9E9E9E' } : { color: 'rgba(255,255,255,0.8)' }]}>
                            {item.time}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View
                style={styles.header}
                onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.headerAvatarPress}
                    onPress={() => {
                        const targetUid = chat?.isGroup ? null : getOtherParticipantId();
                        if (targetUid) openProfileModal(targetUid);
                    }}
                    activeOpacity={chat?.isGroup ? 1 : 0.8}
                >
                    {/* Use the avatar computed by the service, or fallbacks if data structure differs */}
                    <Avatar
                        uri={chat.avatar || chat.photoURL || chat.image}
                        name={chat.name}
                        size={40}
                        key={chat.avatar || 'default'}
                    />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{chat.name}</Text>
                    <Text style={styles.headerStatus}>{chat.members ? `${chat.members} members active` : (chat.isOnline ? 'Online now' : 'Last seen recently')}</Text>
                </View>
                {canShowCallButton ? (
                    <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                        <Ionicons name={hasActiveHuddle ? 'call' : 'call-outline'} size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.callButtonPlaceholder} />
                )}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 24 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <View style={[
                    styles.inputContainer,
                    {
                        paddingBottom: Platform.OS === 'ios'
                            ? (keyboardVisible ? 8 : Math.max(insets.bottom, 12))
                            : 12
                    }
                ]}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Write a message..."
                            placeholderTextColor="#9E9E9E"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>
                    {inputText.trim().length > 0 && (
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                            <Ionicons name="send" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>

            <Modal
                visible={profileModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setProfileModalVisible(false)}
            >
                <View style={styles.profileOverlay}>
                    <TouchableOpacity style={styles.profileBackdrop} onPress={() => setProfileModalVisible(false)} />
                    <View style={styles.profileModal}>
                        <Avatar
                            uri={selectedProfile?.photoURL || ''}
                            name={selectedProfile?.name || 'Member'}
                            size={76}
                        />
                        <Text style={styles.profileName}>{selectedProfile?.name || 'Member'}</Text>
                        <Text style={styles.profileRole}>{selectedProfile?.role || 'Contact'}</Text>
                        <Text style={styles.profileAbout} numberOfLines={2}>
                            {selectedProfile?.about || 'Hey there! I am using Empylo.'}
                        </Text>

                        <View style={styles.profileActions}>
                            <TouchableOpacity
                                style={[styles.profileActionBtn, styles.profileActionPrimary]}
                                onPress={() => setProfileModalVisible(false)}
                            >
                                <Text style={styles.profileActionPrimaryText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8EDF4',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F3F6FA',
        borderWidth: 1,
        borderColor: '#E8EDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    headerAvatarPress: {
        marginRight: 12
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },
    headerStatus: {
        fontSize: 12,
        color: '#6A7385',
        fontWeight: '600',
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9F7F6'
    },
    callButtonPlaceholder: {
        width: 40,
        height: 40
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: 14,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    avatarTap: {
        marginRight: 8,
        marginTop: 2
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginTop: 0,
    },
    messageBubble: {
        maxWidth: '78%',
        paddingHorizontal: 13,
        paddingVertical: 10,
        borderRadius: 18,
        borderWidth: 1
    },
    bubbleMe: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E8EDF4',
        borderBottomRightRadius: 6,
    },
    bubbleOther: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
        borderBottomLeftRadius: 6,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },
    senderNameText: {
        fontSize: 12,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 3
    },
    textMe: {
        color: '#111827',
    },
    textOther: {
        color: '#FFFFFF',
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    messageTime: {
        fontSize: 11,
    },
    inputContainer: {
        paddingHorizontal: SPACING.lg,
        paddingTop: 10,
        backgroundColor: '#F3F6FA',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8EDF4',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 11 : 6,
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        maxHeight: 100,
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    profileOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24
    },
    profileBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    },
    profileModal: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 20,
        paddingVertical: 22,
        alignItems: 'center'
    },
    profileName: {
        fontSize: 19,
        fontWeight: '700',
        color: '#1A1A1A',
        marginTop: 12
    },
    profileRole: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: 4
    },
    profileAbout: {
        marginTop: 10,
        textAlign: 'center',
        color: '#616161',
        fontSize: 13,
        lineHeight: 18
    },
    profileActions: {
        width: '100%',
        marginTop: 18
    },
    profileActionBtn: {
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    profileActionPrimary: {
        backgroundColor: COLORS.primary
    },
    profileActionPrimaryText: {
        color: '#FFFFFF',
        fontWeight: '700'
    }
});

export default ChatDetailScreen;
