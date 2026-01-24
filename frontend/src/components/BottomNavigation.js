import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

    activeTab: 'Home' | 'Explore' | 'Chat' | 'Profile';

const BottomNavigation = ({ navigation, activeTab }) => {
    const insets = useSafeAreaInsets();

    const tabs = [
        {
            name: 'Home',
            label: 'Home',
            icon: (color) => <Ionicons name={activeTab === 'Home' ? "home" : "home-outline"} size={activeTab === 'Home' ? 24 : 26} color={color} />,
            onPress: () => navigation.navigate('Dashboard'),
        },
        {
            name: 'Explore',
            label: 'Explore',
            icon: (color) => <Feather name="compass" size={26} color={color} />,
            onPress: () => navigation.navigate('Explore'),
        },
        {
            name: 'Chat',
            label: 'Chat',
            icon: (color) => <Ionicons name={activeTab === 'Chat' ? "chatbubble" : "chatbubble-outline"} size={activeTab === 'Chat' ? 24 : 26} color={color} />,
            onPress: () => navigation.navigate('ChatList'),
        },
        {
            name: 'Profile',
            label: 'Profile',
            icon: (color) => <Ionicons name={activeTab === 'Profile' ? "person" : "person-outline"} size={activeTab === 'Profile' ? 24 : 26} color={color} />,
            onPress: () => navigation.navigate('Profile'),
        },
    ];

    return (
        <View style={[styles.bottomNavContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.bottomNav}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.name;
                    const iconColor = isActive ? COLORS.primary : '#BDBDBD';

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={styles.navItem}
                            onPress={tab.onPress}
                            activeOpacity={0.7}
                        >
                            {isActive ? (
                                <View style={[styles.activeNavIcon, { backgroundColor: '#E0F2F1' }]}>
                                    {tab.icon(COLORS.primary)}
                                </View>
                            ) : (
                                tab.icon('#BDBDBD')
                            )}
                            <Text style={[styles.navLabel, isActive && { color: COLORS.primary, fontWeight: '700' }]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        zIndex: 100,
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
    },
    navLabel: {
        fontSize: 11,
        color: '#BDBDBD',
        fontWeight: '600',
        marginTop: 4, // Added consistency for non-active items too
    },
});

export default BottomNavigation;
