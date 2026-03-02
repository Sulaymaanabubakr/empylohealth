import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { circleService } from '../services/api/circleService';
import { useModal } from '../context/ModalContext';

const InviteLandingScreen = ({ navigation, route }) => {
  const token = String(route?.params?.token || '').trim();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [invite, setInvite] = useState(null);
  const { showModal } = useModal();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) {
        if (!cancelled) {
          setLoading(false);
          setInvite({ status: 'invalid', errorCode: 'missing_token' });
        }
        return;
      }
      try {
        const result = await circleService.resolveInviteToken(token);
        if (!cancelled) setInvite(result || null);
      } catch (error) {
        if (!cancelled) setInvite({ status: 'invalid', errorCode: error?.code || 'resolve_failed' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  const handleJoin = async () => {
    if (!token || joining) return;
    setJoining(true);
    try {
      const result = await circleService.joinCircleWithInvite(token);
      const circleId = String(result?.circleId || invite?.circlePreview?.id || '');
      showModal({ type: 'success', title: 'Joined', message: 'You joined the circle successfully.' });
      if (circleId) {
        navigation.replace('CircleDetail', { circle: { id: circleId } });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      showModal({
        type: 'error',
        title: 'Unable to join',
        message: error?.message || 'This invite is invalid, expired, or no longer available.'
      });
    } finally {
      setJoining(false);
    }
  };

  const isValid = invite?.status === 'valid';
  const circle = invite?.circlePreview || {};

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.card}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#0f766e" />
            <Text style={styles.helper}>Resolving invite…</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>
              {isValid ? `Join ${circle?.name || 'this circle'}` : 'Invite unavailable'}
            </Text>
            <Text style={styles.description}>
              {isValid
                ? (circle?.description || 'You were invited to join this circle.')
                : 'This invite is invalid, expired, revoked, or has reached its usage limit.'}
            </Text>
            {isValid ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleJoin} disabled={joining}>
                <Text style={styles.primaryBtnText}>{joining ? 'Joining…' : 'Join Circle'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('SupportGroups')}>
                <Text style={styles.secondaryBtnText}>Browse other circles</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#FFFFFF'
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  card: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3
  },
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  title: { fontSize: 21, fontWeight: '800', color: '#0f172a' },
  description: { marginTop: 8, color: '#475569', lineHeight: 20 },
  helper: { marginTop: 10, color: '#64748b' },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  secondaryBtn: {
    marginTop: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 13
  },
  secondaryBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 15 }
});

export default InviteLandingScreen;
