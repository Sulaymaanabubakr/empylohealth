import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/theme';
import { aiService } from '../services/api/aiService';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { AiMessageFormatter } from '../components/AiMessageFormatter';
import { assessmentService } from '../services/api/assessmentService';

const STORAGE_KEY = 'ai_hub_conversations';
const MAX_CONVERSATIONS = 30;

const buildMessageId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const buildConvoId = () => `convo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const AiHubChatScreen = ({ navigation, route }) => {
    const { convoId: initialConvoId, initialPrompt } = route?.params || {};
    const insets = useSafeAreaInsets();
    const { userData, user } = useAuth();
    const { showModal } = useModal();
    const flatListRef = useRef(null);
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // Track keyboard visibility so composer padding adapts dynamically
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    const displayName = userData?.displayName || userData?.firstName || 'there';
    const storageKey = user?.uid ? `${STORAGE_KEY}:${user.uid}` : STORAGE_KEY;

    // Chat states
    const [activeConvoId, setActiveConvoId] = useState(initialConvoId || null);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]); // Needed just to update storage accurately
    const [isLoaded, setIsLoaded] = useState(false);
    const [userChallengesContext, setUserChallengesContext] = useState('');

    // Load User Challenges for AI Context
    useEffect(() => {
        assessmentService.getKeyChallenges()
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    const ctxText = "The user has completed a wellbeing assessment. Their current top challenges are:\n" + 
                        data.slice(0, 3).map(c => `- ${c.title} (Level: ${c.level || 'medium'}). Details: ${c.explanation || ''}`).join('\n');
                    setUserChallengesContext(ctxText);
                }
            })
            .catch(() => {});
    }, []);

    // Initial Load
    useEffect(() => {
        AsyncStorage.getItem(storageKey).then((raw) => {
            let convos = [];
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    convos = parsed;
                    setConversations(parsed);
                }
            }
            if (initialConvoId) {
                const found = convos.find((c) => c.id === initialConvoId);
                if (found) {
                    setMessages(found.messages || []);
                }
            } else if (initialPrompt) {
                const newConvoId = buildConvoId();
                setActiveConvoId(newConvoId);
                const initMessages = [
                    {
                        id: buildMessageId('assistant'),
                        role: 'assistant',
                        text: `Hi ${displayName}! 👋 I'm your wellbeing companion.\n\nYou asked: "${initialPrompt}"\n\nLet me help you with that...`
                    }
                ];
                setMessages(initMessages);
                // Immediately send initial prompt
                sendMessage(initialPrompt, initMessages, newConvoId, convos);
            } else {
                // Just start empty new chat
                setActiveConvoId(buildConvoId());
                setMessages([
                    {
                        id: buildMessageId('assistant'),
                        role: 'assistant',
                        text: `Hi ${displayName}! 👋 I'm your wellbeing companion. You can ask me anything about managing stress, building habits, improving sleep, or working through challenges.\n\nWhat's on your mind?`,
                    }
                ]);
            }
            setIsLoaded(true);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey, initialConvoId, initialPrompt, displayName]);

    // Persist to storage
    const saveConversation = useCallback((convoId, msgs, allConvos) => {
        if (!convoId || msgs.length <= 1) return allConvos;

        const firstUserMsg = msgs.find((m) => m.role === 'user');
        const title = firstUserMsg
            ? String(firstUserMsg.text).slice(0, 60) + (firstUserMsg.text.length > 60 ? '...' : '')
            : 'New conversation';
        const lastMsg = msgs[msgs.length - 1];
        const preview = String(lastMsg?.text || '').slice(0, 80) + (lastMsg?.text?.length > 80 ? '...' : '');

        const existing = allConvos.findIndex((c) => c.id === convoId);
        const convoObj = {
            id: convoId,
            title,
            preview,
            messageCount: msgs.filter((m) => m.role === 'user').length,
            updatedAt: Date.now(),
            createdAt: existing >= 0 ? allConvos[existing].createdAt : Date.now(),
            messages: msgs,
        };

        let updated;
        if (existing >= 0) {
            updated = [...allConvos];
            updated[existing] = convoObj;
        } else {
            updated = [convoObj, ...allConvos];
        }
        updated.sort((a, b) => b.updatedAt - a.updatedAt);
        const trimmed = updated.slice(0, MAX_CONVERSATIONS);
        
        AsyncStorage.setItem(storageKey, JSON.stringify(trimmed)).catch(() => {});
        setConversations(trimmed);
        return trimmed;
    }, [storageKey]);

    const sendMessage = useCallback(async (text, currentMsgs = messages, currentConvoId = activeConvoId, currentConvos = conversations) => {
        const trimmed = String(text || '').trim();
        if (!trimmed || isSending) return;

        const userMessage = {
            id: buildMessageId('user'),
            role: 'user',
            text: trimmed,
        };
        const nextMessages = [...currentMsgs, userMessage];
        setMessages(nextMessages);
        
        // Only clear input if the user actually typed this (not if it was an initialPrompt)
        if (text === inputText) {
            setInputText('');
        }
        
        setIsSending(true);

        try {
            const response = await aiService.askAboutChallenge({
                challenge: {
                    id: 'ai-hub-general',
                    title: 'General Wellbeing Profile',
                    level: 'medium',
                    explanation: `[System Note: The user's name is ${displayName}. Address them naturally when appropriate.]\n\n${userChallengesContext || 'Open conversation with the AI wellbeing assistant.'}`,
                },
                messages: nextMessages.map((item) => ({
                    role: item.role,
                    content: item.text,
                })),
                idempotencyKey: `ai-hub:${userMessage.id}`,
            });

            const reply = String(response?.reply || '').trim();
            if (!reply) throw new Error('The assistant did not return a reply.');

            const withReply = [
                ...nextMessages,
                { id: buildMessageId('assistant'), role: 'assistant', text: reply },
            ];
            setMessages(withReply);
            
            // Save to storage
            saveConversation(currentConvoId, withReply, currentConvos);
            
            requestAnimationFrame(() => flatListRef.current?.scrollToEnd?.({ animated: true }));
        } catch (error) {
            const errorMessage = error?.message || 'Unable to reach AI right now.';
            if (errorMessage.includes('credits') || error?.code === 'functions/402') {
                showModal({
                    type: 'error',
                    title: 'AI credits low',
                    message: 'You\'ve used your available AI credits. Upgrade your plan or purchase a boost to continue.',
                });
            } else {
                showModal({ type: 'error', title: 'AI unavailable', message: errorMessage });
            }
        } finally {
            setIsSending(false);
        }
    }, [messages, isSending, showModal, activeConvoId, conversations, saveConversation, inputText]);

    const handleSend = () => sendMessage(inputText);

    const checkSaveAndGoBack = () => {
        if (activeConvoId && messages.length > 1) {
            saveConversation(activeConvoId, messages, conversations);
        }
        navigation.goBack();
    };

    // ─── RENDER: Chat Message ───
    const MessageItem = ({ item }) => {
        const [copied, setCopied] = useState(false);
        const isUser = item.role === 'user';

        const handleCopy = async () => {
            if (!item.text) return;
            await Clipboard.setStringAsync(item.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        };

        if (!item.text) return null;

        return (
            <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAssistant]}>
                {!isUser && (
                    <View style={styles.avatar}>
                        <MaterialCommunityIcons name="robot-outline" size={18} color={COLORS.primary} />
                    </View>
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
                    <View style={styles.messageContentWrap}>
                        {isUser ? (
                            <Text style={styles.userMessageText}>{item.text}</Text>
                        ) : (
                            <AiMessageFormatter text={item.text} textStyle={styles.assistantMessageText} />
                        )}
                    </View>
                    <TouchableOpacity 
                        onPress={handleCopy} 
                        style={styles.copyIconWrapper}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons 
                            name={copied ? "checkmark-done" : "copy-outline"} 
                            size={14} 
                            color={isUser ? "rgba(255,255,255,0.7)" : "#9CA3AF"} 
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderMessage = ({ item }) => <MessageItem item={item} />;

    if (!isLoaded) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={checkSaveAndGoBack}>
                        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerTitle}>AI Assistant</Text>
                        <Text style={styles.headerSubtitle}>
                            {messages.filter((m) => m.role === 'user').length} messages
                        </Text>
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    showsVerticalScrollIndicator={false}
                    onLayout={() => setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: false }), 50)}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
                />

                {isSending && (
                    <View style={styles.typingIndicator}>
                        <MaterialCommunityIcons name="robot-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.typingText}>AI is thinking...</Text>
                    </View>
                )}

                <View style={[
                    styles.composerWrap, 
                    { paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 12) + 12 }
                ]}>
                    <View style={styles.composer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask me anything..."
                            placeholderTextColor="#9E9E9E"
                            multiline
                            value={inputText}
                            onChangeText={setInputText}
                            editable={!isSending}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!String(inputText || '').trim() || isSending) && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!String(inputText || '').trim() || isSending}
                        >
                            {isSending ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>Each follow-up message uses AI credits based on your plan.</Text>
                    <Text style={styles.disclaimerText}>
                        I’m here to offer guidance and help you reflect, but I’m not a medical or mental health professional. If you’re experiencing mental health difficulties, please seek support from a qualified professional.
                    </Text>
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
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingBottom: 14,
        paddingTop: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTextWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    messageList: {
        paddingHorizontal: 18,
        paddingBottom: 12,
        paddingTop: 16,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 14,
        alignItems: 'flex-end',
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    messageRowAssistant: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0F2F1',
        backgroundColor: '#E0F2F1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '82%',
        minWidth: 80,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8, // reduced slightly to account for copy icon
    },
    messageContentWrap: {
        marginBottom: 6,
    },
    copyIconWrapper: {
        alignSelf: 'flex-end',
    },
    assistantBubble: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        flex: 1,
    },
    userBubble: {
        backgroundColor: COLORS.primary,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    assistantMessageText: {
        color: '#1F2937',
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 26,
        paddingVertical: 6,
        gap: 6,
    },
    typingText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
    },
    composerWrap: {
        paddingHorizontal: 18,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },
    composer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#F7F7F7',
        borderRadius: 22,
        paddingLeft: 14,
        paddingRight: 10,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        maxHeight: 110,
        fontSize: 15,
        color: '#1F2937',
        paddingTop: 8,
        paddingBottom: 8,
        paddingRight: 10,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    sendButtonDisabled: {
        opacity: 0.45,
    },
    helperText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 11,
        marginTop: 10,
    },
    disclaimerText: {
        textAlign: 'center',
        color: '#A1A1AA', // subtle, muted color
        fontSize: 10, // distinctly smaller than helper text
        marginTop: 6,
        paddingHorizontal: 10,
        lineHeight: 14,
    },
});

export default AiHubChatScreen;
