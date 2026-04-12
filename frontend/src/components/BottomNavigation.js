import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const BottomNavigation = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View pointerEvents="box-none" style={[styles.bottomNavContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.bottomNav}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;
                    const isAiHub = route.name === 'AiHub';

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    let iconFn = (color) => <Ionicons name="square" size={24} color={color} />;
                    if (route.name === 'Dashboard') {
                        iconFn = (color) => <Ionicons name={isFocused ? "home" : "home-outline"} size={isFocused ? 24 : 26} color={color} />;
                    } else if (route.name === 'Explore') {
                        iconFn = (color) => <Feather name="compass" size={26} color={color} />;
                    } else if (route.name === 'AiHub') {
                        iconFn = (color) => <MaterialCommunityIcons name="robot-outline" size={28} color={color} />;
                    } else if (route.name === 'ChatList') {
                        iconFn = (color) => <Ionicons name={isFocused ? "chatbubble" : "chatbubble-outline"} size={isFocused ? 24 : 26} color={color} />;
                    } else if (route.name === 'Profile') {
                        iconFn = (color) => <Ionicons name={isFocused ? "person" : "person-outline"} size={isFocused ? 24 : 26} color={color} />;
                    }

                    // Render the raised AI center button
                    if (isAiHub) {
                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={options.tabBarTestID}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.aiNavItem}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.aiButton, isFocused && styles.aiButtonActive]}>
                                    {iconFn(isFocused ? '#FFFFFF' : '#FFFFFF')}
                                </View>
                                <Text style={[styles.navLabel, isFocused && { color: COLORS.primary, fontWeight: '700' }]}>
                                    AI
                                </Text>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={styles.navItem}
                            activeOpacity={0.7}
                        >
                            {isFocused ? (
                                <View style={[styles.activeNavIcon, { backgroundColor: '#E0F2F1' }]}>
                                    {iconFn(COLORS.primary)}
                                </View>
                            ) : (
                                iconFn('#BDBDBD')
                            )}
                            {route.name === 'ChatList' && options.tabBarBadge !== undefined && options.tabBarBadge !== null && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>{String(options.tabBarBadge)}</Text>
                                </View>
                            )}
                            <Text style={[styles.navLabel, isFocused && { color: COLORS.primary, fontWeight: '700' }]}>
                                {label === 'Dashboard' ? 'Home' : (label === 'ChatList' ? 'Chat' : label)}
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
        alignItems: 'flex-end',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    aiNavItem: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
        marginTop: -28,
    },
    aiButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 12,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    aiButtonActive: {
        backgroundColor: '#00897B',
        shadowOpacity: 0.5,
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
        marginTop: 4,
    },
    tabBadge: {
        position: 'absolute',
        top: -2,
        right: '24%',
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#E53935',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5
    },
    tabBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800'
    }
});

export default BottomNavigation;
