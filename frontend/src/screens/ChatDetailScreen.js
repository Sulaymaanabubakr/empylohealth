import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { chatService } from '../services/api/chatService';
import { huddleService } from '../services/api/huddleService';
import { circleService } from '../services/api/circleService';
import Avatar from '../components/Avatar';

const ChatDetailScreen = ({ navigation, route }) => {
    const chat = route?.params?.chat;
    const { user } = useAuth();
    const { showModal } = useModal();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);
    const insets = useSafeAreaInsets();
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);

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

    const handleCall = async () => {
        try {
            const result = await huddleService.startHuddle(chat.id, !!chat.isGroup);
            navigation.navigate('Huddle', { chat, huddleId: result.huddleId, roomUrl: result.roomUrl });
        } catch (error) {
            console.error('Failed to start huddle', error);
            navigation.navigate('Huddle', { chat });
        }
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
        // Design: Incoming (Left) = Teal, Outgoing (Right) = Light
        return (
            <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                {!isMe && (
                    <Avatar uri={chat.avatar} name={chat.name} size={32} />
                )}
                <TouchableOpacity
                    onLongPress={() => !isMe && handleMessageLongPress(item)}
                    activeOpacity={0.9} // Slight feedback but keep bubble look
                    style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}
                >
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
                <View style={{ marginRight: 12 }}>
                    {/* Use the avatar computed by the service, or fallbacks if data structure differs */}
                    <Avatar
                        uri={chat.avatar || chat.photoURL || chat.image}
                        name={chat.name}
                        size={40}
                        key={chat.avatar || 'default'}
                    />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{chat.name}</Text>
                    <Text style={styles.headerStatus}>{chat.members ? `${chat.members} members` : (chat.isOnline ? 'Online' : 'Offline')}</Text>
                </View>
                <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                    <Ionicons name="call" size={22} color={COLORS.primary} />
                </TouchableOpacity>
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
                    contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
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
                            placeholder="Your message..."
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    backButton: {
        marginRight: 10,
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
        fontWeight: '700',
        color: '#1A1A1A',
    },
    headerStatus: {
        fontSize: 12,
        color: '#757575',
        fontWeight: '400',
    },
    callButton: {
        padding: 8,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: 20,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-start', // Changed from flex-end to flex-start to align with avatar top
    },
    messageRowMe: {
        justifyContent: 'flex-end',
    },
    messageRowOther: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        marginTop: 0,
    },
    messageBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 16,
    },
    bubbleMe: {
        backgroundColor: '#F5F5F5', // Light/Grey for Outgoing
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: COLORS.primary, // Teal for Incoming
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    textMe: {
        color: '#1A1A1A', // Dark text for Light bubble
    },
    textOther: {
        color: '#FFFFFF', // White text for Teal bubble
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
        paddingTop: 12,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 4,
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default ChatDetailScreen;
