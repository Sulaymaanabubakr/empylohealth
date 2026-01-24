import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, LayoutChangeEvent } from 'react-native';
import { COLORS } from '../theme/theme';

const THUMB_SIZE = 40;
const TRACK_HEIGHT = 6;

    onValueChange: (value) ;

const PremiumSlider = ({ value, onValueChange, steps = 5 }) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const pan = useRef(new Animated.Value(0)).current;
    const startXRef = useRef(0);

    // Sync thumb position with value prop
    useEffect(() => {
        if (containerWidth > 0) {
            const stepWidth = containerWidth / steps;
            const targetX = value * stepWidth;
            Animated.spring(pan, {
                toValue: targetX,
                useNativeDriver: false,
                friction: 8,
                tension: 50
            }).start();
        }
    }, [value, containerWidth, steps]);

    const updateValueFromX = (x) => {
        if (containerWidth <= 0) return;
        const clampedX = Math.max(0, Math.min(x, containerWidth));
        const stepWidth = containerWidth / steps;
        const newStep = Math.round(clampedX / stepWidth);

        if (newStep !== value) {
            onValueChange(newStep);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                const x = evt.nativeEvent.locationX;
                startXRef.current = x;
                updateValueFromX(x);
            },
            onPanResponderMove: (evt, gestureState) => {
                const currentX = startXRef.current + gestureState.dx;
                updateValueFromX(currentX);
            },
        })
    ).current;

    return (
        <View
            style={styles.container}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
        >
            {/* Track Background */}
            <View style={styles.trackBackground}>
                {/* Active Track Fill */}
                <Animated.View
                    style={[
                        styles.trackFill,
                        {
                            width: pan
                        }
                    ]}
                />
            </View>

            {/* Thumb */}
            <Animated.View
                style={[
                    styles.thumb,
                    {
                        transform: [{ translateX: pan }],
                    }
                ]}
            >
                <View style={styles.thumbInner} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 60,
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: THUMB_SIZE / 2,
    },
    trackBackground: {
        height: TRACK_HEIGHT,
        backgroundColor: '#D0D0D0',
        borderRadius: TRACK_HEIGHT / 2,
        width: '100%',
        overflow: 'hidden',
    },
    trackFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: TRACK_HEIGHT / 2,
    },
    thumb: {
        position: 'absolute',
        top: (60 - THUMB_SIZE) / 2,
        left: 0,
        marginLeft: -THUMB_SIZE / 2,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        zIndex: 10,
    },
    thumbInner: {
        flex: 1,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: COLORS.primary,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});

export default PremiumSlider;
