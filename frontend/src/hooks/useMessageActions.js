import { useCallback } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useToast } from '../context/ToastContext';
import { sanitizeChatMessageText } from '../utils/chatMessageSafety';

export const useMessageActions = ({ onReportMessage } = {}) => {
  const { showToast } = useToast();

  const copyMessageText = useCallback(async (message) => {
    const visibleText = sanitizeChatMessageText(message?.text || '');
    if (!visibleText.trim()) {
      showToast('Nothing to copy', 'warning');
      return;
    }
    await Clipboard.setStringAsync(visibleText);
    showToast('Message copied', 'success');
  }, [showToast]);

  const openMessageActions = useCallback((message, options = {}) => {
    const canReport = Boolean(options?.canReport && typeof onReportMessage === 'function');
    const optionLabels = ['Copy message'];
    if (canReport) optionLabels.push('Report message');
    optionLabels.push('Cancel');

    const handleSelection = (index) => {
      if (index === 0) {
        copyMessageText(message).catch(() => showToast('Unable to copy message', 'error'));
        return;
      }
      if (canReport && index === 1) {
        onReportMessage(message);
      }
    };

    if (Platform.OS === 'ios' && ActionSheetIOS.showActionSheetWithOptions) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: optionLabels,
          cancelButtonIndex: optionLabels.length - 1,
          destructiveButtonIndex: canReport ? 1 : undefined
        },
        handleSelection
      );
      return;
    }

    const buttons = [
      {
        text: 'Copy message',
        onPress: () => handleSelection(0)
      }
    ];
    if (canReport) {
      buttons.push({
        text: 'Report message',
        style: 'destructive',
        onPress: () => handleSelection(1)
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Message actions', 'Choose an action for this message.', buttons);
  }, [copyMessageText, onReportMessage, showToast]);

  return {
    openMessageActions,
    copyMessageText
  };
};

