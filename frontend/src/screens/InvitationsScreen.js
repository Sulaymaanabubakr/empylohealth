import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { circleService } from '../services/api/circleService';
import { parseDeepLink } from '../utils/deepLinks';
import { pendingDeepLink } from '../services/deepLink/pendingDeepLink';

const buildRoute = (parsed) => {
  if (!parsed?.type) return null;
  if (parsed.type === 'invite' && parsed.token) return { screen: 'InviteLanding', params: { token: parsed.token } };
  if (parsed.type === 'app_invite' && parsed.token) return { screen: 'AppInviteLanding', params: { token: parsed.token } };
  if (parsed.type === 'circle' && parsed.id) return { screen: 'CircleDetail', params: { circle: { id: parsed.id } } };
  if (parsed.type === 'affirmation' && parsed.id) return { screen: 'Affirmations', params: { affirmationId: parsed.id } };
  if (parsed.type === 'resource' && parsed.id) return { screen: 'ActivityDetail', params: { resourceId: parsed.id } };
  return null;
};

const formatExpiry = (value) => {
  const millis = value?.toMillis?.() || 0;
  if (!millis) return 'No expiry';
  return `Expires ${new Date(millis).toLocaleDateString()}`;
};

const InvitationsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [pendingLink, setPendingLink] = useState(null);
  const [recentInvites, setRecentInvites] = useState([]);
  const [manualLink, setManualLink] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pending, inviteData] = await Promise.all([
        pendingDeepLink.read().catch(() => null),
        circleService.listUserInvitations().catch(() => ({ pendingInvites: [], recentInvites: [] }))
      ]);
      setPendingLink(pending || null);
      setRecentInvites(Array.isArray(inviteData?.recentInvites) ? inviteData.recentInvites : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  const openFromValue = async (value) => {
    const parsed = parseDeepLink(String(value || '').trim());
    const route = buildRoute(parsed);
    if (!route) {
      Alert.alert('Invalid link', 'Paste a valid Empylo invite or content link.');
      return;
    }
    if (pendingLink?.url && String(pendingLink.url) === String(value || '').trim()) {
      await pendingDeepLink.clear().catch(() => {});
      setPendingLink(null);
    }
    navigation.navigate(route.screen, route.params || {});
  };

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync().catch(() => '');
    if (!text) return;
    setManualLink(String(text).trim());
  };

  const statusLabel = useMemo(() => ({
    active: 'Active',
    expired: 'Expired',
    revoked: 'Revoked',
    exhausted: 'Used up'
  }), []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitations</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#0f766e" />
          <Text style={styles.helper}>Loading invitations…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Installed from a shared link?</Text>
            <Text style={styles.cardText}>Paste the invite/content link here and open it in-app.</Text>
            <TextInput
              value={manualLink}
              onChangeText={setManualLink}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://empylo.com/invite/..."
              style={styles.input}
            />
            <View style={styles.row}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={pasteFromClipboard}>
                <Text style={styles.secondaryBtnText}>Paste</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => openFromValue(manualLink)}>
                <Text style={styles.primaryBtnText}>Open Link</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!!pendingLink?.url && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pending from previous session</Text>
              <Text style={styles.cardText} numberOfLines={2}>{pendingLink.url}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => openFromValue(pendingLink.url)}>
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Invite Links You Created</Text>
            {recentInvites.length === 0 ? (
              <Text style={styles.cardText}>No recent invite links yet.</Text>
            ) : (
              recentInvites.slice(0, 20).map((item) => (
                <View key={item.id} style={styles.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inviteType}>{item.type === 'circle' ? 'Circle Invite' : 'App Invite'}</Text>
                    <Text style={styles.inviteUrl} numberOfLines={1}>{item.inviteUrl}</Text>
                    <Text style={styles.inviteMeta}>{formatExpiry(item.expiresAt)} • {statusLabel[item.status] || item.status}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={async () => {
                      await Clipboard.setStringAsync(item.inviteUrl || '');
                      Alert.alert('Copied', 'Invite link copied to clipboard.');
                    }}
                  >
                    <Ionicons name="copy-outline" size={17} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { padding: 16, paddingBottom: 36, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  helper: { marginTop: 10, color: '#64748b' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { color: '#0f172a', fontWeight: '700', fontSize: 16, marginBottom: 6 },
  cardText: { color: '#475569', lineHeight: 20 },
  input: { marginTop: 12, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#0f172a', backgroundColor: '#FFFFFF' },
  row: { marginTop: 10, flexDirection: 'row', gap: 8 },
  primaryBtn: { flex: 1, backgroundColor: '#0f766e', borderRadius: 10, alignItems: 'center', paddingVertical: 11 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  secondaryBtn: { width: 100, backgroundColor: '#E2E8F0', borderRadius: 10, alignItems: 'center', paddingVertical: 11 },
  secondaryBtnText: { color: '#0f172a', fontWeight: '700' },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  inviteType: { color: '#0f172a', fontWeight: '600' },
  inviteUrl: { color: '#475569', marginTop: 2, fontSize: 12 },
  inviteMeta: { color: '#64748b', marginTop: 2, fontSize: 12 },
  copyBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }
});

export default InvitationsScreen;
