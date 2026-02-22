import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from './Avatar';
import { getWellbeingRingColor } from '../utils/wellbeing';

const getLaneIndex = (member = {}) => {
  const numeric = Number(member?.wellbeingScore);
  if (Number.isFinite(numeric)) {
    if (numeric <= 34) return 0;
    if (numeric <= 64) return 1;
    return 2;
  }

  const label = String(member?.wellbeingLabel || member?.wellbeingStatus || '').toLowerCase();
  if (label.includes('critical') || label.includes('low') || label.includes('struggl')) return 0;
  if (label.includes('amber') || label.includes('moderate') || label.includes('fair')) return 1;
  if (label.includes('green') || label.includes('good') || label.includes('high') || label.includes('stable')) return 2;
  return 1;
};

const getFirstName = (name = '') => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts[0] : 'Member';
};

const CircleMemberLane = ({
  members = [],
  prioritizeUid = null,
  maxVisible = 6,
  avatarSize = 34,
}) => {
  const prepared = useMemo(() => {
    const list = Array.isArray(members) ? members.filter(Boolean) : [];
    const reordered = prioritizeUid
      ? [
          ...list.filter((item) => item.uid === prioritizeUid),
          ...list.filter((item) => item.uid !== prioritizeUid),
        ]
      : list;
    const visible = reordered.slice(0, maxVisible);
    const lanes = [[], [], []];
    visible.forEach((item) => {
      lanes[getLaneIndex(item)].push(item);
    });
    const counts = [lanes[0].length, lanes[1].length, lanes[2].length];
    const total = counts[0] + counts[1] + counts[2];
    const flex = total > 0 ? counts : [0, 0, 1];
    return { lanes, flex };
  }, [members, prioritizeUid, maxVisible]);

  const ringSize = avatarSize + 6;
  const laneTop = Math.max(14, Math.round(avatarSize * 0.56));
  const cardWidth = Math.max(40, Math.round(avatarSize * 1.2));
  const totalFlex = prepared.flex[0] + prepared.flex[1] + prepared.flex[2];
  const redEnd = totalFlex > 0 ? (prepared.flex[0] / totalFlex) : 0;
  const amberEnd = totalFlex > 0 ? ((prepared.flex[0] + prepared.flex[1]) / totalFlex) : 1;
  const blend = 0.05;
  const rawStops = [
    0,
    Math.max(0, redEnd - blend),
    Math.min(1, redEnd + blend),
    Math.max(0, amberEnd - blend),
    Math.min(1, amberEnd + blend),
    1,
  ];
  const gradientStops = rawStops.reduce((acc, value, idx) => {
    if (idx === 0) return [value];
    return [...acc, Math.max(acc[idx - 1], value)];
  }, []);

  const renderLane = (laneMembers) =>
    laneMembers.map((member) => {
      const ringColor = getWellbeingRingColor({
        wellbeingScore: member?.wellbeingScore,
        wellbeingLabel: member?.wellbeingLabel,
        wellbeingStatus: member?.wellbeingStatus,
      });
      return (
        <View key={String(member?.uid || member?.id || member?.name || Math.random())} style={[styles.memberCard, { width: cardWidth }]}>
          <View style={[styles.ringWrap, { width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderColor: ringColor || '#BDBDBD' }]}>
            <Avatar
              uri={member?.photoURL}
              name={member?.name}
              size={avatarSize}
            />
          </View>
          <Text
            style={[styles.memberName, { width: cardWidth }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {getFirstName(member?.name)}
          </Text>
        </View>
      );
    });

  return (
    <View style={[styles.stack, { minHeight: avatarSize + 32 }]}>
      <View style={[styles.rail, { top: laneTop }]}>
        <LinearGradient
          pointerEvents="none"
          style={styles.railGradient}
          colors={['#E74C3C', '#E74C3C', '#F4C542', '#F4C542', '#78D64B', '#78D64B']}
          locations={gradientStops}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
        <View style={[styles.dot, styles.dotRed]} />
        <View style={[styles.dot, styles.dotGreen]} />
      </View>

      <View style={styles.row}>
        <View style={[styles.lane, { flex: prepared.flex[0] }]}>{renderLane(prepared.lanes[0])}</View>
        <View style={[styles.lane, { flex: prepared.flex[1] }]}>{renderLane(prepared.lanes[1])}</View>
        <View style={[styles.lane, { flex: prepared.flex[2] }]}>{renderLane(prepared.lanes[2])}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  rail: {
    position: 'absolute',
    height: 8,
    width: '94%',
    left: '3%',
    borderRadius: 4,
    zIndex: 0,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  railGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
  },
  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    top: -3,
  },
  dotRed: {
    left: -8,
    backgroundColor: '#E74C3C',
  },
  dotGreen: {
    right: -8,
    backgroundColor: '#78D64B',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 6,
  },
  lane: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    columnGap: 2,
  },
  memberCard: {
    alignItems: 'center',
  },
  ringWrap: {
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  memberName: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 8,
    fontWeight: '700',
    color: '#616161',
    textAlign: 'center',
  },
});

export default CircleMemberLane;
