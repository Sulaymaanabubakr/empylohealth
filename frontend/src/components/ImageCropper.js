import React, { useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    PanResponder,
    Animated,
    Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ImageCropper = ({ visible, imageUri, onClose, onCrop }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const pan = useRef(new Animated.ValueXY()).current;

    // Fixed Crop Box Size
    const CROP_SIZE = SCREEN_WIDTH - 40;

    // Gestures state
    const _lastScale = useRef(1);
    const _lastOffset = useRef({ x: 0, y: 0 });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: _lastOffset.current.x,
                    y: _lastOffset.current.y,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
                _lastOffset.current = { x: pan.x._value, y: pan.y._value };
            }
        })
    ).current;

    const handleSave = () => {
        if (!imageUri) return;
        onCrop(imageUri, {
            scale: _lastScale.current,
            x: _lastOffset.current.x,
            y: _lastOffset.current.y
        });
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Photo</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.cropperContainer}>
                    <View style={[styles.cropBox, { width: CROP_SIZE, height: CROP_SIZE }]}>
                        <Animated.Image
                            source={{ uri: imageUri }}
                            style={[
                                styles.image,
                                {
                                    width: '100%',
                                    height: '100%',
                                    transform: [
                                        { translateX: pan.x },
                                        { translateY: pan.y },
                                        { scale: scale }
                                    ]
                                }
                            ]}
                            {...panResponder.panHandlers}
                        />
                    </View>
                </View>

                <Text style={styles.instruction}>Drag to position</Text>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                        <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 8,
    },
    headerSpacer: {
        width: 60,
    },
    actions: {
        paddingHorizontal: 20,
        paddingBottom: 32,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
    },
    saveText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 16,
    },
    cropperContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    cropBox: {
        borderWidth: 2,
        borderColor: '#FFF',
        // overflow: 'hidden', // Don't clip so we can see what we're dragging, but overlay covers it?
        // Actually for cropping UI we usually mask.
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    image: {
        resizeMode: 'cover',
    },
    instruction: {
        color: '#AAA',
        textAlign: 'center',
        marginBottom: 40,
    }
});

export default ImageCropper;
