import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { theme, COLORS } from '../theme/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  suffix?: string;
}

export const PrimaryButton: React.FC<ButtonProps> = ({ label, onPress, suffix }) => {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.primaryButtonText}>
        {label}
        {suffix ? `  ${suffix}` : ''}
      </Text>
    </TouchableOpacity>
  );
};

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ label, onPress }) => {
  return (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: theme.colors.brand,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: theme.typography.title,
    fontSize: 16,
    color: 'white',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: theme.typography.bodyMedium,
    fontSize: 14,
    color: theme.colors.ink,
  },
});
