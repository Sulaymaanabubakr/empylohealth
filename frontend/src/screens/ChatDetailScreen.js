import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api/chatService';
import { huddleService } from '../services/api/huddleService';

const ChatDetailScreen = ({ navigation, route }) => {
    const { chat } = route.params;
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

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

    const safeAvatar = chat.avatar || 'https://via.placeholder.com/150';

    const renderMessage = ({ item }) => {
        const isMe = item.isMe;
        // Design: Incoming (Left) = Teal, Outgoing (Right) = Light
        return (
            <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                {!isMe && (
                    // Optional: Show avatar next to message for group chats or other style
                    <Image source={{ uri: safeAvatar }} style={styles.messageAvatar} />
                )}
                <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    <Text style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}>
                        {item.text}
                    </Text>
                    <View style={styles.messageFooter}>
                        {/* Checkmark for 'Me' messages - usually colored if bubble is light, white if bubble dark */}
                        {isMe && <Ionicons name="checkmark-done" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />}
                        <Text style={[styles.messageTime, isMe ? { color: '#9E9E9E' } : { color: 'rgba(255,255,255,0.8)' }]}>
                            {item.time}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Image source={{ uri: safeAvatar }} style={styles.headerAvatar} />
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{chat.name}</Text>
                    <Text style={styles.headerStatus}>{chat.members ? `${chat.members} members` : (chat.isOnline ? 'Online' : 'Offline')}</Text>
                </View>
                <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                    <Ionicons name="call" size={22} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
                    showsVerticalScrollIndicator={false}
                />

                {/* Input Area */}
                <View style={[styles.inputContainer, { paddingBottom: Platform.OS === 'ios' ? 0 : 16 }]}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Your message..."
                            placeholderTextColor="#9E9E9E"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity style={styles.micButton}>
                            <Feather name="mic" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    {inputText.trim().length > 0 && (
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                            <Ionicons name="send" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
        paddingBottom: 12,
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
    micButton: {
        marginLeft: 8,
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
