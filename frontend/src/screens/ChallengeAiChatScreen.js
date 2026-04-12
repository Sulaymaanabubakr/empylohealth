import React, { useMemo, useRef, useState, useEffect } from 'react';
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
import { COLORS } from '../theme/theme';
import { aiService } from '../services/api/aiService';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { AiMessageFormatter } from '../components/AiMessageFormatter';

const getLevelPalette = (level = 'medium') => {
    const normalized = String(level || 'medium').toLowerCase();
    if (normalized === 'high') {
        return { accent: '#D84315', bubble: '#FFF1F2', border: '#FFE0E6', icon: 'alert-circle-outline' };
    }
    if (normalized === 'low') {
        return { accent: '#43A047', bubble: '#F1F8E9', border: '#DCECC6', icon: 'leaf' };
    }
    return { accent: '#FB8C00', bubble: '#FFF8E1', border: '#FFE7B3', icon: 'weather-sunset' };
};

const buildMessageId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const ChallengeAiChatScreen = ({ navigation, route }) => {
    const { challenge } = route?.params || {};
    const insets = useSafeAreaInsets();
    const { userData } = useAuth();
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
    const palette = useMemo(() => getLevelPalette(challenge?.level), [challenge?.level]);
    const [messages, setMessages] = useState(() => ([
        {
            id: buildMessageId('assistant'),
            role: 'assistant',
            text: `We can talk through "${challenge?.title || 'this challenge'}" together. Tell me what feels most difficult about it right now.`,
        },
    ]));

    if (!challenge) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Text style={styles.emptyText}>AI challenge support is unavailable right now.</Text>
            </SafeAreaView>
        );
    }

    const handleSend = async () => {
        const text = String(inputText || '').trim();
        if (!text || isSending) return;

        const userMessage = {
            id: buildMessageId('user'),
            role: 'user',
            text,
        };
        const nextMessages = [...messages, userMessage];
        setMessages(nextMessages);
        setInputText('');
        setIsSending(true);

        try {
            const displayName = userData?.displayName || userData?.firstName || 'User';
            
            const response = await aiService.askAboutChallenge({
                challenge: {
                    ...challenge,
                    explanation: `[System Note: The user's name is ${displayName}. Address them naturally when appropriate.]\n\n${challenge?.explanation || ''}`
                },
                messages: nextMessages.map((item) => ({
                    role: item.role,
                    content: item.text,
                })),
                idempotencyKey: `challenge-ai:${challenge?.id || challenge?.title || 'challenge'}:${userMessage.id}`,
            });

            const reply = String(response?.reply || '').trim();
            if (!reply) {
                throw new Error('The assistant did not return a reply.');
            }

            setMessages((current) => ([
                ...current,
                {
                    id: buildMessageId('assistant'),
                    role: 'assistant',
                    text: reply,
                },
            ]));
            requestAnimationFrame(() => flatListRef.current?.scrollToEnd?.({ animated: true }));
        } catch (error) {
            showModal({
                type: 'error',
                title: 'AI unavailable',
                message: error?.message || 'Unable to continue with AI right now.',
            });
            setMessages((current) => current.filter((item) => item.id !== userMessage.id).concat(userMessage));
        } finally {
            setIsSending(false);
        }
    };

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
                {!isUser ? (
                    <View style={[styles.avatar, { backgroundColor: palette.bubble, borderColor: palette.border }]}>
                        <MaterialCommunityIcons name={palette.icon} size={18} color={palette.accent} />
                    </View>
                ) : null}
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : [styles.assistantBubble, { backgroundColor: palette.bubble, borderColor: palette.border }],
                ]}>
                    <View style={styles.messageContentWrap}>
                        {isUser ? (
                            <Text style={[styles.messageText, styles.userMessageText]}>{item.text}</Text>
                        ) : (
                            <AiMessageFormatter text={item.text} textStyle={[styles.messageText, styles.assistantMessageText]} />
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

    const renderItem = ({ item }) => <MessageItem item={item} />;

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerTitle}>Continue with AI</Text>
                        <Text style={styles.headerSubtitle}>{challenge.title}</Text>
                    </View>
                </View>

                <View style={[styles.challengeBanner, { borderColor: palette.border, backgroundColor: palette.bubble }]}>
                    <Text style={[styles.challengeBannerLevel, { color: palette.accent }]}>{String(challenge.level || 'medium').toUpperCase()}</Text>
                    <Text style={styles.challengeBannerBody}>
                        {String(challenge.explanation || challenge.description || '').trim() || 'Tell the assistant what feels most relevant for you right now.'}
                    </Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.messageList}
                    showsVerticalScrollIndicator={false}
                    onLayout={() => setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: false }), 50)}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
                />

                <View style={[
                    styles.composerWrap, 
                    { paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 12) + 12 }
                ]}>
                    <View style={styles.composer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ask about this challenge..."
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 24,
    },
    emptyText: {
        fontSize: 16,
        color: '#616161',
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerTextWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#616161',
        marginTop: 2,
    },
    challengeBanner: {
        marginHorizontal: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderRadius: 22,
        padding: 16,
    },
    challengeBannerLevel: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    challengeBannerBody: {
        fontSize: 14,
        lineHeight: 21,
        color: '#424242',
    },
    messageList: {
        paddingHorizontal: 18,
        paddingBottom: 12,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
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
        paddingBottom: 8,
    },
    messageContentWrap: {
        marginBottom: 6,
    },
    copyIconWrapper: {
        alignSelf: 'flex-end',
    },
    assistantBubble: {
        borderWidth: 1,
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
        color: '#263238',
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    composerWrap: {
        paddingHorizontal: 18,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
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
        marginTop: 8,
        textAlign: 'center',
        fontSize: 12,
        color: '#757575',
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

export default ChallengeAiChatScreen;
