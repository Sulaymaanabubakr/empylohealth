import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Animated, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../theme/theme';

const CustomSlider = ({ value = 0, onValueChange, steps = 5 }) => {
    const [width, setWidth] = useState(0);
    const pan = useRef(new Animated.Value(0)).current;
    const isDragging = useRef(false);
    const startPos = useRef(0);

    // Sync animation with value prop only if not dragging
    useEffect(() => {
        if (width > 0 && !isDragging.current) {
            const stepWidth = width / steps;
            const position = value * stepWidth;
            pan.setValue(position);
        }
    }, [value, width, steps]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                isDragging.current = true;
                // Capture current animated value as start point
                // Note: pan._value is used as we are modifying it directly
                startPos.current = Number(JSON.stringify(pan));
            },
            onPanResponderMove: (evt, gestureState) => {
                if (width === 0) return;

                // Calculate new position using delta
                let newPos = startPos.current + gestureState.dx;
                // Clamp
                newPos = Math.max(0, Math.min(newPos, width));

                pan.setValue(newPos);

                // Determine step and report
                const stepWidth = width / steps;
                const step = Math.round(newPos / stepWidth);

                onValueChange && onValueChange(step);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (width === 0) return;

                // Final position calc
                let newPos = startPos.current + gestureState.dx;
                newPos = Math.max(0, Math.min(newPos, width));

                const stepWidth = width / steps;
                const step = Math.round(newPos / stepWidth);
                const snapedPosition = step * stepWidth;

                // Animate snap
                Animated.spring(pan, {
                    toValue: snapedPosition,
                    useNativeDriver: false,
                    bounciness: 0,
                    speed: 20
                }).start(() => {
                    isDragging.current = false;
                });

                onValueChange && onValueChange(step);
            },
        })
    ).current;

    const onLayout = (e) => {
        setWidth(e.nativeEvent.layout.width);
    };

    return (
        <View style={styles.container}>
            <View
                style={styles.trackContainer}
                onLayout={onLayout}
            >
                {/* Background Track */}
                <View style={styles.trackBackground} />

                {/* Active Track (Animated) */}
                <Animated.View
                    style={[
                        styles.trackActive,
                        {
                            width: pan.interpolate({
                                inputRange: [0, width || 1], // Avoid divide by zero
                                outputRange: [0, width || 1],
                                extrapolate: 'clamp'
                            })
                        }
                    ]}
                />

                {/* Thumb */}
                <Animated.View
                    style={[
                        styles.thumb,
                        {
                            transform: [{
                                translateX: pan // Animated value maps directly to pixels
                            }],
                            marginLeft: -24, // Half of thumb width (48/2)
                        }
                    ]}
                    {...panResponder.panHandlers}
                >
                    <View style={styles.thumbInner}>
                        {/* Arrows SVG */}
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                            <Path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(-4, 0)" />
                            <Path d="M9 18L15 12L9 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(4, 0)" />
                        </Svg>
                    </View>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 24, // Thumb radius buffer
        width: '100%',
    },
    trackContainer: {
        height: 10,
        justifyContent: 'center',
        width: '100%',
    },
    trackBackground: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
    },
    trackActive: {
        position: 'absolute',
        left: 0,
        height: 8,
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    thumb: {
        position: 'absolute',
        left: 0,
    },
    thumbInner: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 2,
        borderColor: 'white',
    },
});

export default CustomSlider;
