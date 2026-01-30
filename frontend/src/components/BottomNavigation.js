import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

activeTab: 'Home' | 'Explore' | 'Chat' | 'Profile';

const BottomNavigation = ({ state, descriptors, navigation }) => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.bottomNavContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
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

                    // Determine icon based on route name and focus state
                    // We can duplicate the icon logic here or pass it from MainTabs options
                    // For safety, let's keep the icon mappings here based on route.name
                    let iconFn = (color) => <Ionicons name="square" size={24} color={color} />;
                    if (route.name === 'Dashboard') {
                        iconFn = (color) => <Ionicons name={isFocused ? "home" : "home-outline"} size={isFocused ? 24 : 26} color={color} />;
                    } else if (route.name === 'Explore') {
                        iconFn = (color) => <Feather name="compass" size={26} color={color} />;
                    } else if (route.name === 'ChatList') {
                        iconFn = (color) => <Ionicons name={isFocused ? "chatbubble" : "chatbubble-outline"} size={isFocused ? 24 : 26} color={color} />;
                    } else if (route.name === 'Profile') {
                        iconFn = (color) => <Ionicons name={isFocused ? "person" : "person-outline"} size={isFocused ? 24 : 26} color={color} />;
                    }

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress} // Default tab press
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
