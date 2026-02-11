import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Alert, PanResponder, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useModal } from '../context/ModalContext';
import { Screen } from '../components/Screen';
import { FadeInView } from '../components/FadeInView';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/Buttons';
import { theme } from '../theme/theme';
import { assessmentService } from '../services/api/assessmentService';

const emojis = [
  { id: 'e1', label: 'Calm', symbol: '😊', color: '#4ECDC4' },
  { id: 'e2', label: 'Focused', symbol: '😌', color: '#45B7D1' },
  { id: 'e3', label: 'Stressed', symbol: '😣', color: '#FF6B6B' },
  { id: 'e4', label: 'Low', symbol: '😔', color: '#95A5A6' },
  { id: 'e5', label: 'Energized', symbol: '🤩', color: '#F39C12' },
];

const CustomSlider = ({ value, onValueChange, min = 0, max = 10, step = 1 }) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const sliderWidthRef = useRef(0);

  // RE-IMPLEMENTATION: Simple Touch Touchable Without PanResponder Complexities for now,
  // Or better: Let's use a simple View with onTouchEnd/Move? No, PanResponder is standard.

  // FIX: Let's revert to a robust implementation or native slider if this is too flaky.
  // User wants "Thicker line". 

  // Let's try one more robust custom slider implementation:

  return (
    <View
      style={styles.sliderContainer}
      onLayout={(e) => {
        setSliderWidth(e.nativeEvent.layout.width);
        sliderWidthRef.current = e.nativeEvent.layout.width;
      }}
      // Using a simpler touch handler for the whole track area
      onTouchStart={(e) => calculateValue(e.nativeEvent.locationX)}
      onTouchMove={(e) => calculateValue(e.nativeEvent.locationX)}
    >
      <View style={styles.trackBackground} pointerEvents="none" />
      <View style={[styles.trackFill, { width: `${((value - min) / (max - min)) * 100}%` }]} pointerEvents="none" />
      <View style={[styles.thumb, { left: `${((value - min) / (max - min)) * 100}%`, marginLeft: -16 }]} pointerEvents="none" />
    </View>
  );

  function calculateValue(x) {
    if (sliderWidthRef.current <= 0) return;
    let percentage = x / sliderWidthRef.current;

    // Clamp
    percentage = Math.max(0, Math.min(1, percentage));

    let newValue = min + percentage * (max - min);
    if (step) newValue = Math.round(newValue / step) * step;

    if (newValue !== value) onValueChange(newValue);
  }
};

export function CheckInScreen() {
  const navigation = useNavigation();
  const { showModal } = useModal();
  const [selectedMood, setSelectedMood] = useState('');
  const [focusLevel, setFocusLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting || isSaved) return;
    if (!selectedMood) {
      showModal({ type: 'error', title: 'Select Mood', message: 'Please select how you are feeling today.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const score = Math.round((focusLevel / 10) * 100);
      await assessmentService.submitAssessment('daily', score, { focusLevel, notes }, selectedMood);
      setIsSaved(true);
      navigation.navigate('MainTabs', { screen: 'Dashboard' });
    } catch (error) {
      console.error('Check-in submission failed', error);
      showModal({ type: 'error', title: 'Error', message: 'Failed to save check-in. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      hero={
        <View style={styles.heroArea}>
          <AppBar title="Daily Check-In" subtitle="How are you feeling?" />
          <Text style={styles.heroCopy}>Reflect on your day in seconds.</Text>
        </View>
      }
    >
      {/* Mood Section */}
      <FadeInView>
        <Text style={styles.sectionTitle}>I'm feeling...</Text>
        <View style={styles.emojiRow}>
          {emojis.map((emoji) => (
            <TouchableOpacity
              key={emoji.id}
              style={[
                styles.emojiChip,
                selectedMood === emoji.label && styles.emojiChipActive
              ]}
              onPress={() => setSelectedMood(emoji.label)}
              activeOpacity={0.7}
            >
              <Text style={styles.emojiSymbol}>{emoji.symbol}</Text>
              <Text style={[
                styles.emojiLabel,
                selectedMood === emoji.label && styles.emojiLabelActive
              ]}>{emoji.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FadeInView>

      {/* Energy Slider Section */}
      <FadeInView delay={150}>
        <Text style={styles.sectionTitle}>My energy is...</Text>
        <Card>
          <View style={styles.sliderContent}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sliderValue}>{Math.round(focusLevel)}</Text>
              <Text style={styles.sliderSub}>/10</Text>
            </View>

            <View style={styles.sliderWrapper}>
              <CustomSlider
                value={focusLevel}
                onValueChange={setFocusLevel}
                min={0}
                max={10}
              />
            </View>

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Low energy</Text>
              <Text style={styles.sliderLabel}>High energy</Text>
            </View>
          </View>
        </Card>
      </FadeInView>

      {/* Notes Section */}
      <FadeInView delay={250}>
        <Text style={styles.sectionTitle}>Quick notes</Text>
        <Card>
          <TextInput
            placeholder="Anything on your mind?..."
            placeholderTextColor={theme.colors.placeholder}
            style={styles.textArea}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </Card>
      </FadeInView>

      {/* Save Button */}
      <FadeInView delay={350}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSaved && styles.submitButtonSaved,
            !selectedMood && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || isSaved}
          activeOpacity={0.9}
        >
          <Text style={styles.submitText}>{isSaved ? '✓ Saved!' : isSubmitting ? 'Saving...' : 'Complete Check-in'}</Text>
        </TouchableOpacity>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroArea: {
    gap: theme.space.xs,
    marginBottom: theme.space.sm,
  },
  heroCopy: {
    fontFamily: theme.typography.body,
    fontSize: 16,
    color: theme.colors.inkMuted,
  },
  sectionTitle: {
    fontFamily: theme.typography.title,
    fontSize: 18,
    color: theme.colors.ink,
    marginBottom: theme.space.sm,
    marginTop: theme.space.sm,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  emojiChip: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emojiChipActive: {
    borderColor: theme.colors.brand,
    backgroundColor: '#E6FFFA', // Very light turquoise tint
    transform: [{ scale: 1.05 }],
  },
  emojiSymbol: {
    fontSize: 26,
    marginBottom: 4,
  },
  emojiLabel: {
    fontFamily: theme.typography.body,
    fontSize: 11,
    color: theme.colors.inkMuted,
    fontWeight: '500',
  },
  emojiLabelActive: {
    color: theme.colors.brand,
    fontWeight: '700',
  },
  sliderContent: {
    paddingVertical: 10,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sliderValue: {
    fontSize: 48,
    fontFamily: theme.typography.title,
    color: theme.colors.brand,
    fontWeight: '800', // Premium bold
  },
  sliderSub: {
    fontSize: 20,
    color: theme.colors.inkMuted,
    marginLeft: 4,
    fontFamily: theme.typography.body,
  },
  sliderWrapper: {
    height: 40,
    justifyContent: 'center',
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  trackBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E9ECEF',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.brand,
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.white,
    borderWidth: 4,
    borderColor: theme.colors.brand,
    position: 'absolute',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderLabel: {
    fontFamily: theme.typography.body,
    fontSize: 13,
    color: theme.colors.inkMuted,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 100,
    fontFamily: theme.typography.body,
    fontSize: 16,
    color: theme.colors.ink,
    textAlignVertical: 'top',
    padding: 0, // Remove Android padding
  },
  submitButton: {
    backgroundColor: theme.colors.brand,
    borderRadius: 20, // More pill-like
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    shadowColor: theme.colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonSaved: {
    backgroundColor: theme.colors.success,
    shadowColor: theme.colors.success,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.white,
    fontFamily: theme.typography.title,
    letterSpacing: 0.5,
  },
});

export default CheckInScreen;
