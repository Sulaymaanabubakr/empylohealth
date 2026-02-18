import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, ImageBackground, TouchableOpacity, StatusBar, Share, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { resourceService } from '../services/api/resourceService';
import { useModal } from '../context/ModalContext';
import { buildAffirmationShareText } from '../utils/deepLinks';

const { width, height } = Dimensions.get('window');

const AffirmationsScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef(null);
    const { showModal } = useModal();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [likedItems, setLikedItems] = useState(new Set());
    const [affirmations, setAffirmations] = useState([]);
    const [loading, setLoading] = useState(true);
    const targetAffirmationId = route?.params?.affirmationId || null;

    useEffect(() => {
        const loadAffirmations = async () => {
            try {
                const items = await resourceService.getAffirmations();
                const cleaned = items
                    .map((item) => ({
                        ...item,
                        text: item.text || item.title || item.content || ''
                    }))
                    .filter((item) => item.text);
                setAffirmations(cleaned);
            } catch (error) {
                console.log('Failed to load affirmations', error);
                setAffirmations([]);
            } finally {
                setLoading(false);
            }
        };
        loadAffirmations();
    }, []);

    const handleNext = () => {
        if (currentIndex < affirmations.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
            setCurrentIndex(currentIndex - 1);
        }
    };

    useEffect(() => {
        if (!targetAffirmationId || !affirmations.length) return;
        const idx = affirmations.findIndex((item) => String(item.id) === String(targetAffirmationId));
        if (idx >= 0) {
            setCurrentIndex(idx);
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: idx, animated: false });
            }, 80);
        }
    }, [targetAffirmationId, affirmations]);

    const handleShare = async (item) => {
        try {
            await Share.share({
                message: buildAffirmationShareText({
                    text: item?.text || item?.title || item?.content || '',
                    affirmationId: item?.id
                }),
            });
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleLove = (id) => {
        const newLiked = new Set(likedItems);
        if (newLiked.has(id)) {
            newLiked.delete(id);
        } else {
            newLiked.add(id);
        }
        setLikedItems(newLiked);
    };

    const handleMic = () => {
        showModal({ type: 'info', title: 'Voice Note', message: 'Press and hold to record your own affirmation. (Feature coming soon)' });
    };

    const onMomentumScrollEnd = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const renderItem = ({ item }) => {
        const isLiked = likedItems.has(item.id);

        const contentText = item.text || item.title || item.content || '';
        const bgColor = item.color || '#0B1F1C';

        if (!item.image) {
            return (
                <View style={[styles.slide, { width, height, backgroundColor: bgColor }]}>
                    <View style={styles.overlay} />

                    <TouchableOpacity
                        style={[styles.backButton, { top: insets.top + 10 }]}
                        onPress={() => navigation.goBack()}
                    >
                        <View style={styles.backButtonCircle}>
                            <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.contentContainer}>
                        <Text style={styles.date}>{item.date || item.tag || ''}</Text>
                        <Text style={styles.affirmationText}>{contentText}</Text>
                    </View>

                    <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 40 }]}>
                        <TouchableOpacity style={styles.actionButton} onPress={handlePrev}>
                            <Ionicons name="arrow-undo-outline" size={28} color={currentIndex === 0 ? "rgba(255,255,255,0.3)" : "#FFF"} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
                            <Ionicons name="share-social-outline" size={28} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleMic}>
                            <Feather name="mic" size={28} color="#FFF" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => handleLove(item.id)}>
                            <Ionicons
                                name={isLiked ? "heart" : "heart-outline"}
                                size={28}
                                color={isLiked ? "#FF5252" : "#FFF"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
                            <Ionicons name="arrow-redo-outline" size={28} color={currentIndex === affirmations.length - 1 ? "rgba(255,255,255,0.3)" : "#FFF"} />
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <ImageBackground
                source={{ uri: item.image }}
                style={[styles.slide, { width, height }]}
                resizeMode="cover"
            >
                {/* Overlay for better text readability */}
                <View style={styles.overlay} />

                {/* Header Back Button */}
                <TouchableOpacity
                    style={[styles.backButton, { top: insets.top + 10 }]}
                    onPress={() => navigation.goBack()}
                >
                    <View style={styles.backButtonCircle}>
                        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                    </View>
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.contentContainer}>
                    <Text style={styles.date}>{item.date || item.tag || ''}</Text>
                    <Text style={styles.affirmationText}>{contentText}</Text>
                </View>

                {/* Bottom Actions */}
                <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 40 }]}>
                    <TouchableOpacity style={styles.actionButton} onPress={handlePrev}>
                        <Ionicons name="arrow-undo-outline" size={28} color={currentIndex === 0 ? "rgba(255,255,255,0.3)" : "#FFF"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item)}>
                        <Ionicons name="share-social-outline" size={28} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleMic}>
                        <Feather name="mic" size={28} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleLove(item.id)}>
                        <Ionicons
                            name={isLiked ? "heart" : "heart-outline"}
                            size={28}
                            color={isLiked ? "#FF5252" : "#FFF"}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={handleNext}>
                        <Ionicons name="arrow-redo-outline" size={28} color={currentIndex === affirmations.length - 1 ? "rgba(255,255,255,0.3)" : "#FFF"} />
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
            ) : affirmations.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>No affirmations yet.</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={affirmations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={width}
                    bounces={false}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000',
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    slide: {
        flex: 1,
        justifyContent: 'space-between', // Space items vertically
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)', // Dark overlay
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    date: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.9,
    },
    affirmationText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 44,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    bottomActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 30,
        width: '100%',
    },
    actionButton: {
        padding: 10,
    },
});

export default AffirmationsScreen;
