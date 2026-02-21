import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { COLORS } from '../theme/theme';
import { huddleService } from '../services/api/huddleService';
import { callDiagnostics } from '../services/calling/callDiagnostics';
import { loopingSound } from '../services/audio/loopingSound';
import Avatar from '../components/Avatar';

// Audio playback is handled via loopingSound (expo-audio).

const safeCall = async (fn) => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

export default function IncomingHuddleScreen({ navigation, route }) {
  const huddleId = route?.params?.huddleId || null;
  const chatId = route?.params?.chatId || null;
  const chatName = route?.params?.chatName || 'Huddle';
  const callerName = route?.params?.callerName || chatName || 'Incoming Huddle';
  const avatar = route?.params?.avatar || '';

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const ringtoneRef = useRef(null);
  const ringtoneSessionRef = useRef(0);

  const stopRingtone = useCallback(async () => {
    ringtoneSessionRef.current += 1;
    const instance = ringtoneRef.current;
    ringtoneRef.current = null;
    if (!instance) return;
    await safeCall(() => loopingSound.stopAndUnload(instance));
  }, []);

  const startRingtone = useCallback(async () => {
    const sessionId = ringtoneSessionRef.current + 1;
    ringtoneSessionRef.current = sessionId;
    await stopRingtone();

    const instance = await safeCall(() => loopingSound.createAndPlay(
      require('../assets/sounds/ringback.wav'),
      { volume: 1.0 }
    ));
    if (!instance?.handle) return;
    if (ringtoneSessionRef.current !== sessionId) {
      await safeCall(() => loopingSound.stopAndUnload(instance));
      return;
    }
    ringtoneRef.current = instance;
  }, [stopRingtone]);

  useEffect(() => {
    if (!huddleId) return undefined;
    const ref = doc(db, 'huddles', huddleId);
    const unsub = onSnapshot(ref, (snap) => {
      setLoading(false);
      if (!snap.exists()) {
        setStatus('ended');
        return;
      }
      const data = snap.data() || {};
      const next = data.status || null;
      setStatus(next);
      if (next === 'ended' || data.isActive === false) {
        stopRingtone();
        navigation.goBack();
      }
    }, () => {
      setLoading(false);
    });
    return unsub;
  }, [huddleId, navigation, stopRingtone]);

  useEffect(() => {
    if (!huddleId) return;
    if (loading) return;
    if (status !== 'ringing') return;
    callDiagnostics.log(huddleId, 'incoming_screen_shown', { platform: Platform.OS });
    startRingtone();
  }, [huddleId, loading, startRingtone, status]);

  useEffect(() => () => {
    stopRingtone();
  }, [stopRingtone]);

  const accept = async () => {
    if (processing) return;
    setProcessing(true);
    callDiagnostics.log(huddleId, 'incoming_accept');
    await stopRingtone();
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
    await stopRingtone();
    await safeCall(() => huddleService.declineHuddle(huddleId));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="call" size={24} color="#FFFFFF" />
          <Text style={styles.title}>Incoming call</Text>
        </View>

        <View style={styles.body}>
          <Avatar
            uri={avatar}
            name={callerName}
            size={84}
            style={styles.avatar}
          />
          <Text style={styles.caller}>{callerName}</Text>
          <Text style={styles.subtitle}>{chatName}</Text>
          {loading && <ActivityIndicator style={{ marginTop: 18 }} color="#FFFFFF" />}
          {!loading && status && status !== 'ringing' && (
            <Text style={styles.status}>Status: {String(status)}</Text>
          )}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity disabled={processing} style={[styles.btn, styles.decline]} onPress={decline}>
            <Text style={styles.btnText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={processing} style={[styles.btn, styles.accept]} onPress={accept}>
            <Text style={styles.btnText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 10
  },
  avatar: {
    marginBottom: 16
  },
  caller: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    marginTop: 6
  },
  status: {
    color: 'rgba(255,255,255,0.72)',
    marginTop: 18
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
    backgroundColor: COLORS.primary
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
