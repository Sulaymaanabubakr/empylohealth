import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, ImageBackground, TouchableOpacity, StatusBar, Platform, Share, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const { width, height } = Dimensions.get('window');

const AFFIRMATIONS = [
    {
        id: '1',
        text: "Every step I take,\nbrings me closer to\nmy dreams",
        date: "Friday, 23 November",
        image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Sunrise/Sunset
    },
    {
        id: '2',
        text: "I am strong and capable;\nI can overcome any\nobstacle",
        date: "Saturday, 24 November",
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Forest
    },
    {
        id: '3',
        text: "I choose to be happy\nand love myself\ntoday",
        date: "Sunday, 25 November",
        image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Nature
    },
    {
        id: '4',
        text: "My potential is\nlimitless, and I choose\nwhere to spend my energy",
        date: "Monday, 26 November",
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Mountain
    },
    {
        id: '5',
        text: "I am improved by\nevery failure and\nsuccess",
        date: "Tuesday, 27 November",
        image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Hills
    },
    {
        id: '6',
        text: "I radiate positivity\nand good vibes",
        date: "Wednesday, 28 November",
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Beach
    },
    {
        id: '7',
        text: "I am enough,\njust as I am",
        date: "Thursday, 29 November",
        image: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Water
    },
    {
        id: '8',
        text: "I am grateful for\nall that I have and all\nthat is to come",
        date: "Friday, 30 November",
        image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Dark forest/Night
    },
    {
        id: '9',
        text: "I forgive myself and\nset myself free",
        date: "Saturday, 1 December",
        image: 'https://images.unsplash.com/photo-1499002238440-d264edd596ec?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Lavender
    },
    {
        id: '10',
        text: "I trust the process\nof life",
        date: "Sunday, 2 December",
        image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80', // Waterfall
    },
];

const AffirmationsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [likedItems, setLikedItems] = useState(new Set());

    const handleNext = () => {
        if (currentIndex < AFFIRMATIONS.length - 1) {
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

    const handleShare = async (text) => {
        try {
            await Share.share({
                message: `${text} - Daily Affirmation via Empylo`,
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
        Alert.alert("Voice Note", "Press and hold to record your own affirmation. (Feature coming soon)");
    };

    const onMomentumScrollEnd = (event) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const renderItem = ({ item }) => {
        const isLiked = likedItems.has(item.id);

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
                    <Text style={styles.date}>{item.date}</Text>
                    <Text style={styles.affirmationText}>{item.text}</Text>
                </View>

                {/* Bottom Actions */}
                <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 40 }]}>
                    <TouchableOpacity style={styles.actionButton} onPress={handlePrev}>
                        <Ionicons name="arrow-undo-outline" size={28} color={currentIndex === 0 ? "rgba(255,255,255,0.3)" : "#FFF"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(item.text)}>
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
                        <Ionicons name="arrow-redo-outline" size={28} color={currentIndex === AFFIRMATIONS.length - 1 ? "rgba(255,255,255,0.3)" : "#FFF"} />
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <FlatList
                ref={flatListRef}
                data={AFFIRMATIONS}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
