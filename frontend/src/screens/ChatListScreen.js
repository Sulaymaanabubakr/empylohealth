import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/api/chatService';
import Avatar from '../components/Avatar';

const ChatListScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [chats, setChats] = useState([]);

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = chatService.subscribeToChatList(user.uid, (updatedChats) => {
                setChats(updatedChats);
            });
            return () => unsubscribe();
        }
    }, [user]);

    // Note: Filtering now applies to the fetched 'chats'
    const filteredChats = chats.filter(chat =>
        (chat.name || 'Anonymous').toLowerCase().includes(searchQuery.toLowerCase()) // Fallback name if fetching details is complex
    );

    const renderItem = ({ item }) => {
        return (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('ChatDetail', { chat: item })}
        >
            <View style={styles.avatarContainer}>
                <Avatar uri={item.avatar || ''} name={item.name} size={56} />
                {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName}>{item.name}</Text>
                        <Text style={styles.chatTime}>{item.time}</Text>
                    </View>
                    <View style={styles.chatFooter}>
                        <Text style={[
                            styles.lastMessage,
                            item.unread > 0 ? styles.lastMessageUnread : null
                        ]} numberOfLines={1}>
                            {item.lastMessage}
                        </Text>
                        {item.unread > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>{item.unread}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
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
                <Text style={styles.headerTitle}>Chats</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9E9E9E" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search"
                    placeholderTextColor="#9E9E9E"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity>
                    <Feather name="filter" size={20} color="#757575" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredChats}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            />

            {/* Bottom Navigation Placeholder (To be replaced with actual component if needed, or rely on Tab Navigator if used) */}
            {/* Since we are in a Stack, we might want to replicate the bottom nav or assume this screen is part of a tab structure. 
                For now, we'll leave it as a full screen or add the visual bottom nav if requested. 
                The screenshot implies it's a main tab screen. 
            */}
            <View style={[styles.bottomNavContainer, { paddingBottom: insets.bottom }]}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
                        <Ionicons name="home-outline" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Explore')}>
                        <Feather name="compass" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Explore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <View style={styles.activeNavIcon}>
                            <Ionicons name="chatbubble" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.navLabel, { color: COLORS.primary, fontWeight: '700' }]}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Ionicons name="person-outline" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 24, // Large title like screenshot "Chats"
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center', // Or left? Screenshot shows left-ish but title centered usually standard. 
        // Screenshot actually shows "Chats" as a large title below the small header? No, it's the main header.
        // Let's stick to standard centered for now or left if desired. Screenshot: "Chats" is Big Title.
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5', // Or white with shadow? Screenshot looks like white pill on grey bg? No, distinct search bar.
        // Screenshot: Search is rounded input.
        backgroundColor: '#FFFFFF', // Actually looks like input field
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 25,
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        marginTop: SPACING.xs,
        paddingHorizontal: SPACING.md,
        height: 48,
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        height: '100%',
    },
    chatItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F9F9F9',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E0E0E0',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50', // Green
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    chatContent: {
        flex: 1,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        javaxContent: 'space-between',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
    },
    chatTime: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#757575',
        flex: 1,
        marginRight: 16,
    },
    lastMessageUnread: {
        color: '#1A1A1A', // Darker for unread? Or specific style?
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: COLORS.primary, // Teal
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    unreadText: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: 'transparent',
        zIndex: 100, // Ensure it sits on top of FlatList
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
        backgroundColor: '#E0F2F1', // Light shade of primary
    },
    navLabel: {
        fontSize: 11,
        color: '#BDBDBD',
        marginTop: 4,
    },
});

export default ChatListScreen;
