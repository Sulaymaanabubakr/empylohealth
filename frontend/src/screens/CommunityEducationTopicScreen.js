import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COMMUNITY_EDUCATION_TOPICS } from '../constants/communityEducationTopics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getProgressKey = (uid) => `community_education_progress_v1:${uid || 'guest'}`;

export default function CommunityEducationTopicScreen({ navigation, route }) {
    const { user } = useAuth();
    const listRef = useRef(null);
    const rawInitialIndex = Number(route?.params?.startIndex || 0);
    const initialIndex = Math.max(0, Math.min(COMMUNITY_EDUCATION_TOPICS.length - 1, Number.isFinite(rawInitialIndex) ? rawInitialIndex : 0));
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [completedIds, setCompletedIds] = useState([]);

    const progressKey = useMemo(() => getProgressKey(user?.uid), [user?.uid]);
    const totalTopics = COMMUNITY_EDUCATION_TOPICS.length;
    const currentTopic = COMMUNITY_EDUCATION_TOPICS[currentIndex] || COMMUNITY_EDUCATION_TOPICS[0];
    const isLastTopic = currentIndex >= totalTopics - 1;
    const allDone = completedIds.length >= totalTopics;

    useEffect(() => {
        const loadProgress = async () => {
            try {
                const raw = await AsyncStorage.getItem(progressKey);
                if (!raw) return;
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed?.completedIds)) {
                    setCompletedIds(parsed.completedIds);
                }
            } catch {
                // no-op
            }
        };
        loadProgress();
    }, [progressKey]);

    useEffect(() => {
        if (!listRef.current || !Number.isFinite(initialIndex)) return;
        if (initialIndex <= 0) return;
        listRef.current.scrollToIndex({ index: initialIndex, animated: false });
    }, [initialIndex]);

    const persistCompleted = async (ids) => {
        try {
            await AsyncStorage.setItem(progressKey, JSON.stringify({ completedIds: ids }));
        } catch {
            // no-op
        }
    };

    const markTopicDone = async (topicId) => {
        if (!topicId) return;
        if (completedIds.includes(topicId)) return;
        const next = [...completedIds, topicId];
        setCompletedIds(next);
        await persistCompleted(next);
    };

    const markAllDone = async () => {
        const allIds = COMMUNITY_EDUCATION_TOPICS.map((item) => item.id);
        setCompletedIds(allIds);
        await persistCompleted(allIds);
    };

    const nextSlide = async () => {
        await markTopicDone(currentTopic?.id);
        if (isLastTopic) return;
        listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    };

    const prevSlide = () => {
        if (currentIndex <= 0) return;
        listRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    };

    const onMomentumEnd = (event) => {
        const offsetX = event?.nativeEvent?.contentOffset?.x || 0;
        const next = Math.round(offsetX / SCREEN_WIDTH);
        if (next !== currentIndex) {
            setCurrentIndex(next);
        }
    };

    const renderItem = ({ item, index }) => {
        const completed = completedIds.includes(item.id);
        return (
            <View style={styles.slide}>
                <LinearGradient colors={['#0DAFA3', '#0C7B9B']} style={styles.hero}>
                    <View style={styles.heroIconWrap}>
                        <Ionicons name={item.icon} size={20} color="#0D7D75" />
                    </View>
                    <Text style={styles.heroTag}>{item.tag}</Text>
                    <Text style={styles.heroTitle}>{item.title}</Text>
                    <Text style={styles.heroSummary}>{item.summary}</Text>
                </LinearGradient>

                <View style={styles.bodyCard}>
                    {item.content.map((line, lineIndex) => (
                        <Text key={`${item.id}-${lineIndex}`} style={styles.bodyText}>
                            {line}
                        </Text>
                    ))}
                </View>

                <View style={styles.bottomRow}>
                    <Text style={styles.pageText}>Topic {index + 1} of {totalTopics}</Text>
                    <Text style={completed ? styles.doneText : styles.pendingText}>
                        {completed ? 'Completed' : 'Not completed'}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Community Learning</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                ref={listRef}
                data={COMMUNITY_EDUCATION_TOPICS}
                horizontal
                pagingEnabled
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumEnd}
                initialScrollIndex={initialIndex}
                onScrollToIndexFailed={() => {}}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index
                })}
            />

            <View style={styles.actionRow}>
                <TouchableOpacity onPress={prevSlide} disabled={currentIndex <= 0} style={[styles.secondaryBtn, currentIndex <= 0 && styles.disabledBtn]}>
                    <Text style={[styles.secondaryBtnText, currentIndex <= 0 && styles.disabledText]}>Previous</Text>
                </TouchableOpacity>
                {isLastTopic ? (
                    <TouchableOpacity onPress={markAllDone} style={styles.primaryBtn}>
                        <Text style={styles.primaryBtnText}>{allDone ? 'All done' : 'Mark all done'}</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={nextSlide} style={styles.primaryBtn}>
                        <Text style={styles.primaryBtnText}>Next topic</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 20
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
    slide: {
        width: SCREEN_WIDTH,
        paddingHorizontal: 20,
        paddingBottom: 10
    },
    hero: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 14
    },
    heroIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#E3FFFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    heroTag: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '700', marginBottom: 2 },
    heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 6 },
    heroSummary: { color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 18 },
    bodyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5EDF4',
        padding: 14
    },
    bodyText: {
        color: '#334155',
        fontSize: 14,
        lineHeight: 21,
        marginBottom: 12
    },
    bottomRow: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    pageText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
    doneText: { fontSize: 12, fontWeight: '800', color: '#0F9D58' },
    pendingText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
    actionRow: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 22,
        flexDirection: 'row',
        gap: 10
    },
    primaryBtn: {
        flex: 1,
        backgroundColor: '#00A99D',
        borderRadius: 10,
        alignItems: 'center',
        paddingVertical: 12
    },
    primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    secondaryBtn: {
        flex: 1,
        backgroundColor: '#E6F4F3',
        borderRadius: 10,
        alignItems: 'center',
        paddingVertical: 12
    },
    secondaryBtnText: { color: '#0C7B73', fontWeight: '700', fontSize: 14 },
    disabledBtn: { backgroundColor: '#EEF2F7' },
    disabledText: { color: '#9CA3AF' }
});
