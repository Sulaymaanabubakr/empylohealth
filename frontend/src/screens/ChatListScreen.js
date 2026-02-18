import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, Platform, RefreshControl, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api/chatService';
import Avatar from '../components/Avatar';
import { useModal } from '../context/ModalContext';

const chatListCacheKey = (uid) => `chat_list_cache_v1:${uid}`;

const ChatListScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { showModal } = useModal();
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [hasFirstSnapshot, setHasFirstSnapshot] = useState(false);
    const [hydratedCache, setHydratedCache] = useState(false);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [deletingChatId, setDeletingChatId] = useState(null);
    const [unreadState, setUnreadState] = useState({ byChat: {}, total: 0 });

    useEffect(() => {
        if (!user?.uid) return undefined;
        let active = true;

        const hydrate = async () => {
            try {
                const raw = await AsyncStorage.getItem(chatListCacheKey(user.uid));
                if (!active || !raw) return;
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setChats(parsed);
                }
            } catch {
                // Ignore cache read errors.
            } finally {
                if (active) setHydratedCache(true);
            }
        };

        hydrate();

        const unsubscribe = chatService.subscribeToChatList(user.uid, (updatedChats) => {
            if (!active) return;
            setChats(updatedChats);
            setHasFirstSnapshot(true);
            AsyncStorage.setItem(chatListCacheKey(user.uid), JSON.stringify(updatedChats)).catch(() => {});
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [user?.uid]);

    useEffect(() => {
        if (!deleteInProgress || !deletingChatId) return;
        const stillVisible = chats.some((c) => c.id === deletingChatId);
        if (!stillVisible) {
            setDeleteInProgress(false);
            setDeletingChatId(null);
        }
    }, [chats, deleteInProgress, deletingChatId]);

    useEffect(() => {
        if (!user?.uid) return undefined;
        return chatService.subscribeUnreadCounts(user.uid, (state) => {
            setUnreadState(state || { byChat: {}, total: 0 });
        });
    }, [user?.uid]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 900);
    }, []);

    const chatsWithUnread = useMemo(() => chats.map((chat) => ({
        ...chat,
        unread: unreadState?.byChat?.[chat.id] || 0
    })), [chats, unreadState?.byChat]);

    const filteredChats = chatsWithUnread.filter((chat) =>
        (chat.name || 'Anonymous').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const showInitialLoading = !hasFirstSnapshot && !hydratedCache && chatsWithUnread.length === 0;

    const renderItem = ({ item }) => {
        const lastMessage = item.lastMessage || (item.isGroup ? 'Group conversation' : 'Start chatting');
        const isLastMessageFromMe = item?.lastMessageSenderId === user?.uid;
        const lastMessageReadBy = Array.isArray(item?.lastMessageReadBy) ? item.lastMessageReadBy : [];
        const readByOthers = lastMessageReadBy.some((memberId) => memberId && memberId !== user?.uid);
        return (
            <TouchableOpacity
                style={styles.chatCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ChatDetail', { chat: item })}
            >
                <View style={styles.avatarContainer}>
                    <Avatar
                        uri={item.avatar || item.photoURL || item.image || ''}
                        name={item.name}
                        size={56}
                        showWellbeingRing
                        wellbeingScore={item?.wellbeingScore}
                        wellbeingLabel={item?.wellbeingLabel}
                    />
                    {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text numberOfLines={1} style={[styles.chatName, item?.isMuted && styles.chatNameMuted]}>{item.name}</Text>
                        <View style={styles.chatMetaRight}>
                            <Text style={styles.chatTime}>{item.time || ''}</Text>
                            {item?.isMuted && (
                                <View style={styles.mutedBadge}>
                                    <Ionicons name="notifications-off-outline" size={10} color="#64748B" />
                                    <Text style={styles.mutedBadgeText}>Muted</Text>
                                </View>
                            )}
                            {item.unread > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadText}>{item.unread > 99 ? '99+' : item.unread}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.chatFooter}>
                        {item.isGroup && (
                            <View style={styles.groupChip}>
                                <Ionicons name="people" size={12} color={COLORS.primary} />
                                <Text style={styles.groupChipText}>{item.members || 0}</Text>
                            </View>
                        )}
                        {isLastMessageFromMe && (
                            <Ionicons
                                name={readByOthers ? 'checkmark-done' : 'checkmark'}
                                size={14}
                                color={readByOthers ? '#34B7F1' : '#9AA3B2'}
                                style={styles.sentTick}
                            />
                        )}
                        <Text
                            style={[styles.lastMessage, item.unread > 0 && styles.lastMessageUnread]}
                            numberOfLines={1}
                        >
                            {lastMessage}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const handleDeleteChat = (chat) => {
        showModal({
            type: 'confirmation',
            title: 'Delete Chat',
            message: chat?.circleId
                ? 'This will remove you from the circle chat.'
                : 'This will remove this chat for you.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    setDeletingChatId(chat.id);
                    setDeleteInProgress(true);
                    const result = await chatService.deleteChat(chat.id, { deleteCircleIfLastAdmin: false });
                    if (result?.requiresCircleDeletion) {
                        setDeleteInProgress(false);
                        setDeletingChatId(null);
                        showModal({
                            type: 'confirmation',
                            title: 'Last Admin',
                            message: 'You are the last admin. Delete the entire circle and its chat permanently?',
                            confirmText: 'Delete Circle',
                            cancelText: 'Cancel',
                            onConfirm: async () => {
                                try {
                                    setDeletingChatId(chat.id);
                                    setDeleteInProgress(true);
                                    await chatService.deleteChat(chat.id, { deleteCircleIfLastAdmin: true });
                                    setChats((prev) => prev.filter((c) => c.id !== chat.id));
                                    showModal({
                                        type: 'success',
                                        title: 'Circle Deleted',
                                        message: 'The circle and its chat were deleted everywhere.'
                                    });
                                } catch (error) {
                                    setDeleteInProgress(false);
                                    setDeletingChatId(null);
                                    showModal({
                                        type: 'error',
                                        title: 'Delete Failed',
                                        message: error?.message || 'Could not delete this circle.'
                                    });
                                }
                            }
                        });
                        return;
                    }
                    setChats((prev) => prev.filter((c) => c.id !== chat.id));
                    showModal({
                        type: 'success',
                        title: 'Done',
                        message: result?.action === 'left_circle' ? 'You left the circle chat.' : 'Chat deleted.'
                    });
                } catch (error) {
                    setDeleteInProgress(false);
                    setDeletingChatId(null);
                    showModal({
                        type: 'error',
                        title: 'Delete Failed',
                        message: error?.message || 'Could not delete this chat.'
                    });
                }
            }
        });
    };

    const handleToggleMuteChat = (chat) => {
        const isMuted = !!chat?.isMuted;
        showModal({
            type: 'confirmation',
            title: isMuted ? 'Unmute Chat' : 'Mute Chat',
            message: isMuted
                ? 'Unmute this chat to receive message notifications again?'
                : 'Mute this chat? You will stop receiving notifications for new messages in this conversation.',
            confirmText: isMuted ? 'Unmute' : 'Mute',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    await chatService.setChatMuted(chat.id, !isMuted);
                    setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, isMuted: !isMuted } : c)));
                    showModal({
                        type: 'success',
                        title: isMuted ? 'Chat Unmuted' : 'Chat Muted',
                        message: isMuted
                            ? 'You will now receive notifications for this chat.'
                            : 'Notifications for this chat are now muted.'
                    });
                } catch (error) {
                    showModal({
                        type: 'error',
                        title: 'Update Failed',
                        message: error?.message || 'Could not update chat mute settings.'
                    });
                }
            }
        });
    };

    const renderLeftActions = (item) => {
        const isMuted = !!item?.isMuted;
        return (
            <TouchableOpacity
                style={[styles.swipeMuteAction, isMuted && styles.swipeUnmuteAction]}
                onPress={() => handleToggleMuteChat(item)}
                activeOpacity={0.9}
            >
                <Ionicons name={isMuted ? 'notifications-outline' : 'notifications-off-outline'} size={20} color="#FFFFFF" />
                <Text style={styles.swipeMuteText}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>
        );
    };

    const renderRightActions = (item) => (
        <TouchableOpacity style={styles.swipeDeleteAction} onPress={() => handleDeleteChat(item)} activeOpacity={0.9}>
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
    );

    const renderRow = ({ item }) => (
        <View style={styles.swipeRowWrap}>
            <Swipeable
                renderLeftActions={() => renderLeftActions(item)}
                renderRightActions={() => renderRightActions(item)}
                overshootLeft={false}
                overshootRight={false}
                containerStyle={styles.swipeContainer}
            >
                {renderItem({ item })}
            </Swipeable>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F6FA" />

            <View style={styles.headerRow}>
                <TouchableOpacity
                    onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'))}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={22} color="#1A1A1A" />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>Chats</Text>
                    <Text style={styles.headerSubtitle}>
                        {filteredChats.length} conversation{filteredChats.length === 1 ? '' : 's'}
                        {unreadState.total > 0 ? ` • ${unreadState.total} unread` : ''}
                    </Text>
                </View>
                <View style={styles.backButtonGhost} />
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#8A93A5" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search people or groups"
                    placeholderTextColor="#8A93A5"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {!!searchQuery && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={18} color="#9AA3B2" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.deleteHintBanner}>
                <Ionicons name="information-circle-outline" size={16} color="#1A1A1A" />
                <Text style={styles.deleteHintText}>
                    Swipe right to mute/unmute. Swipe left to delete. Only circle admins can delete a circle.
                </Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <FlatList
                    data={filteredChats}
                    renderItem={renderRow}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContent,
                        filteredChats.length === 0 && styles.listContentEmpty
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                    ListEmptyComponent={
                        showInitialLoading ? (
                            <View style={styles.emptyWrap}>
                                <View style={styles.emptyIconWrap}>
                                    <Ionicons name="time-outline" size={30} color={COLORS.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>Loading chats...</Text>
                                <Text style={styles.emptySubtitle}>Syncing your conversations.</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyWrap}>
                                <View style={styles.emptyIconWrap}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={30} color={COLORS.primary} />
                                </View>
                                <Text style={styles.emptyTitle}>No chats yet</Text>
                                <Text style={styles.emptySubtitle}>When you start a conversation, it will show up here.</Text>
                            </View>
                        )
                    }
                />
            </KeyboardAvoidingView>

            {deleteInProgress && (
                <View style={styles.deleteOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.deleteOverlayText}>Deleting...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F6FA'
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E8EDF4',
        alignItems: 'center',
        justifyContent: 'center'
    },
    backButtonGhost: {
        width: 38,
        height: 38
    },
    headerTextWrap: {
        flex: 1,
        marginLeft: 0,
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1A1A',
        textAlign: 'center'
    },
    headerSubtitle: {
        marginTop: 2,
        fontSize: 13,
        color: '#6A7385',
        fontWeight: '500',
        textAlign: 'center'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: SPACING.lg,
        marginTop: 8,
        marginBottom: SPACING.md,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1,
        borderColor: '#E8EDF4'
    },
    searchIcon: {
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        height: '100%',
        color: '#111827',
        fontSize: 15,
        fontWeight: '500'
    },
    clearButton: {
        padding: 4
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 20,
        gap: 10
    },
    listContentEmpty: {
        flex: 1,
        justifyContent: 'center'
    },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E8EDF4'
    },
    swipeRowWrap: {
        marginBottom: 10
    },
    swipeContainer: {
        borderRadius: 18,
        overflow: 'hidden'
    },
    swipeDeleteAction: {
        width: 96,
        marginLeft: 8,
        backgroundColor: '#D32F2F',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
    },
    swipeMuteAction: {
        width: 96,
        marginRight: 8,
        backgroundColor: '#F57C00',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
    },
    swipeUnmuteAction: {
        backgroundColor: '#00A99D'
    },
    swipeDeleteText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    },
    swipeMuteText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    },
    deleteHintBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E8EDF4'
    },
    deleteHintText: {
        flex: 1,
        marginLeft: 8,
        color: '#4A5568',
        fontSize: 12,
        fontWeight: '500'
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: '#44D16A',
        borderWidth: 2,
        borderColor: '#FFFFFF'
    },
    chatContent: {
        flex: 1
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    chatName: {
        flex: 1,
        color: '#111827',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8
    },
    chatNameMuted: {
        color: '#5F6B7A'
    },
    chatMetaRight: {
        alignItems: 'flex-end'
    },
    mutedBadge: {
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2F7',
        borderRadius: 9,
        paddingHorizontal: 6,
        paddingVertical: 2
    },
    mutedBadgeText: {
        marginLeft: 3,
        color: '#64748B',
        fontSize: 10,
        fontWeight: '700'
    },
    chatTime: {
        color: '#8A93A5',
        fontSize: 11,
        fontWeight: '600'
    },
    chatFooter: {
        marginTop: 5,
        flexDirection: 'row',
        alignItems: 'center'
    },
    groupChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E9F7F6',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 3,
        marginRight: 7
    },
    groupChipText: {
        marginLeft: 3,
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '700'
    },
    sentTick: {
        marginRight: 6
    },
    lastMessage: {
        flex: 1,
        color: '#6A7385',
        fontSize: 13,
        fontWeight: '500'
    },
    lastMessageUnread: {
        color: '#1F2937',
        fontWeight: '700'
    },
    unreadBadge: {
        marginTop: 5,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        paddingHorizontal: 6,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center'
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800'
    },
    emptyWrap: {
        alignItems: 'center',
        paddingHorizontal: 28
    },
    emptyIconWrap: {
        width: 66,
        height: 66,
        borderRadius: 33,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E9F7F6'
    },
    emptyTitle: {
        marginTop: 14,
        fontSize: 20,
        fontWeight: '800',
        color: '#111827'
    },
    emptySubtitle: {
        marginTop: 8,
        textAlign: 'center',
        color: '#6A7385',
        fontSize: 14,
        lineHeight: 20
    },
    deleteOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200
    },
    deleteOverlayText: {
        marginTop: 10,
        color: '#1A1A1A',
        fontSize: 14,
        fontWeight: '600'
    }
});

export default ChatListScreen;
