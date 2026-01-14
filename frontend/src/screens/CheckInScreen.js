import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Screen } from '../components/Screen';
import { FadeInView } from '../components/FadeInView';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/Buttons';
import { theme } from '../theme/theme';
import { assessmentService } from '../services/api/assessmentService';

const emojis = [
  { id: 'e1', label: 'Calm', symbol: '😊' },
  { id: 'e2', label: 'Focused', symbol: '😌' },
  { id: 'e3', label: 'Stressed', symbol: '😣' },
  { id: 'e4', label: 'Low', symbol: '😔' },
  { id: 'e5', label: 'Energized', symbol: '🤩' },
];

export function CheckInScreen() {
  const [selectedMood, setSelectedMood] = useState('');
  const [focusLevel, setFocusLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const score = Math.round((focusLevel / 10) * 100);
      await assessmentService.submitAssessment('daily', score, { focusLevel, notes }, selectedMood);
    } catch (error) {
      console.error('Check-in submission failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen
      hero={
        <View style={styles.heroArea}>
          <AppBar title="Daily Check-In" subtitle="How are you feeling?" />
          <Text style={styles.heroCopy}>Select your mood and tune your focus.</Text>
        </View>
      }
    >
      <FadeInView>
        <Text style={styles.sectionTitle}>Mood</Text>
        <View style={styles.emojiRow}>
          {emojis.map((emoji) => (
            <TouchableOpacity
              key={emoji.id}
              style={[styles.emojiChip, selectedMood === emoji.label && styles.emojiChipActive]}
              onPress={() => setSelectedMood(emoji.label)}
            >
              <Text style={styles.emojiSymbol}>{emoji.symbol}</Text>
              <Text style={styles.emojiLabel}>{emoji.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={styles.sectionTitle}>Focus level</Text>
        <Card>
          <Text style={styles.cardCopy}>Move the slider to reflect your energy.</Text>
          <Slider
            minimumValue={0}
            maximumValue={10}
            value={focusLevel}
            onValueChange={setFocusLevel}
            minimumTrackTintColor={theme.colors.brand}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Low</Text>
            <Text style={styles.sliderLabel}>High</Text>
          </View>
        </Card>
      </FadeInView>

      <FadeInView delay={300}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <Card>
          <TextInput
            placeholder="Anything you'd like to capture?"
            placeholderTextColor="#99A8A6"
            style={styles.textArea}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </Card>
        <PrimaryButton label={isSubmitting ? 'Saving...' : 'Save check-in'} onPress={handleSubmit} disabled={isSubmitting} />
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroArea: {
    gap: theme.space.sm,
  },
  heroCopy: {
    fontFamily: theme.typography.body,
    fontSize: 15,
    color: theme.colors.inkMuted,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: theme.typography.title,
    fontSize: 18,
    color: theme.colors.ink,
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  emojiChip: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    alignItems: 'center',
    width: '30%',
    gap: theme.space.xs,
  },
  emojiChipActive: {
    borderWidth: 2,
    borderColor: theme.colors.brand,
  },
  emojiSymbol: {
    fontSize: 24,
  },
  emojiLabel: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.inkMuted,
  },
  cardCopy: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.inkMuted,
    lineHeight: 20,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.inkMuted,
  },
  textArea: {
    minHeight: 110,
    fontFamily: theme.typography.body,
    color: theme.colors.ink,
  },
});
