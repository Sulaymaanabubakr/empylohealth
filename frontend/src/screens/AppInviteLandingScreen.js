import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { circleService } from '../services/api/circleService';
import { useAuth } from '../context/AuthContext';

const AppInviteLandingScreen = ({ navigation, route }) => {
  const token = String(route?.params?.token || '').trim();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({ status: 'invalid', errorCode: 'unknown' });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) {
        if (!cancelled) {
          setLoading(false);
          setState({ status: 'invalid', errorCode: 'missing_token' });
        }
        return;
      }
      try {
        const result = await circleService.resolveAppInvite(token);
        if (!cancelled) setState(result || { status: 'invalid', errorCode: 'resolve_failed' });
      } catch (error) {
        if (!cancelled) setState({ status: 'invalid', errorCode: error?.code || 'resolve_failed' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  const continueFlow = async () => {
    if (state?.status !== 'valid') return;
    if (user?.uid) {
      await circleService.consumeAppInvite(token).catch(() => {});
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      return;
    }
    navigation.navigate('Onboarding');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Invite</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.card}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0f766e" />
            <Text style={styles.helper}>Checking invite…</Text>
          </View>
        ) : state?.status === 'valid' ? (
          <>
            <Text style={styles.title}>You’re invited to Circles Health</Text>
            <Text style={styles.description}>Continue to open the app and get started.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={continueFlow}>
              <Text style={styles.primaryBtnText}>{user?.uid ? 'Continue' : 'Sign in to continue'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.title}>Invite unavailable</Text>
            <Text style={styles.description}>This invite is invalid, expired, revoked, or exhausted.</Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Onboarding')}>
              <Text style={styles.secondaryBtnText}>Go to onboarding</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  card: { margin: 16, borderRadius: 16, backgroundColor: '#FFFFFF', padding: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  title: { fontSize: 21, fontWeight: '800', color: '#0f172a' },
  description: { marginTop: 8, color: '#475569', lineHeight: 20 },
  helper: { marginTop: 10, color: '#64748b' },
  primaryBtn: { marginTop: 20, backgroundColor: '#0f766e', borderRadius: 12, alignItems: 'center', paddingVertical: 13 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { marginTop: 20, backgroundColor: '#E2E8F0', borderRadius: 12, alignItems: 'center', paddingVertical: 13 },
  secondaryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 15 }
});

export default AppInviteLandingScreen;
