import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';
import { huddleService } from '../services/api/huddleService';
import { callDiagnostics } from '../services/calling/callDiagnostics';
import { nativeCallService } from '../services/native/nativeCallService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const safeCall = async (fn) => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

export default function IncomingHuddleScreen({ navigation, route }) {
  const { user } = useAuth();
  const huddleId = route?.params?.huddleId || null;
  const chatId = route?.params?.chatId || null;
  const chatName = route?.params?.chatName || 'Huddle';
  const callerName = route?.params?.callerName || chatName || 'Incoming Huddle';
  const avatar = route?.params?.avatar || '';

  const [status, setStatus] = useState(null);
  const [missedStatus, setMissedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!huddleId) return undefined;
    const unsub = huddleService.subscribeToHuddle(huddleId, (data) => {
      setLoading(false);
      if (!data) {
        setStatus('ended');
        nativeCallService.dismissIncomingHuddle(huddleId, 'ended').catch(() => {});
        navigation.goBack();
        return;
      }
      const next = data.status || null;
      setStatus(next);
      if (next === 'ended' || data.isActive === false) {
        nativeCallService.dismissIncomingHuddle(huddleId, 'ended').catch(() => {});
        navigation.goBack();
      }
    });
    return unsub;
  }, [huddleId, navigation]);

  useEffect(() => {
    if (!huddleId || !user?.uid) return undefined;
    const unsub = huddleService.subscribeToMissedHuddleStatus(huddleId, user.uid, (item) => {
      const nextStatus = item?.status || 'pending';
      setMissedStatus(nextStatus);
      if (nextStatus === 'missed' || nextStatus === 'declined' || nextStatus === 'accepted') {
        if (nextStatus !== 'accepted') {
          nativeCallService.dismissIncomingHuddle(huddleId, nextStatus).catch(() => {});
        }
      }
      if (nextStatus === 'missed' || nextStatus === 'declined') {
        navigation.goBack();
      }
    });
    return unsub;
  }, [huddleId, navigation, user?.uid]);

  useEffect(() => () => {
    nativeCallService.stopIncomingRingtone().catch(() => {});
  }, []);

  useEffect(() => {
    if (!huddleId || loading || status !== 'ringing') return;
    callDiagnostics.log(huddleId, 'incoming_screen_shown', { platform: Platform.OS });
  }, [huddleId, loading, status]);

  const primaryName = isGroup ? chatName : callerName;
  const subtitleText = status === 'ongoing'
    ? 'Joining huddle...'
    : `${callerName} started the huddle`;

  const accept = async () => {
    if (processing) return;
    setProcessing(true);
    callDiagnostics.log(huddleId, 'incoming_accept');
    const accepted = await safeCall(() => huddleService.markHuddleAccepted(huddleId));
    if (!accepted?.success) {
      setProcessing(false);
      return;
    }
    await nativeCallService.setPendingJoinIntent({ huddleId, chatId, chatName, callerName, avatar }).catch(() => {});
    await nativeCallService.dismissIncomingHuddle(huddleId, 'accepted').catch(() => {});
    navigation.replace('Huddle', {
      chat: { id: chatId || 'chat', name: chatName, isGroup: true },
      huddleId,
      mode: 'join',
      callTapTs: Date.now()
    });
  };

  const decline = async () => {
    if (processing) return;
    setProcessing(true);
    callDiagnostics.log(huddleId, 'incoming_decline');
    await nativeCallService.dismissIncomingHuddle(huddleId, 'declined').catch(() => {});
    await safeCall(() => huddleService.declineHuddle(huddleId));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ExpoLinearGradient
        colors={['#071117', '#0E2830', '#EAF7F5']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.headerBadgeText}>Incoming huddle</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.avatarWrap}>
            <Avatar
              uri={avatar}
              name={callerName}
              size={96}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.caller}>{primaryName}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>

          {loading && <ActivityIndicator style={styles.loader} color="#FFFFFF" />}
          {!loading && status === 'ongoing' && (
            <Text style={styles.status}>Opening the huddle...</Text>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity disabled={processing} style={[styles.btn, styles.decline]} onPress={decline}>
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={processing} style={[styles.btn, styles.accept]} onPress={accept}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </ExpoLinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B0F14'
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between'
  },
  header: {
    alignItems: 'flex-start'
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 8
  },
  avatarWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 20
  },
  avatar: {
    marginBottom: 0
  },
  caller: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center'
  },
  loader: {
    marginTop: 22
  },
  status: {
    color: 'rgba(255,255,255,0.80)',
    marginTop: 20,
    fontSize: 14,
    fontWeight: '600'
  },
  controls: {
    flexDirection: 'row',
    gap: 14
  },
  btn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  accept: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    gap: 8
  },
  decline: {
    backgroundColor: COLORS.error
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16
  }
});
