import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    FlatList,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/theme';
import { aiService } from '../services/api/aiService';
import { assessmentService } from '../services/api/assessmentService';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { subscriptionGuardService } from '../services/subscription/subscriptionGuardService';

const STORAGE_KEY = 'ai_hub_conversations';
const MAX_CONVERSATIONS = 30;

const QUICK_PROMPTS = [
    { label: '😰 Feeling stressed', text: 'I\'m feeling really stressed right now. Can you help me calm down?' },
    { label: '😴 Can\'t sleep', text: 'I\'ve been struggling to sleep lately. What can I do?' },
    { label: '💪 Need motivation', text: 'I\'m lacking motivation today. Help me get started.' },
    { label: '🧘 Mindfulness', text: 'Guide me through a quick mindfulness exercise.' },
    { label: '😟 Anxious thoughts', text: 'I\'m having anxious thoughts. How can I manage them?' },
    { label: '🤝 Feeling lonely', text: 'I feel disconnected from people around me. What should I do?' },
];

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const AiHubScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { userData, user } = useAuth();
    const { showModal } = useModal();
    const flatListRef = useRef(null);
    const [challenges, setChallenges] = useState([]);
    const [plan, setPlan] = useState('free');
    const displayName = userData?.displayName || userData?.firstName || 'there';

    // Conversation state
    const [conversations, setConversations] = useState([]);

    const storageKey = user?.uid ? `${STORAGE_KEY}:${user.uid}` : STORAGE_KEY;

    // Load conversations from storage
    useEffect(() => {
        AsyncStorage.getItem(storageKey)
            .then((raw) => {
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        setConversations(parsed);
                    }
                }
            })
            .catch(() => {});
    }, [storageKey]);

    // Load challenges for quick prompts is now handled in the focus listener

    // Persist conversations to storage
    const persistConversations = useCallback(async (updatedConvos) => {
        try {
            const trimmed = updatedConvos.slice(0, MAX_CONVERSATIONS);
            await AsyncStorage.setItem(storageKey, JSON.stringify(trimmed));
        } catch {}
    }, [storageKey]);

    // Start a new conversation
    const startNewConversation = useCallback(() => {
        navigation.navigate('AiHubChat', {});
    }, [navigation]);

    // Open an existing conversation
    const openConversation = useCallback((convo) => {
        navigation.navigate('AiHubChat', { convoId: convo.id });
    }, [navigation]);

    const handleQuickPrompt = (promptText) => {
        navigation.navigate('AiHubChat', { initialPrompt: promptText });
    };

    // Delete a conversation
    const deleteConversation = useCallback((convoId) => {
        setConversations((prev) => {
            const updated = prev.filter((c) => c.id !== convoId);
            persistConversations(updated);
            return updated;
        });
    }, [persistConversations]);

    // ─── RENDER: History Item ───
    const renderConversationItem = ({ item }) => (
        <TouchableOpacity
            style={styles.historyItem}
            onPress={() => openConversation(item)}
            activeOpacity={0.7}
        >
            <View style={styles.historyIcon}>
                <MaterialCommunityIcons name="chat-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.historyContent}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.historyPreview} numberOfLines={1}>{item.preview}</Text>
                <View style={styles.historyMeta}>
                    <Text style={styles.historyTime}>{formatDate(item.updatedAt)}</Text>
                    <Text style={styles.historyCount}>{item.messageCount} message{item.messageCount !== 1 ? 's' : ''}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteConversation(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="trash-outline" size={16} color="#D1D5DB" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    // Refresh data on focus (conversations and challenges)
    useEffect(() => {
        const loadData = () => {
            // Load Conversations
            AsyncStorage.getItem(storageKey).then((raw) => {
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        setConversations(parsed);
                    }
                }
            });

            // Immediately load cached challenges so UI isn't blank
            AsyncStorage.getItem('ai_hub_cached_challenges').then((cached) => {
                if (cached && plan !== 'free') {
                    setChallenges(JSON.parse(cached));
                }
            }).catch(() => {});

            // Fetch latest challenges in background
            subscriptionGuardService.getSubscriptionStatus()
                .then((status) => {
                    const nextPlan = String(status?.entitlement?.plan || 'free').toLowerCase();
                    setPlan(nextPlan);
                    if (nextPlan === 'free') {
                        setChallenges([]);
                        AsyncStorage.removeItem('ai_hub_cached_challenges').catch(() => {});
                    }
                })
                .catch(() => {
                    setPlan('free');
                    setChallenges([]);
                });

            assessmentService.getKeyChallenges()
                .then((data) => {
                    if (Array.isArray(data) && data.length > 0) {
                        const topChallenges = data.slice(0, 4);
                        setChallenges(topChallenges);
                        AsyncStorage.setItem('ai_hub_cached_challenges', JSON.stringify(topChallenges)).catch(() => {});
                    } else if (plan === 'free') {
                        setChallenges([]);
                        AsyncStorage.removeItem('ai_hub_cached_challenges').catch(() => {});
                    }
                })
                .catch(() => {});
        };

        // Run immediately on mount
        loadData();

        // And run every time the tab is focused
        const unsubscribe = navigation.addListener('focus', loadData);
        return unsubscribe;
    }, [navigation, plan, storageKey]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerIcon}>
                    <MaterialCommunityIcons name="robot-outline" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>AI Assistant</Text>
                    <Text style={styles.headerSubtitle}>Your wellbeing companion</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.newChatButton} onPress={startNewConversation} activeOpacity={0.8}>
                <Ionicons name="add-circle" size={22} color="#FFFFFF" />
                <Text style={styles.newChatButtonText}>New Conversation</Text>
            </TouchableOpacity>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={renderConversationItem}
                contentContainerStyle={[styles.historyList, { paddingBottom: insets.bottom + 100 }]}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.quickPromptsContainer}>
                        <Text style={styles.quickPromptsTitle}>Quick start</Text>
                        <View style={styles.quickPromptsGrid}>
                            {QUICK_PROMPTS.map((prompt, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.quickPromptChip}
                                    onPress={() => handleQuickPrompt(prompt.text)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.quickPromptText}>{prompt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {challenges.length > 0 && (
                            <>
                                <Text style={[styles.quickPromptsTitle, { marginTop: 20 }]}>Your challenges</Text>
                                {challenges.map((challenge, index) => (
                                    <TouchableOpacity
                                        key={challenge.id || index}
                                        style={styles.challengeChip}
                                        onPress={() => handleQuickPrompt(`Help me with my "${challenge.title}" challenge. ${challenge.explanation || ''}`)}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="lightning-bolt" size={16} color={COLORS.primary} />
                                        <Text style={styles.challengeChipText} numberOfLines={1}>{challenge.title}</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#9CA3AF" />
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                        <Text style={[styles.historyHeader, { marginTop: 24 }]}>Recent conversations</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyHistory}>
                        <MaterialCommunityIcons name="chat-processing-outline" size={56} color="#D1D5DB" />
                        <Text style={styles.emptyTitle}>No conversations yet</Text>
                        <Text style={styles.emptySubtitle}>Tap "New Conversation" to start chatting with your AI wellbeing assistant</Text>
                    </View>
                }
            />
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
        paddingHorizontal: 18,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: COLORS.primary,
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
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
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
    resetButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ─── New Chat Button ───
    newChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        marginHorizontal: 18,
        marginTop: 16,
        marginBottom: 8,
        paddingVertical: 14,
        borderRadius: 20,
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    newChatButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // ─── History ───
    historyList: {
        paddingHorizontal: 18,
        paddingTop: 8,
    },
    historyHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
        marginTop: 8,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0F2F1',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyContent: {
        flex: 1,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    historyPreview: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    historyMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historyTime: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    historyCount: {
        fontSize: 11,
        color: '#9CA3AF',
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ─── Empty State ───
    emptyHistory: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 120,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },



    // ─── Quick Prompts ───
    quickPromptsContainer: {
        marginTop: 8,
        paddingBottom: 16,
    },
    quickPromptsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    quickPromptsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    quickPromptChip: {
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickPromptText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
    },
    challengeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#CCFBF1',
        marginBottom: 8,
    },
    challengeChipText: {
        flex: 1,
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
        marginLeft: 10,
    },


});

export default AiHubScreen;
