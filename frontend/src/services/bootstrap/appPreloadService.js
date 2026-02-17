import { resourceService } from '../api/resourceService';
import { circleService } from '../api/circleService';
import { assessmentService } from '../api/assessmentService';
import { chatService } from '../api/chatService';
import { screenCacheService } from './screenCacheService';
import { MAX_CIRCLE_MEMBERS, getCircleMemberCount } from '../circles/circleLimits';
import AsyncStorage from '@react-native-async-storage/async-storage';

let inflight = null;
let lastUid = null;
let lastRunAt = 0;
const MIN_RELOAD_INTERVAL_MS = 90 * 1000;

const shouldSkip = (uid) => {
  if (!uid) return true;
  const now = Date.now();
  if (inflight) return true;
  if (lastUid === uid && (now - lastRunAt) < MIN_RELOAD_INTERVAL_MS) return true;
  return false;
};

const runPreload = async (uid) => {
  const [
    items,
    circles,
    affs,
    stats,
    challs,
    recs,
    history,
    chats,
  ] = await Promise.all([
    resourceService.getExploreContent(),
    circleService.getAllCircles(),
    resourceService.getAffirmations(),
    assessmentService.getWellbeingStats(),
    assessmentService.getKeyChallenges(),
    assessmentService.getRecommendedContent(),
    assessmentService.getAssessmentHistory(10),
    chatService.preloadChatList(uid),
  ]);

  const publicCircles = (circles || []).filter((circle) => (circle?.type || 'public') === 'public');
  const joinedCircles = (circles || []).filter((circle) => Array.isArray(circle?.members) && circle.members.includes(uid));
  const supportGroupsPublic = publicCircles.filter((c) => {
    const isMember = Array.isArray(c?.members) && c.members.includes(uid);
    const isFull = !isMember && getCircleMemberCount(c) >= MAX_CIRCLE_MEMBERS;
    return !isFull;
  });

  await Promise.allSettled([
    screenCacheService.set(`explore:${uid}`, {
      activities: items || [],
      supportGroups: publicCircles || [],
      affirmations: affs || [],
    }),
    screenCacheService.set(`dashboard:${uid}`, {
      wellbeing: stats || null,
      challenges: challs || [],
      recommendations: recs || [],
    }),
    screenCacheService.set(`support_groups_public:${uid}`, supportGroupsPublic || []),
    screenCacheService.set(`support_groups_joined:${uid}`, joinedCircles || []),
    screenCacheService.set(`chat_list:${uid}`, chats || []),
    AsyncStorage.setItem(`chat_list_cache_v1:${uid}`, JSON.stringify(chats || [])),
    screenCacheService.set(`assessment_history:${uid}`, history || []),
  ]);
};

export const appPreloadService = {
  preloadForUser: async (uid) => {
    if (shouldSkip(uid)) return;
    inflight = runPreload(uid)
      .catch(() => {})
      .finally(() => {
        inflight = null;
        lastUid = uid;
        lastRunAt = Date.now();
      });
    await inflight;
  },
};
