import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { nativeCallService } from '../native/nativeCallService';

const BACKGROUND_NOTIFICATION_TASK = 'circles-background-notification-task';
const BACKGROUND_NOTIFICATION_RESULT = {
  NoData: 1,
  NewData: 2,
  Failed: 3,
};
const incomingHuddleDedupe = new Map();
let registerPromise = null;

const toObject = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
};

const extractNotificationData = (payload) => {
  const notificationData = toObject(payload?.notification?.request?.content?.data);
  const taskData = toObject(payload?.data);
  const nestedData = toObject(taskData?.data);
  return {
    ...taskData,
    ...notificationData,
    ...nestedData,
  };
};

const maybeShowIncomingHuddleFromBackground = async (payload) => {
  const data = extractNotificationData(payload);
  if (data?.type !== 'HUDDLE_STARTED' || !data?.huddleId) return false;

  const now = Date.now();
  const lastTs = Number(incomingHuddleDedupe.get(data.huddleId) || 0);
  if (now - lastTs < 15000) {
    return true;
  }
  incomingHuddleDedupe.set(data.huddleId, now);
  await nativeCallService.shouldShowIncomingHuddle(data).catch(() => false);
  return true;
};

if (!TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      return BACKGROUND_NOTIFICATION_RESULT.Failed;
    }

    const handled = await maybeShowIncomingHuddleFromBackground(data).catch(() => false);
    return handled
      ? BACKGROUND_NOTIFICATION_RESULT.NewData
      : BACKGROUND_NOTIFICATION_RESULT.NoData;
  });
}

export const registerBackgroundNotificationTask = async () => {
  if (registerPromise) return registerPromise;
  registerPromise = (async () => {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => false);
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    }
  })().finally(() => {
    registerPromise = null;
  });
  return registerPromise;
};

export { BACKGROUND_NOTIFICATION_TASK };
