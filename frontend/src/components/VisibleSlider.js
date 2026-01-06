import React from 'react';
import { View, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../theme/theme';

const THUMB_SIZE = 40; // Larger thumb

const VisibleSlider = ({ value, onValueChange, steps = 5 }) => {
    // Calculate thumb position as percentage
    const thumbPosition = (value / steps) * 100;

    return (
        <View style={styles.container}>
            {/* Custom visible track background */}
            <View style={styles.customTrack}>
                {/* Active portion */}
                <View
                    style={[
                        styles.customTrackFill,
                        { width: `${thumbPosition}%` }
                    ]}
                />
            </View>

            {/* Custom large thumb */}
            <View
                style={[
                    styles.customThumb,
                    { left: `${thumbPosition}%` }
                ]}
            >
                <View style={styles.customThumbInner} />
            </View>

            {/* Native slider on top for interaction (invisible) */}
            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={steps}
                step={1}
                value={value}
                onValueChange={onValueChange}
                minimumTrackTintColor="transparent"
                maximumTrackTintColor="transparent"
                thumbTintColor="transparent"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 60,
        justifyContent: 'center',
        position: 'relative',
    },
    customTrack: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 14, // Even thicker track
        backgroundColor: '#E0E0E0',
        borderRadius: 7,
        overflow: 'hidden',
    },
    customTrackFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 7,
    },
    customThumb: {
        position: 'absolute',
        top: '50%',
        marginLeft: -THUMB_SIZE / 2,
        marginTop: -THUMB_SIZE / 2,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        zIndex: 5,
        pointerEvents: 'none', // Let touches pass through to native slider
    },
    customThumbInner: {
        width: '100%',
        height: '100%',
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary, // Colored shadow
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 4,
        borderColor: 'white',
    },
    slider: {
        width: '100%',
        height: 60,
        position: 'absolute',
        top: 0,
        left: 0,
    }
});

export default VisibleSlider;
