import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../theme/theme';

  children: ReactNode;

export const Screen = ({ children, hero }) => {
  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.backgroundBlob} />
      <View style={styles.backgroundBlobTwo} />
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {hero}
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    padding: theme.space.lg,
    gap: theme.space.lg,
    paddingBottom: 120,
  },
  backgroundBlob: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#DDF4F1',
  },
  backgroundBlobTwo: {
    position: 'absolute',
    bottom: 120,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EEF7FF',
  },
});
export default Screen;
